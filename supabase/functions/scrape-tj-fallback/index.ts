import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateEmbedding } from "../_shared/embeddings.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_DATAJUD_KEY = "cDZHYzlZa0JadVREZDR4N3ZSaTdlQV9ZYVFxdkFvOXlmVkR3LTFpbFJRZkl1alhNd2Fia1REVW5KN0VkUVFMWE1jZ0trQ2dEMHlhcWRCRjVpR3RDOGliSHlsTXBoanExY19kUzZiZlFZMEhSZURMcGNJLUZiQ2RIYl9ORWtGOElQYnN4S2N6YVR6bEdMZWxSUmVfU2lB";

const FALLBACK_TRIBUNAIS = [
  "TJRJ", "TJRS", "TJBA", "TJPE", "TJMA", "TJPA", "TJAL", "TJSE",
  "TJPB", "TJPI", "TJES", "TJTO", "TJAC", "TJAP", "TJDF", "TJMT",
  "TJMS", "TJRN", "TJGO",
];

// Formato CNJ: NNNNNNN-DD.AAAA.J.TT.OOOO
const CNJ_REGEX = /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/;

// Validar se número de processo é real (formato CNJ)
function isValidCNJ(num: string | null | undefined): boolean {
  if (!num) return false;
  if (num.includes("<UNKNOWN>")) return false;
  if (num.includes("1234567")) return false; // padrão fictício conhecido
  const clean = num.replace(/\s/g, "");
  return CNJ_REGEX.test(clean);
}

// Validar se nome de relator parece real (não genérico)
function isValidRelator(name: string | null | undefined): boolean {
  if (!name) return true; // null é ok, melhor que fictício
  const genericNames = [
    "joão almeida", "ana oliveira", "maria silva", "josé santos",
    "carlos souza", "paulo costa", "pedro ferreira", "nome relator",
    "relator desconhecido", "não informado",
  ];
  return !genericNames.includes(name.toLowerCase().trim());
}

const EXTRACTION_SYSTEM_PROMPT = `Você é um especialista em direito brasileiro. Analise o texto judicial fornecido e extraia metadados estruturados.

REGRAS CRÍTICAS — NUNCA VIOLE:
1. Extraia APENAS informações EXPLICITAMENTE presentes no texto. JAMAIS invente, complete ou assuma dados.
2. Se um campo não estiver no texto, retorne null. NUNCA invente nomes, datas ou números.
3. tribunal: APENAS a sigla oficial (ex: TJSP, STJ). NUNCA UF, nome extenso ou texto além da sigla.
4. numero_processo: APENAS se estiver no formato CNJ (NNNNNNN-DD.AAAA.J.TT.OOOO). Se não encontrar, retorne null.
5. relator: APENAS o nome real do juiz/desembargador que aparece no texto. Se não encontrar, retorne null.
6. orgao_julgador: câmara ou turma que aparece no texto. Se não encontrar, retorne null.
7. comarca_pequena: true APENAS se a comarca tiver menos de 100 mil habitantes — use seu conhecimento geográfico.
8. resultado: use APENAS estes termos: "Provido", "Desprovido", "Parcialmente Provido", "Procedente", "Improcedente", "Não Provido", "Parcialmente Procedente". Se não encontrar, retorne null.
9. resumo_ia: máximo 3 frases objetivas. Baseie-se APENAS no que está no texto.
10. NUNCA retorne strings como "<UNKNOWN>", "Não informado", "N/A" — use null.`;

const EXTRACTION_TOOL = {
  name: "extract_metadata",
  description: "Extrai metadados estruturados de uma decisão judicial brasileira",
  input_schema: {
    type: "object" as const,
    properties: {
      tribunal: { type: "string", description: "Sigla oficial do tribunal (ex: TJRJ, TJBA)" },
      orgao_julgador: { type: ["string", "null"], description: "Câmara, turma ou órgão julgador. null se não encontrado." },
      instancia: { type: ["string", "null"], description: "Instância (1ª Instância, 2ª Instância, Superior). null se não encontrado." },
      uf: { type: ["string", "null"], description: "UF do tribunal (ex: RJ, BA). null se não encontrado." },
      comarca: { type: ["string", "null"], description: "Nome da comarca. null se não encontrado." },
      comarca_pequena: { type: ["boolean", "null"], description: "Se a comarca tem menos de 100 mil habitantes." },
      vara: { type: ["string", "null"], description: "Vara responsável. null se não encontrado." },
      numero_processo: { type: ["string", "null"], description: "Número CNJ NNNNNNN-DD.AAAA.J.TT.OOOO. null se não encontrado ou formato inválido." },
      data_decisao: { type: ["string", "null"], description: "Data YYYY-MM-DD. null se não encontrado." },
      relator: { type: ["string", "null"], description: "Nome real do relator/juiz presente no texto. null se não encontrado." },
      tipo_decisao: { type: ["string", "null"], description: "Tipo (Acórdão, Sentença, Decisão Interlocutória). null se não encontrado." },
      resultado: { type: ["string", "null"], description: "Provido | Desprovido | Parcialmente Provido | Procedente | Improcedente | Não Provido | Parcialmente Procedente. null se não encontrado." },
      resultado_descricao: { type: ["string", "null"], description: "Descrição breve do resultado. null se não encontrado." },
      ementa: { type: ["string", "null"], description: "Ementa da decisão. null se não encontrado." },
      resumo_ia: { type: "string", description: "Resumo em até 3 frases baseado APENAS no texto fornecido." },
      temas_juridicos: { type: "array", items: { type: "string" }, description: "Temas jurídicos abordados." },
      ramos_direito: { type: "array", items: { type: "string" }, description: "Ramos do direito." },
      argumentos_principais: { type: "array", items: { type: "string" }, description: "Argumentos principais." },
      legislacao_citada: { type: "array", items: { type: "string" }, description: "Legislação citada no texto." },
      jurisprudencias_citadas: { type: "array", items: { type: "string" }, description: "Jurisprudências citadas no texto." },
      autor_recorrente: { type: ["string", "null"], description: "Nome anonimizado do autor/recorrente. null se não encontrado." },
      reu_recorrido: { type: ["string", "null"], description: "Nome anonimizado do réu/recorrido. null se não encontrado." },
    },
    required: ["tribunal", "resumo_ia", "temas_juridicos", "ramos_direito"],
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
      return new Response(JSON.stringify({ error: `${tribunalUpper} não está na lista de tribunais com fallback DataJud.` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const DATAJUD_API_KEY = Deno.env.get("DATAJUD_API_KEY") || DEFAULT_DATAJUD_KEY;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
    let rejected = 0;
    const errors: string[] = [];

    for (const hit of hits) {
      const source = hit._source || {};
      const externalId = `datajud_fallback_${hit._id || source.numeroProcesso || ""}`;
      const numeroProcesso = source.numeroProcesso || null;

      try {
        // Skip se já existe
        const { data: existing } = await supabase
          .from("decisions")
          .select("id")
          .eq("external_id", externalId)
          .maybeSingle();

        if (existing) {
          skipped++;
          continue;
        }

        // Montar texto bruto para extração
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

        // Extração via Claude
        const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1500,
            system: EXTRACTION_SYSTEM_PROMPT,
            tools: [EXTRACTION_TOOL],
            tool_choice: { type: "tool", name: "extract_metadata" },
            messages: [
              {
                role: "user",
                content: `Extraia os metadados desta decisão judicial. Lembre-se: retorne null para qualquer campo que não esteja explicitamente no texto.\n\n${rawText}`,
              },
            ],
          }),
        });

        if (!aiResponse.ok) {
          const status = aiResponse.status;
          errors.push(`AI error ${status} para ${numeroProcesso || externalId}`);
          continue;
        }

        const aiResult = await aiResponse.json();
        const toolUseBlock = aiResult.content?.find((b: any) => b.type === "tool_use");

        if (!toolUseBlock?.input) {
          errors.push(`Claude não retornou tool_use para ${numeroProcesso || externalId}`);
          continue;
        }

        const metadata = toolUseBlock.input as any;

        // VALIDAÇÃO — rejeitar dados suspeitos
        const finalNumero = metadata.numero_processo || source.numeroProcesso || null;
        const finalRelator = metadata.relator || null;

        if (finalNumero && !isValidCNJ(finalNumero)) {
          console.warn(`[scrape-tj-fallback] Rejeitando ${externalId}: número inválido "${finalNumero}"`);
          rejected++;
          continue;
        }

        if (finalRelator && !isValidRelator(finalRelator)) {
          console.warn(`[scrape-tj-fallback] Rejeitando relator genérico "${finalRelator}" em ${externalId}`);
          // Não rejeita o registro, apenas nulifica o relator
          metadata.relator = null;
        }

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
          numero_processo: finalNumero,
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
            errors.push(`Upsert error ${finalNumero}: ${upsertError.message}`);
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

        // Gerar embedding (não bloqueia)
        try {
          const embText = [decisionData.ementa, decisionData.resumo_ia].filter(Boolean).join(" ");
          if (embText.length >= 20) {
            const embedding = await generateEmbedding(embText);
            const embeddingStr = `[${embedding.join(",")}]`;
            await supabase
              .from("decisions")
              .update({ embedding: embeddingStr })
              .eq("external_id", externalId);
          }
        } catch (embErr) {
          console.error(`Embedding error for ${externalId}:`, embErr);
        }
      } catch (e) {
        errors.push(`Erro processando ${externalId}: ${e instanceof Error ? e.message : "desconhecido"}`);
      }
    }

    await supabase
      .from("tj_scraping_config")
      .update({ status: "active_datajud", last_scraped_at: new Date().toISOString() })
      .eq("tribunal", tribunalUpper);

    console.log(`[scrape-tj-fallback] Done: ingested=${ingested}, skipped=${skipped}, rejected=${rejected}, errors=${errors.length}`);

    return new Response(JSON.stringify({
      tribunal: tribunalUpper,
      ingested,
      skipped,
      rejected,
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
