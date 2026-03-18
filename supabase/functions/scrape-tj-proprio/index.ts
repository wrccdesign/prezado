import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// TJ Próprio tribunal domain mapping
const TJ_PROPRIO_URLS: Record<string, string> = {
  TJRJ: "https://jurisprudencia.tjrj.jus.br",
  TJMG: "https://www5.tjmg.jus.br/jurisprudencia",
  TJRS: "https://www.tjrs.jus.br/buscas/jurisprudencia",
  TJPR: "https://portal.tjpr.jus.br/jurisprudencia",
  TJSC: "https://busca.tjsc.jus.br/jurisprudencia",
  TJBA: "https://jurisprudencia.tjba.jus.br",
  TJPE: "https://jurisprudencia.tjpe.jus.br",
  TJMA: "https://jurisprudencia.tjma.jus.br",
  TJPA: "https://consulta.tjpa.jus.br/consultaJurisprudenciaIndex",
  TJMT: "https://jurisprudencia.tjmt.jus.br",
  TJAL: "https://jurisprudencia.tjal.jus.br",
  TJSE: "https://jurisprudencia.tjse.jus.br",
  TJPB: "https://jurisprudencia.tjpb.jus.br",
  TJPI: "https://jurisprudencia.tjpi.jus.br",
  TJES: "https://jurisprudencia.tjes.jus.br",
  TJTO: "https://jurisprudencia.tjto.jus.br",
  TJRO: "https://www.tjro.jus.br/jurisprudencia",
  TJAC: "https://jurisprudencia.tjac.jus.br",
  TJAP: "https://jurisprudencia.tjap.jus.br",
  TJRR: "https://jurisprudencia.tjrr.jus.br",
  TJDF: "https://jurisprudencia.tjdft.jus.br",
};

const EXTRACTION_SYSTEM_PROMPT = `Você é um especialista em direito brasileiro. Analise o conteúdo markdown de resultados de jurisprudência do portal do tribunal e extraia as decisões judiciais encontradas.

Regras OBRIGATÓRIAS:
- Extraia TODAS as decisões listadas na página
- tribunal: APENAS a sigla oficial (ex: TJRJ, TJMG). NUNCA nome extenso.
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
  description: "Extrai decisões judiciais de uma página de resultados de jurisprudência",
  input_schema: {
    type: "object" as const,
    properties: {
      decisions: {
        type: "array",
        description: "Lista de decisões extraídas da página",
        items: {
          type: "object",
          properties: {
            tribunal: { type: "string", description: "Sigla do tribunal (ex: TJRJ)" },
            orgao_julgador: { type: ["string", "null"], description: "Nome completo da câmara ou turma julgadora. null se não encontrado." },
            numero_processo: { type: "string", description: "Número unificado CNJ no formato NNNNNNN-DD.AAAA.J.TT.OOOO" },
            data_decisao: { type: ["string", "null"], description: "Data da decisão YYYY-MM-DD. null se não encontrada." },
            relator: { type: ["string", "null"], description: "Nome completo do relator. null se não encontrado." },
            tipo_decisao: { type: "string", description: "Tipo (Acórdão, Sentença, etc.)" },
            resultado: { type: "string", description: "Resultado padronizado" },
            resultado_descricao: { type: "string", description: "Descrição breve do resultado" },
            ementa: { type: "string", description: "Texto completo da ementa" },
            resumo_ia: { type: "string", description: "Resumo em até 3 frases" },
            temas_juridicos: { type: "array", items: { type: "string" } },
            ramos_direito: { type: "array", items: { type: "string" } },
            legislacao_citada: { type: "array", items: { type: "string" } },
            argumentos_principais: { type: "array", items: { type: "string" } },
            comarca: { type: ["string", "null"], description: "Cidade/comarca de origem. null se não encontrada." },
            url_decisao: { type: ["string", "null"], description: "URL específica da página da decisão (do cabeçalho '--- RESULTADO DE: <url> ---'). null se não encontrada." },
          },
          required: ["tribunal", "numero_processo", "ementa", "resumo_ia"],
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

    const tribunalUpper = tribunal.toUpperCase();
    const portalUrl = TJ_PROPRIO_URLS[tribunalUpper];
    if (!portalUrl) {
      return new Response(JSON.stringify({ error: `Tribunal ${tribunal} não suportado. Suportados: ${Object.keys(TJ_PROPRIO_URLS).join(", ")}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Step 1: Use Firecrawl search to find indexed jurisprudence via Google
    const tribunalDomain = new URL(portalUrl).hostname;
    const searchQuery = `site:${tribunalDomain} ${query} acórdão ementa`;
    console.log(`[scrape-tj-proprio] Searching via Firecrawl: "${searchQuery}" (size=${size})`);

    const firecrawlResponse = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: searchQuery,
        limit: Math.min(size * 2, 6),
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
      console.error("[scrape-tj-proprio] Firecrawl error:", firecrawlResponse.status, errText);
      throw new Error(`Firecrawl retornou ${firecrawlResponse.status}: ${errText}`);
    }

    const firecrawlData = await firecrawlResponse.json();
    const searchResults = firecrawlData.data || [];

    if (!searchResults.length) {
      // Mark tribunal as no_index when Firecrawl finds nothing
      await supabase
        .from("tj_scraping_config")
        .update({ status: "no_index" })
        .eq("tribunal", tribunalUpper);

      return new Response(JSON.stringify({
        ingested: 0, skipped: 0, errors: ["Nenhum resultado encontrado na busca"],
        total_found: 0,
        needs_fallback: true,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Combine all scraped content into one markdown block for AI extraction
    const combinedMarkdown = searchResults
      .filter((r: any) => r.markdown && r.markdown.length > 200)
      .map((r: any) => `--- RESULTADO DE: ${r.url || "unknown"} ---\n${r.markdown}`)
      .join("\n\n");

    console.log(`[scrape-tj-proprio] Firecrawl returned ${searchResults.length} results, combined ${combinedMarkdown.length} chars`);

    if (combinedMarkdown.length < 200) {
      return new Response(JSON.stringify({
        ingested: 0, skipped: 0, errors: ["Conteúdo insuficiente nos resultados da busca"],
        total_found: 0,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2: Extract decisions with Anthropic Claude
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
      console.error("[scrape-tj-proprio] Anthropic error:", aiResponse.status, errText);
      throw new Error(`Anthropic retornou ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const toolUseBlock = aiResult.content?.find((b: any) => b.type === "tool_use");
    if (!toolUseBlock?.input) {
      console.error("[scrape-tj-proprio] Anthropic did not return tool_use:", JSON.stringify(aiResult.content));
      return new Response(JSON.stringify({
        ingested: 0, skipped: 0,
        errors: ["AI não retornou decisões estruturadas"],
        total_found: 0,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const decisions = (toolUseBlock.input.decisions || []) as any[];
    console.log(`[scrape-tj-proprio] AI extracted ${decisions.length} decisions`);

    // Step 3: Upsert decisions into database
    let ingested = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const dec of decisions.slice(0, size)) {
      try {
        const externalId = `tjproprio_${tribunalUpper}_${dec.numero_processo || Date.now()}`;

        const decisionData = {
          external_id: externalId,
          source: "scraping_tj_proprio",
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
          comarca: dec.comarca || null,
          source_url: dec.url_decisao || null,
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
    console.error("[scrape-tj-proprio] error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
