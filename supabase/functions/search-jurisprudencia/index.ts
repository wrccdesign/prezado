import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateQueryEmbedding } from "../_shared/embeddings.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

  try {
    const { query, filters } = await req.json();
    if (!query || typeof query !== "string") {
      throw new Error("Query é obrigatória");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Optional auth — rate limit only if user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const supa = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supa.auth.getUser(token);
      if (user) {
        const { allowed, used, limit } = await checkRateLimit(user.id, "search", SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        if (!allowed) {
          return new Response(JSON.stringify({
            error: `Limite diário de ${limit} buscas atingido. Faça upgrade para continuar.`,
            limit_reached: true, used, limit,
          }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Step 1: Use AI to expand the query
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT_BUSCA },
          { role: "user", content: `Consulta: "${query}"\nFiltros ativos: ${JSON.stringify(filters || {})}` },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI error:", aiResponse.status);
    }

    let searchQuery = query;
    let aiData: any = null;

    if (aiResponse.ok) {
      try {
        const aiResult = await aiResponse.json();
        const content = aiResult.choices?.[0]?.message?.content || "";
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiData = JSON.parse(jsonMatch[0]);
          if (aiData.keywords && aiData.keywords.length > 0) {
            searchQuery = aiData.keywords.join(" OR ");
          }
        }
      } catch (e) {
        console.error("Failed to parse AI response, using original query:", e);
      }
    }

    // Step 2: FTS search
    const ftsPromise = supabase.rpc("search_decisions", {
      search_query: searchQuery,
      filter_tribunal: filters?.tribunal || null,
      filter_uf: filters?.uf || null,
      filter_ramo: filters?.ramo || null,
      filter_instancia: filters?.instancia || null,
      filter_comarca_pequena: filters?.comarca_pequena ?? null,
      result_limit: filters?.limit || 20,
      result_offset: filters?.offset || 0,
    });

    // Step 3: Vector search (parallel with FTS)
    let vectorResults: any[] = [];
    let vectorError: string | null = null;
    try {
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

    return new Response(JSON.stringify({
      results: mergedResults,
      ai_expansion: aiData,
      query_used: searchQuery,
      total: mergedResults.length,
      search_modes: {
        fts: (ftsResults || []).length,
        vector: vectorResults.length,
        vector_error: vectorError,
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
