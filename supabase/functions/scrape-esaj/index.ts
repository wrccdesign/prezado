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

const EXTRACTION_SYSTEM_PROMPT = `Você é um especialista em direito brasileiro. Analise o conteúdo markdown de resultados de jurisprudência do e-SAJ e extraia as decisões judiciais encontradas.

Regras OBRIGATÓRIAS:
- Extraia TODAS as decisões listadas na página
- tribunal: APENAS a sigla oficial (ex: TJSP, TJCE). NUNCA nome extenso.
- numero_processo: OBRIGATÓRIO no formato CNJ (NNNNNNN-DD.AAAA.J.TT.OOOO). Se não encontrar neste formato, tente extrair do texto.
- data_decisao: formato YYYY-MM-DD. Se não encontrar, retorne null.
- orgao_julgador: nome completo da câmara ou turma (ex: "3ª Câmara de Direito Privado"). Se não encontrar, retorne null. NUNCA retorne "<UNKNOWN>" ou similar.
- relator: nome completo do relator/desembargador. Se não encontrar, retorne null. NUNCA retorne "<UNKNOWN>" ou similar.
- ementa: texto completo da ementa
- resumo_ia: máximo 3 frases resumindo a decisão
- resultado: use termos padronizados (Provido, Desprovido, Parcialmente Provido, etc.)
- temas_juridicos e ramos_direito: termos técnicos padronizados
- legislacao_citada: artigos e leis mencionados na ementa
- comarca: cidade/comarca de origem. Extraia do número do processo, cabeçalho ou texto. Se não encontrar, retorne null.
- url_decisao: cada bloco de resultado é precedido por "--- RESULTADO DE: <url> ---". Use essa URL como url_decisao da decisão extraída daquele bloco. NUNCA use a URL genérica de busca.

IMPORTANTE: Para campos não encontrados, retorne null. NUNCA invente dados ou use placeholders como "<UNKNOWN>", "Não informado", etc.`;

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

    // Step 1: Use Firecrawl search to find indexed jurisprudence via Google
    // e-SAJ requires POST form submission which scrape can't handle,
    // so we search Google for indexed results from the tribunal's domain
    const tribunalDomain = new URL(baseUrl).hostname;
    const searchQuery = `site:${tribunalDomain} ${query} acórdão ementa`;
    const searchUrl = `https://esaj.tjsp.jus.br/cjsg/resultadoCompleta.do`; // for source_url reference
    console.log(`Searching via Firecrawl: "${searchQuery}" (size=${size})`);

    // Step 2: Search with Firecrawl (returns results with scraped content)
    const firecrawlResponse = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: searchQuery,
        limit: Math.min(size * 2, 6), // cap to avoid timeout
        lang: "pt-br",
        country: "BR",
        scrapeOptions: {
          formats: ["markdown"],
          onlyMainContent: true,
        },
      }),
    });

    if (!firecrawlResponse.ok) {
      const errText = await firecrawlResponse.text();
      console.error("Firecrawl error:", firecrawlResponse.status, errText);
      throw new Error(`Firecrawl retornou ${firecrawlResponse.status}: ${errText}`);
    }

    const firecrawlData = await firecrawlResponse.json();
    const searchResults = firecrawlData.data || [];

    if (!searchResults.length) {
      return new Response(JSON.stringify({
        ingested: 0, skipped: 0, errors: ["Nenhum resultado encontrado na busca"],
        total_found: 0,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Combine all scraped content into one markdown block for AI extraction
    const combinedMarkdown = searchResults
      .filter((r: any) => r.markdown && r.markdown.length > 200)
      .map((r: any) => `--- RESULTADO DE: ${r.url || "unknown"} ---\n${r.markdown}`)
      .join("\n\n");

    console.log(`Firecrawl returned ${searchResults.length} results, combined ${combinedMarkdown.length} chars`);

    if (combinedMarkdown.length < 200) {
      return new Response(JSON.stringify({
        ingested: 0, skipped: 0, errors: ["Conteúdo insuficiente nos resultados da busca"],
        total_found: 0,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // (removed old debug log)

    const tribunalUpper = tribunal.toUpperCase();

    // Step 3: Extract decisions with Anthropic Claude
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");

    const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8192,
        system: EXTRACTION_SYSTEM_PROMPT,
        tools: [EXTRACTION_TOOL],
        tool_choice: { type: "tool", name: "extract_decisions" },
        messages: [
          {
            role: "user",
            content: `Extraia todas as decisões judiciais destes resultados de jurisprudência do ${tribunalUpper}. Retorne no máximo ${size} decisões.\n\n${combinedMarkdown.substring(0, 25000)}`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("Anthropic error:", aiResponse.status, errText);
      throw new Error(`Anthropic retornou ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const toolUseBlock = aiResult.content?.find((b: any) => b.type === "tool_use");
    if (!toolUseBlock?.input) {
      console.error("Anthropic did not return tool_use:", JSON.stringify(aiResult.content));
      return new Response(JSON.stringify({
        ingested: 0, skipped: 0,
        errors: ["AI não retornou decisões estruturadas"],
        total_found: 0,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsedDecisions = toolUseBlock.input;

    const decisions = (parsedDecisions.decisions || []) as any[];
    console.log(`AI extracted ${decisions.length} decisions`);

    // Step 4: Upsert decisions into database
    let ingested = 0;
    let skipped = 0;
    const errors: string[] = [];
    // tribunalUpper already defined above

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
