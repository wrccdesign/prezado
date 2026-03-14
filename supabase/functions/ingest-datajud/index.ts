import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// CNJ public API key - users can override via DATAJUD_API_KEY secret
const DEFAULT_DATAJUD_KEY = "cDZHYzlZa0JadVREZDR4N3ZSaTdlQV9ZYVFxdkFvOXlmVkR3LTFpbFJRZkl1alhNd2Fia1REVW5KN0VkUVFMWE1jZ0trQ2dEMHlhcWRCRjVpR3RDOGliSHlsTXBoanExY19kUzZiZlFZMEhSZURMcGNJLUZiQ2RIYl9ORWtGOElQYnN4S2N6YVR6bEdMZWxSUmVfU2lB";

const EXTRACTION_SYSTEM_PROMPT = `Você é um especialista em direito brasileiro. Analise o texto judicial fornecido e extraia metadados estruturados usando a função extract_metadata.

Regras:
- Extraia APENAS informações presentes no texto. Não invente dados.
- comarca_pequena: true se a comarca tiver menos de 100 mil habitantes (use seu conhecimento geral)
- resultado: use termos padronizados como "Provido", "Desprovido", "Parcialmente Provido", "Extinto", "Procedente", "Improcedente"
- resumo_ia: máximo 3 frases objetivas resumindo a decisão
- temas_juridicos e ramos_direito: use termos técnicos padronizados
- legislacao_citada: liste artigos e leis mencionados (ex: "Art. 927 do CC", "Art. 5º da CF")
- argumentos_principais: liste os 3-5 argumentos mais relevantes da decisão`;

const EXTRACTION_TOOL = {
  type: "function",
  function: {
    name: "extract_metadata",
    description: "Extrai metadados estruturados de uma decisão judicial brasileira",
    parameters: {
      type: "object",
      properties: {
        tribunal: { type: "string", description: "Sigla do tribunal (ex: TJSP, TST, STJ)" },
        instancia: { type: "string", description: "Instância (1ª Instância, 2ª Instância, Superior)" },
        uf: { type: "string", description: "UF do tribunal (ex: SP, RJ, MG)" },
        comarca: { type: "string", description: "Nome da comarca" },
        comarca_pequena: { type: "boolean", description: "Se a comarca tem menos de 100 mil habitantes" },
        vara: { type: "string", description: "Vara responsável" },
        numero_processo: { type: "string", description: "Número unificado do processo (CNJ)" },
        data_decisao: { type: "string", description: "Data da decisão no formato YYYY-MM-DD" },
        relator: { type: "string", description: "Nome do relator/juiz" },
        tipo_decisao: { type: "string", description: "Tipo (Acórdão, Sentença, Decisão Interlocutória, Despacho)" },
        resultado: { type: "string", description: "Resultado padronizado" },
        resultado_descricao: { type: "string", description: "Descrição breve do resultado" },
        ementa: { type: "string", description: "Ementa da decisão (se presente no texto)" },
        resumo_ia: { type: "string", description: "Resumo em até 3 frases" },
        temas_juridicos: { type: "array", items: { type: "string" }, description: "Temas jurídicos abordados" },
        ramos_direito: { type: "array", items: { type: "string" }, description: "Ramos do direito (Civil, Penal, Trabalho, etc.)" },
        argumentos_principais: { type: "array", items: { type: "string" }, description: "Argumentos principais da decisão" },
        legislacao_citada: { type: "array", items: { type: "string" }, description: "Legislação citada" },
        jurisprudencias_citadas: { type: "array", items: { type: "string" }, description: "Jurisprudências citadas" },
        autor_recorrente: { type: "string", description: "Nome do autor/recorrente (anonimizado se pessoa física)" },
        reu_recorrido: { type: "string", description: "Nome do réu/recorrido (anonimizado se pessoa física)" },
      },
      required: ["tribunal", "resumo_ia", "temas_juridicos", "ramos_direito"],
      additionalProperties: false,
    },
  },
};

// Sanitize date strings from AI/DataJud into YYYY-MM-DD
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

// Map tribunal siglas to DataJud API endpoint names (91 endpoints)
function getDatajudEndpoint(tribunal: string): string {
  const sigla = tribunal.toLowerCase().replace(/[-_\s]/g, "");

  // Explicit special cases
  const explicit: Record<string, string> = {
    tjdf: "api_publica_tjdft",
    tjdft: "api_publica_tjdft",
    tjmmg: "api_publica_tjmmg",
    tjmrs: "api_publica_tjmrs",
    tjmsp: "api_publica_tjmsp",
  };
  if (explicit[sigla]) return explicit[sigla];

  // TREs: tresp → api_publica_tre-sp, treac → api_publica_tre-ac
  const treMatch = sigla.match(/^tre([a-z]{2})$/);
  if (treMatch) return `api_publica_tre-${treMatch[1]}`;

  // All others (TJs, TRFs, TRTs, STF, STJ, STM, TST, TSE) follow api_publica_{sigla}
  return `api_publica_${sigla}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { tribunal, query, size = 10 } = await req.json();

    if (!tribunal || !query) {
      return new Response(JSON.stringify({ error: "tribunal e query são obrigatórios" }), {
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
    const endpoint = getDatajudEndpoint(tribunal);
    const datajudUrl = `https://api-publica.datajud.cnj.jus.br/${endpoint}/_search`;

    console.log(`Querying DataJud: ${datajudUrl} for "${query}" (size=${size})`);

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
      console.error("DataJud API error:", datajudResponse.status, errText);
      throw new Error(`DataJud API retornou ${datajudResponse.status}`);
    }

    const datajudData = await datajudResponse.json();
    const hits = datajudData.hits?.hits || [];
    console.log(`DataJud returned ${hits.length} hits`);

    let ingested = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Step 2: Process each hit
    for (const hit of hits) {
      const source = hit._source || {};
      const externalId = `datajud_${hit._id || source.numeroProcesso || ""}`;

      try {
        // Check for duplicates
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

        // Step 3: AI metadata extraction via tool calling
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
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
            errors.push(`Rate limited na extração do processo ${source.numeroProcesso || externalId}`);
            continue;
          }
          errors.push(`AI error ${status} para ${source.numeroProcesso || externalId}`);
          continue;
        }

        const aiResult = await aiResponse.json();
        const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
        if (!toolCall?.function?.arguments) {
          errors.push(`AI não retornou tool call para ${source.numeroProcesso || externalId}`);
          continue;
        }

        let metadata: any;
        try {
          metadata = JSON.parse(toolCall.function.arguments);
        } catch {
          errors.push(`JSON inválido da AI para ${source.numeroProcesso || externalId}`);
          continue;
        }

        // Step 4: Insert into decisions table
        const sourceUrl = source.numeroProcesso
          ? `https://processo.stj.jus.br/processo/pesquisa/?tipoPesquisa=tipoPesquisaNumeroUnico&termo=${source.numeroProcesso}`
          : null;

        const { error: insertError } = await supabase.from("decisions").insert({
          external_id: externalId,
          source: "datajud",
          source_url: sourceUrl,
          tribunal: metadata.tribunal || source.tribunal || tribunal.toUpperCase(),
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
        });

        if (insertError) {
          console.error("Insert error:", insertError);
          errors.push(`Erro ao inserir ${source.numeroProcesso || externalId}: ${insertError.message}`);
          continue;
        }

        ingested++;
      } catch (e) {
        errors.push(`Erro processando ${externalId}: ${e instanceof Error ? e.message : "desconhecido"}`);
      }
    }

    return new Response(JSON.stringify({
      ingested,
      skipped,
      errors,
      total_hits: datajudData.hits?.total?.value || hits.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ingest-datajud error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
