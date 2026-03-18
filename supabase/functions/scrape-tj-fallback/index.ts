import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateEmbedding } from "../_shared/embeddings.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// CNJ public API key - users can override via DATAJUD_API_KEY secret
const DEFAULT_DATAJUD_KEY = "cDZHYzlZa0JadVREZDR4N3ZSaTdlQV9ZYVFxdkFvOXlmVkR3LTFpbFJRZkl1alhNd2Fia1REVW5KN0VkUVFMWE1jZ0trQ2dEMHlhcWRCRjVpR3RDOGliSHlsTXBoanExY19kUzZiZlFZMEhSZURMcGNJLUZiQ2RIYl9ORWtGOElQYnN4S2N6YVR6bEdMZWxSUmVfU2lB";

const FALLBACK_TRIBUNAIS = [
  "TJRJ", "TJRS", "TJBA", "TJPE", "TJMA", "TJPA", "TJAL", "TJSE",
  "TJPB", "TJPI", "TJES", "TJTO", "TJAC", "TJAP", "TJDF", "TJMT",
  "TJMS", "TJRN", "TJGO",
];

const EXTRACTION_SYSTEM_PROMPT = `Você é um especialista em direito brasileiro. Analise o texto judicial fornecido e extraia metadados estruturados usando a função extract_metadata.

Regras:
- Extraia APENAS informações presentes no texto. Não invente dados.
- tribunal: APENAS a sigla oficial (ex: TJSP, STJ, TST). NUNCA inclua UF, nome por extenso ou qualquer texto além da sigla.
- orgao_julgador: câmara, turma ou órgão julgador. Separar do tribunal.
- comarca_pequena: true se a comarca tiver menos de 100 mil habitantes
- resultado: use termos padronizados como "Provido", "Desprovido", "Parcialmente Provido", "Procedente", "Improcedente"
- resumo_ia: máximo 3 frases objetivas resumindo a decisão
- temas_juridicos e ramos_direito: use termos técnicos padronizados
- legislacao_citada: liste artigos e leis mencionados
- argumentos_principais: liste os 3-5 argumentos mais relevantes`;

const EXTRACTION_TOOL = {
  type: "function",
  function: {
    name: "extract_metadata",
    description: "Extrai metadados estruturados de uma decisão judicial brasileira",
    parameters: {
      type: "object",
      properties: {
        tribunal: { type: "string", description: "Sigla oficial do tribunal (ex: TJRJ, TJBA)" },
        orgao_julgador: { type: "string", description: "Câmara, turma ou órgão julgador" },
        instancia: { type: "string", description: "Instância (1ª Instância, 2ª Instância, Superior)" },
        uf: { type: "string", description: "UF do tribunal (ex: RJ, BA)" },
        comarca: { type: "string", description: "Nome da comarca" },
        comarca_pequena: { type: "boolean", description: "Se a comarca tem menos de 100 mil habitantes" },
        vara: { type: "string", description: "Vara responsável" },
        numero_processo: { type: "string", description: "Número unificado do processo (CNJ)" },
        data_decisao: { type: "string", description: "Data da decisão no formato YYYY-MM-DD" },
        relator: { type: "string", description: "Nome do relator/juiz" },
        tipo_decisao: { type: "string", description: "Tipo (Acórdão, Sentença, Decisão Interlocutória)" },
        resultado: { type: "string", description: "Resultado padronizado" },
        resultado_descricao: { type: "string", description: "Descrição breve do resultado" },
        ementa: { type: "string", description: "Ementa da decisão" },
        resumo_ia: { type: "string", description: "Resumo em até 3 frases" },
        temas_juridicos: { type: "array", items: { type: "string" }, description: "Temas jurídicos abordados" },
        ramos_direito: { type: "array", items: { type: "string" }, description: "Ramos do direito" },
        argumentos_principais: { type: "array", items: { type: "string" }, description: "Argumentos principais" },
        legislacao_citada: { type: "array", items: { type: "string" }, description: "Legislação citada" },
        jurisprudencias_citadas: { type: "array", items: { type: "string" }, description: "Jurisprudências citadas" },
        autor_recorrente: { type: "string", description: "Nome do autor/recorrente (anonimizado)" },
        reu_recorrido: { type: "string", description: "Nome do réu/recorrido (anonimizado)" },
      },
      required: ["tribunal", "resumo_ia", "temas_juridicos", "ramos_direito"],
      additionalProperties: false,
    },
  },
};

function sanitizeDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const stripped = raw.replace(/[-/\s:T]/g, "");
  const match = stripped.match(/^(\d{4})(\d{2})(\d{2})/);
  if (match) {
    const [, y, m, d] = match;
    if (+m >= 1 && +m <= 12 && +d >= 1 && +d <= 31) return `${y}-${m}-${d}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.substring(0, 10);
  return null;
}

function normalizeTribunal(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const beforeComma = raw.split(",")[0].trim();
  const clean = beforeComma.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return clean || null;
}

function getDatajudEndpoint(tribunal: string): string {
  const sigla = tribunal.toLowerCase().replace(/[-_\s]/g, "");
  const explicit: Record<string, string> = {
    tjdf: "api_publica_tjdft",
    tjdft: "api_publica_tjdft",
  };
  if (explicit[sigla]) return explicit[sigla];
  return `api_publica_${sigla}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { tribunal, query, size = 20 } = await req.json();

    if (!tribunal || !query) {
      return new Response(JSON.stringify({ error: "tribunal e query são obrigatórios" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tribunalUpper = tribunal.toUpperCase();
    if (!FALLBACK_TRIBUNAIS.includes(tribunalUpper)) {
      return new Response(JSON.stringify({ error: `${tribunalUpper} não está na lista de tribunais com fallback DataJud. Use scrape-esaj ou scrape-tj-proprio.` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const DATAJUD_API_KEY = Deno.env.get("DATAJUD_API_KEY") || DEFAULT_DATAJUD_KEY;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Step 1: Query DataJud API
    const endpoint = getDatajudEndpoint(tribunalUpper);
    const datajudUrl = `https://api-publica.datajud.cnj.jus.br/${endpoint}/_search`;

    console.log(`[scrape-tj-fallback] Querying DataJud: ${datajudUrl} for "${query}" (size=${size})`);

    const datajudResponse = await fetch(datajudUrl, {
      method: "POST",
      headers: {
        "Authorization": `APIKey ${DATAJUD_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        size,
        query: {
          bool: {
            should: [
              { match: { "assuntos.nome": query } },
              { match: { "classeProcessual.nome": query } },
            ],
            minimum_should_match: 1,
          },
        },
        sort: [{ "@timestamp": { order: "desc" } }],
      }),
    });

    if (!datajudResponse.ok) {
      const errText = await datajudResponse.text();
      console.error("[scrape-tj-fallback] DataJud API error:", datajudResponse.status, errText);
      throw new Error(`DataJud API retornou ${datajudResponse.status}`);
    }

    const datajudData = await datajudResponse.json();
    const hits = datajudData.hits?.hits || [];
    const totalFound = datajudData.hits?.total?.value || hits.length;
    console.log(`[scrape-tj-fallback] DataJud returned ${hits.length} hits (total: ${totalFound})`);

    let ingested = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Step 2: Process each hit
    for (const hit of hits) {
      const source = hit._source || {};
      const externalId = `datajud_fallback_${hit._id || source.numeroProcesso || ""}`;
      const numeroProcesso = source.numeroProcesso || null;

      try {
        // Skip if already exists
        const { data: existing } = await supabase
          .from("decisions")
          .select("id")
          .eq("external_id", externalId)
          .maybeSingle();

        if (existing) {
          skipped++;
          continue;
        }

        // Build raw text for AI extraction
        const rawParts = [
          source.classeProcessual?.nome ? `Classe: ${source.classeProcessual.nome}` : "",
          source.numeroProcesso ? `Processo: ${source.numeroProcesso}` : "",
          source.tribunal ? `Tribunal: ${source.tribunal}` : "",
          source.grau ? `Grau: ${source.grau}` : "",
          source.orgaoJulgador?.nome ? `Órgão Julgador: ${source.orgaoJulgador.nome}` : "",
          ...(source.movimentos || []).map((m: any) =>
            `Movimento (${m.dataHora || ""}): ${m.nome || ""} - ${m.complementosTabelados?.map((c: any) => `${c.nome}: ${c.valor}`).join(", ") || ""}`
          ),
          ...(source.assuntos || []).map((a: any) => `Assunto: ${a.nome || ""} (código ${a.codigo || ""})`),
        ].filter(Boolean);

        const rawText = rawParts.join("\n");

        // Step 3: AI metadata extraction
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
              { role: "user", content: `Extraia os metadados desta decisão judicial:\n\n${rawText}` },
            ],
            tools: [EXTRACTION_TOOL],
            tool_choice: { type: "function", function: { name: "extract_metadata" } },
          }),
        });

        if (!aiResponse.ok) {
          const status = aiResponse.status;
          if (status === 429) {
            errors.push(`Rate limited para ${numeroProcesso || externalId}`);
            continue;
          }
          errors.push(`AI error ${status} para ${numeroProcesso || externalId}`);
          continue;
        }

        const aiResult = await aiResponse.json();
        const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
        if (!toolCall?.function?.arguments) {
          errors.push(`AI não retornou tool call para ${numeroProcesso || externalId}`);
          continue;
        }

        let metadata: any;
        try {
          metadata = JSON.parse(toolCall.function.arguments);
        } catch {
          errors.push(`JSON inválido da AI para ${numeroProcesso || externalId}`);
          continue;
        }

        // Step 4: Build decision data and upsert
        const sourceUrl = source.numeroProcesso
          ? `https://processo.stj.jus.br/processo/pesquisa/?tipoPesquisa=tipoPesquisaNumeroUnico&termo=${source.numeroProcesso}`
          : null;

        const decisionData = {
          external_id: externalId,
          source: "datajud_fallback",
          source_url: sourceUrl,
          tribunal: normalizeTribunal(metadata.tribunal) || tribunalUpper,
          orgao_julgador: metadata.orgao_julgador || source.orgaoJulgador?.nome || null,
          instancia: metadata.instancia || (source.grau === "G1" ? "1ª Instância" : source.grau === "G2" ? "2ª Instância" : source.grau === "SUP" ? "Superior" : null),
          uf: metadata.uf || null,
          comarca: metadata.comarca || null,
          comarca_pequena: metadata.comarca_pequena ?? false,
          vara: metadata.vara || source.orgaoJulgador?.nome || null,
          numero_processo: metadata.numero_processo || source.numeroProcesso || null,
          data_decisao: sanitizeDate(metadata.data_decisao) || sanitizeDate(source.dataAjuizamento) || null,
          relator: metadata.relator || null,
          tipo_decisao: metadata.tipo_decisao || source.classeProcessual?.nome || null,
          resultado: metadata.resultado || null,
          resultado_descricao: metadata.resultado_descricao || null,
          ementa: metadata.ementa || null,
          resumo_ia: metadata.resumo_ia || null,
          full_text: rawText,
          temas_juridicos: metadata.temas_juridicos || [],
          ramos_direito: metadata.ramos_direito || [],
          argumentos_principais: metadata.argumentos_principais || [],
          legislacao_citada: metadata.legislacao_citada || [],
          jurisprudencias_citadas: metadata.jurisprudencias_citadas || [],
          autor_recorrente: metadata.autor_recorrente || null,
          reu_recorrido: metadata.reu_recorrido || null,
        };

        if (decisionData.numero_processo) {
          const { error: upsertError } = await supabase
            .from("decisions")
            .upsert(decisionData, { onConflict: "numero_processo" });
          if (upsertError) {
            errors.push(`Upsert error ${numeroProcesso}: ${upsertError.message}`);
            continue;
          }
        } else {
          const { error: insertError } = await supabase.from("decisions").insert(decisionData);
          if (insertError) {
            errors.push(`Insert error ${externalId}: ${insertError.message}`);
            continue;
          }
        }
        ingested++;
      } catch (e) {
        errors.push(`Erro processando ${externalId}: ${e instanceof Error ? e.message : "desconhecido"}`);
      }
    }

    // Step 5: Update tj_scraping_config
    await supabase
      .from("tj_scraping_config")
      .update({ status: "active_datajud", last_scraped_at: new Date().toISOString() })
      .eq("tribunal", tribunalUpper);

    console.log(`[scrape-tj-fallback] Done: ingested=${ingested}, skipped=${skipped}, errors=${errors.length}`);

    return new Response(JSON.stringify({
      tribunal: tribunalUpper,
      ingested,
      skipped,
      errors,
      total_found: totalFound,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[scrape-tj-fallback] error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
