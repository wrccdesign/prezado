import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireQuotaOrGuest } from "../_shared/calculo-guard.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateEmbeddings, generateQueryEmbedding, toVectorLiteral } from "../_shared/embeddings.ts";
import { extractEnv } from "../_shared/rate-limit.ts";
import { aiChatText } from "../_shared/ai.ts";
import { normalizeTermKey, searchDatajudLive } from "../_shared/datajud-live.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-payment-env, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Janela em que um termo já buscado ao vivo responde só pelo cache local. */
const CACHE_WINDOW_HOURS = 24 * 7;


const SYSTEM_PROMPT_BUSCA = `Você é um especialista em pesquisa jurídica brasileira.
Interprete a consulta do advogado e gere uma query expandida para busca semântica.
Retorne APENAS JSON válido, sem markdown, sem explicações.

Schema:
{
  "query_expandida": string,
  "keywords": string[],
  "filtros_sugeridos": {
    "tribunal": string | null,
    "ramos_direito": string | null,
    "instancia": string | null
  },
  "consultas_alternativas": string[],
  "intencao_detectada": string
}

Regras:
- query_expandida: enriqueça com termos técnicos que juízes usam em suas decisões, sinônimos jurídicos e artigos de lei relacionados (máx. 300 caracteres)
- keywords: 5-10 termos exatos para full-text search no PostgreSQL (use termos que aparecem em ementas e acórdãos)
- consultas_alternativas: 3 variações para ampliar resultados

Exemplos de enriquecimento:
"acidente de carro com culpa dos dois lados" → inclua: culpa concorrente, art. 945 CC, compensação de culpas
"plano de saúde negando cirurgia" → inclua: negativa de cobertura, rol ANS, Lei 9656/98, tutela de urgência`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireQuotaOrGuest(req, "search", corsHeaders, 3);
  if (auth instanceof Response) return auth;
  const _userId = auth.userId ?? undefined;
  const isGuest = auth.guest;

  try {
    const { query, filters } = await req.json();
    if (!query || typeof query !== "string") {
      throw new Error("Query é obrigatória");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Step 0: decidir se a busca sob demanda no DataJud vale a pena — só para
    // usuário autenticado e apenas quando o termo não foi consultado ao vivo
    // recentemente. A chamada em si sai depois da expansão da IA (Step 1),
    // porque os termos acentuados dela casam melhor com o índice do CNJ.
    const termKey = normalizeTermKey(query, filters || {});
    let shouldGoLive = false;
    let cacheHit = false;
    if (!isGuest) {
      const { data: cacheRow } = await admin
        .from("search_cache")
        .select("fetched_at")
        .eq("term_key", termKey)
        .maybeSingle();

      const fresh = cacheRow?.fetched_at &&
        Date.now() - new Date(cacheRow.fetched_at).getTime() < CACHE_WINDOW_HOURS * 3600_000;

      if (fresh) cacheHit = true;
      else shouldGoLive = true;
    }



    // Step 1: Use AI to expand the query
    let searchQuery = query;
    let aiData: any = null;

    try {
      if (isGuest) throw new Error("guest-skip");

      const content = await aiChatText({
        model: "light",
        functionName: "search-jurisprudencia",
        userId: _userId,
        environment: extractEnv(req),
        messages: [
          { role: "system", content: SYSTEM_PROMPT_BUSCA },
          { role: "user", content: `Consulta: "${query}"\nFiltros ativos: ${JSON.stringify(filters || {})}` },
        ],
      });
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiData = JSON.parse(jsonMatch[0]);
        if (aiData.keywords && aiData.keywords.length > 0) {
          searchQuery = aiData.keywords.join(" OR ");
        }
      }
    } catch (e) {
      console.error("Query expansion failed, using original query:", e instanceof Error ? e.message : e);
    }

    // Step 1b: dispara a consulta ao vivo no CNJ (em paralelo com o FTS)
    const liveTerm = (aiData?.keywords?.slice(0, 3) as string[] | undefined)?.join(" ") || query;
    const livePromise: Promise<any[]> = shouldGoLive
      ? searchDatajudLive(liveTerm, { tribunal: filters?.tribunal ?? null }).catch((e) => {
        console.error("[search] DataJud ao vivo falhou:", e instanceof Error ? e.message : e);
        return [];
      })
      : Promise.resolve([]);


    // Step 2: FTS search
    const ftsPromise = supabase.rpc("search_decisions", {
      search_query: searchQuery,
      filter_tribunal: filters?.tribunal || null,
      filter_uf: filters?.uf || null,
      filter_ramo: filters?.ramo || null,
      filter_instancia: filters?.instancia || null,
      filter_comarca_pequena: filters?.comarca_pequena ?? null,
      result_limit: isGuest ? 3 : (filters?.limit || 20),
      result_offset: filters?.offset || 0,
    });

    // Step 3: Vector search (parallel with FTS)
    let vectorResults: any[] = [];
    let vectorError: string | null = null;
    try {
      if (isGuest) throw new Error("guest-skip");
      const queryEmbedding = await generateQueryEmbedding(aiData?.query_expandida || query);

      const embeddingStr = `[${queryEmbedding.join(",")}]`;
      const { data: vResults, error: vErr } = await supabase.rpc("search_decisions_vector", {
        query_embedding: embeddingStr,
        match_threshold: 0.4,
        match_count: 10,
      });
      if (vErr) {
        vectorError = vErr.message;
        console.error("Vector search error:", vErr);
      } else {
        vectorResults = vResults || [];
      }
    } catch (e) {
      vectorError = e instanceof Error ? e.message : "unknown";
      console.error("Embedding generation failed, using FTS only:", e);
    }

    // Await FTS results
    const { data: ftsResults, error: dbError } = await ftsPromise;
    if (dbError) {
      console.error("DB search error:", dbError);
      throw new Error("Erro na busca no banco de dados");
    }

    // Step 4: Merge results using weighted RRF (Reciprocal Rank Fusion)
    // k_fts=30 (lower k = higher weight), k_vec=60 (higher k = lower weight)
    const K_FTS = 30;
    const K_VEC = 60;
    const resultMap = new Map<string, any>();

    // Add FTS results with rank score
    (ftsResults || []).forEach((r: any, idx: number) => {
      resultMap.set(r.id, {
        ...r,
        fts_rank: idx + 1,
        vector_rank: null,
        combined_score: 1 / (K_FTS + idx + 1),
      });
    });

    // Add/merge vector results — vector-only requires similarity > 0.5
    vectorResults.forEach((r: any, idx: number) => {
      const existing = resultMap.get(r.id);
      if (existing) {
        existing.vector_rank = idx + 1;
        existing.combined_score += 1 / (K_VEC + idx + 1);
      } else if ((r.similarity || 0) > 0.5) {
        resultMap.set(r.id, {
          ...r,
          rank: r.similarity || 0,
          fts_rank: null,
          vector_rank: idx + 1,
          combined_score: 1 / (K_VEC + idx + 1),
        });
      }
    });

    // Sort by combined score descending
    const mergedResults = Array.from(resultMap.values())
      .sort((a, b) => b.combined_score - a.combined_score);

    // Step 5: incorporar o que veio ao vivo do DataJud (sem IA no caminho).
    let liveNew: any[] = [];
    const liveResults = await livePromise;
    if (liveResults.length > 0) {
      const numeros = liveResults.map((d) => d.numero_processo);
      const { data: existentes } = await admin
        .from("decisions")
        .select("numero_processo")
        .in("numero_processo", numeros);
      const jaTem = new Set((existentes || []).map((r: any) => r.numero_processo));

      const novos = liveResults.filter((d) => !jaTem.has(d.numero_processo));
      if (novos.length > 0) {
        const { data: inseridos, error: insErr } = await admin
          .from("decisions")
          .insert(novos)
          .select("id, tribunal, instancia, uf, comarca, numero_processo, data_decisao, orgao_julgador, tipo_decisao, temas_juridicos, ramos_direito, ementa, resumo_ia, source_url, created_at, cached_at");
        if (insErr) {
          console.error("[search] erro ao gravar resultados ao vivo:", insErr.message);
        } else {
          liveNew = inseridos || [];
        }
      }

      await admin.from("search_cache").upsert(
        {
          term_key: termKey,
          raw_query: query,
          results_found: liveResults.length,
          fetched_at: new Date().toISOString(),
        },
        { onConflict: "term_key" },
      );

      // C3: enriquecimento (embedding) SEMPRE em segundo plano — o usuário
      // nunca espera pela IA.
      if (liveNew.length > 0) {
        const enrich = async () => {
          try {
            const textos = liveNew.map((d: any) =>
              [d.tipo_decisao, (d.temas_juridicos || []).join(", "), d.orgao_julgador, d.tribunal]
                .filter(Boolean).join(" — ")
            );
            const vetores = await generateEmbeddings(textos, {
              functionName: "search-jurisprudencia",
              userId: _userId,
              environment: extractEnv(req),
            });
            for (let i = 0; i < liveNew.length; i++) {
              await admin.from("decisions")
                .update({ embedding: toVectorLiteral(vetores[i]) })
                .eq("id", liveNew[i].id);
            }
          } catch (e) {
            console.error("[search] enriquecimento em background falhou:", e instanceof Error ? e.message : e);
          }
        };
        // @ts-ignore EdgeRuntime existe no runtime das edge functions
        if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
          // @ts-ignore
          EdgeRuntime.waitUntil(enrich());
        } else {
          enrich();
        }
      }
    }

    const withLive = [
      ...mergedResults,
      ...liveNew
        .filter((d: any) => !resultMap.has(d.id))
        .map((d: any) => ({ ...d, rank: 0, fts_rank: null, vector_rank: null, combined_score: 0, live: true })),
    ];

    const limited = isGuest ? withLive.slice(0, 3) : withLive;

    return new Response(JSON.stringify({
      results: limited,
      ai_expansion: isGuest ? null : aiData,
      query_used: searchQuery,
      total: limited.length,
      guest_preview: isGuest,
      search_modes: {

        fts: (ftsResults || []).length,
        vector: vectorResults.length,
        vector_error: vectorError,
        live: liveResults.length,
        live_new: liveNew.length,
        cache_hit: cacheHit,
      },
    }), {

      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("search-jurisprudencia error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
