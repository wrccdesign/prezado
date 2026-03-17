import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// e-SAJ tribunal URL mapping
const ESAJ_URLS: Record<string, string> = {
  TJSP: "https://esaj.tjsp.jus.br/cjsg/consultaCompleta.do",
  TJCE: "https://esaj.tjce.jus.br/cjsg/consultaCompleta.do",
  TJAM: "https://consultasaj.tjam.jus.br/cjsg/consultaCompleta.do",
  TJMS: "https://esaj.tjms.jus.br/cjsg/consultaCompleta.do",
  TJRN: "https://esaj.tjrn.jus.br/cjsg/consultaCompleta.do",
};

const EXTRACTION_SYSTEM_PROMPT = `Você é um especialista em direito brasileiro. Analise o conteúdo HTML/markdown de uma página de resultados de jurisprudência do e-SAJ e extraia as decisões judiciais encontradas.

Regras:
- Extraia TODAS as decisões listadas na página
- tribunal: APENAS a sigla oficial (ex: TJSP, TJCE). NUNCA nome extenso.
- numero_processo: número unificado CNJ quando disponível
- data_decisao: formato YYYY-MM-DD
- ementa: texto completo da ementa
- resumo_ia: máximo 3 frases resumindo a decisão
- resultado: use termos padronizados (Provido, Desprovido, Parcialmente Provido, etc.)
- temas_juridicos e ramos_direito: termos técnicos padronizados
- legislacao_citada: artigos e leis mencionados na ementa`;

const EXTRACTION_TOOL = {
  name: "extract_decisions",
  description: "Extrai decisões judiciais de uma página de resultados do e-SAJ",
  input_schema: {
    type: "object" as const,
    properties: {
      decisions: {
        type: "array",
        description: "Lista de decisões extraídas da página",
        items: {
          type: "object",
          properties: {
            tribunal: { type: "string", description: "Sigla do tribunal (ex: TJSP)" },
            orgao_julgador: { type: "string", description: "Câmara ou turma julgadora" },
            numero_processo: { type: "string", description: "Número unificado CNJ do processo" },
            data_decisao: { type: "string", description: "Data da decisão YYYY-MM-DD" },
            relator: { type: "string", description: "Nome do relator" },
            tipo_decisao: { type: "string", description: "Tipo (Acórdão, Sentença, etc.)" },
            resultado: { type: "string", description: "Resultado padronizado" },
            resultado_descricao: { type: "string", description: "Descrição breve do resultado" },
            ementa: { type: "string", description: "Texto da ementa" },
            resumo_ia: { type: "string", description: "Resumo em até 3 frases" },
            temas_juridicos: { type: "array", items: { type: "string" } },
            ramos_direito: { type: "array", items: { type: "string" } },
            legislacao_citada: { type: "array", items: { type: "string" } },
            argumentos_principais: { type: "array", items: { type: "string" } },
          },
          required: ["tribunal", "ementa", "resumo_ia"],
        },
      },
    },
    required: ["decisions"],
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { tribunal, query, size = 5 } = await req.json();

    if (!tribunal || !query) {
      return new Response(JSON.stringify({ error: "tribunal e query são obrigatórios" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const baseUrl = ESAJ_URLS[tribunal.toUpperCase()];
    if (!baseUrl) {
      return new Response(JSON.stringify({ error: `Tribunal ${tribunal} não suportado para e-SAJ. Suportados: ${Object.keys(ESAJ_URLS).join(", ")}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Step 1: Build e-SAJ search URL
    const searchParams = new URLSearchParams({
      "dados.buscaInteiroTeor": query,
      "pesquisarPor": "ementa",
      "tipoDecisao": "A", // Acórdãos
      "nuPagina": "0",
    });
    const searchUrl = `${baseUrl}?${searchParams.toString()}`;
    console.log(`Scraping e-SAJ: ${searchUrl}`);

    // Step 2: Scrape with Firecrawl
    const firecrawlResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: searchUrl,
        formats: ["markdown"],
        onlyMainContent: true,
        waitFor: 3000, // e-SAJ pages are slow to render
      }),
    });

    if (!firecrawlResponse.ok) {
      const errText = await firecrawlResponse.text();
      console.error("Firecrawl error:", firecrawlResponse.status, errText);
      throw new Error(`Firecrawl retornou ${firecrawlResponse.status}: ${errText}`);
    }

    const firecrawlData = await firecrawlResponse.json();
    const markdown = firecrawlData.data?.markdown || firecrawlData.markdown || "";

    if (!markdown || markdown.length < 100) {
      return new Response(JSON.stringify({
        ingested: 0, skipped: 0, errors: ["Página retornou conteúdo vazio ou insuficiente"],
        total_found: 0, raw_length: markdown.length,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Firecrawl returned ${markdown.length} chars of markdown`);

    const tribunalUpper = tribunal.toUpperCase();

    // Step 3: Extract decisions with Lovable AI gateway (Gemini)
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const OPENAI_TOOL = {
      type: "function",
      function: {
        name: EXTRACTION_TOOL.name,
        description: EXTRACTION_TOOL.description,
        parameters: EXTRACTION_TOOL.input_schema,
      },
    };

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
          {
            role: "user",
            content: `Extraia todas as decisões judiciais desta página de resultados do e-SAJ do ${tribunalUpper}. Retorne no máximo ${size} decisões.\n\n${markdown.substring(0, 50000)}`,
          },
        ],
        tools: [OPENAI_TOOL],
        tool_choice: { type: "function", function: { name: "extract_decisions" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error(`AI retornou ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("AI did not return tool call:", JSON.stringify(aiResult.choices?.[0]?.message));
      return new Response(JSON.stringify({
        ingested: 0, skipped: 0,
        errors: ["AI não retornou decisões estruturadas"],
        total_found: 0,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let parsedDecisions: any;
    try {
      parsedDecisions = JSON.parse(toolCall.function.arguments);
    } catch {
      throw new Error("JSON inválido retornado pela AI");
    }

    const decisions = (parsedDecisions.decisions || []) as any[];
    console.log(`AI extracted ${decisions.length} decisions`);

    // Step 4: Upsert decisions into database
    let ingested = 0;
    let skipped = 0;
    const errors: string[] = [];
    const tribunalUpper = tribunal.toUpperCase();

    for (const dec of decisions.slice(0, size)) {
      try {
        const externalId = `esaj_${tribunalUpper}_${dec.numero_processo || Date.now()}`;

        const decisionData = {
          external_id: externalId,
          source: "scraping_esaj",
          tribunal: tribunalUpper,
          orgao_julgador: dec.orgao_julgador || null,
          numero_processo: dec.numero_processo || null,
          data_decisao: sanitizeDate(dec.data_decisao),
          relator: dec.relator || null,
          tipo_decisao: dec.tipo_decisao || "Acórdão",
          resultado: dec.resultado || null,
          resultado_descricao: dec.resultado_descricao || null,
          ementa: dec.ementa || null,
          resumo_ia: dec.resumo_ia || null,
          temas_juridicos: dec.temas_juridicos || [],
          ramos_direito: dec.ramos_direito || [],
          legislacao_citada: dec.legislacao_citada || [],
          argumentos_principais: dec.argumentos_principais || [],
          full_text: dec.ementa || null,
          source_url: searchUrl,
        };

        if (decisionData.numero_processo) {
          const { error: upsertError } = await supabase
            .from("decisions")
            .upsert(decisionData, { onConflict: "numero_processo" });

          if (upsertError) {
            errors.push(`Erro upsert ${dec.numero_processo}: ${upsertError.message}`);
            continue;
          }
        } else {
          const { error: insertError } = await supabase
            .from("decisions")
            .insert(decisionData);

          if (insertError) {
            errors.push(`Erro insert: ${insertError.message}`);
            continue;
          }
        }
        ingested++;
      } catch (e) {
        errors.push(`Erro: ${e instanceof Error ? e.message : "desconhecido"}`);
      }
    }

    // Update last_scraped_at in config
    await supabase
      .from("tj_scraping_config")
      .update({ last_scraped_at: new Date().toISOString(), status: "active" })
      .eq("tribunal", tribunalUpper);

    return new Response(JSON.stringify({
      ingested,
      skipped,
      errors,
      total_found: decisions.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scrape-esaj error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
