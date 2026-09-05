/**
 * Shared jurisprudence grounding helper.
 * Fetches top-N relevant decisions to inject into system prompts,
 * preventing the AI from inventing citations.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateQueryEmbedding } from "./embeddings.ts";

export interface GroundingDecision {
  id: string;
  tribunal: string | null;
  numero_processo: string | null;
  comarca: string | null;
  data_decisao: string | null;
  ementa: string | null;
  resumo_ia: string | null;
  resultado: string | null;
  resultado_descricao: string | null;
  temas_juridicos: string[] | null;
  tipo_decisao: string | null;
  orgao_julgador: string | null;
  source_url: string | null;
  /** "julgado" quando há resultado registrado; caso contrário é apenas processo relacionado. */
  natureza: "julgado" | "processo_relacionado";
}

function toGroundingDecision(d: Record<string, unknown>): GroundingDecision {
  const resultado = (d.resultado as string | null) ?? null;
  return {
    id: d.id as string,
    tribunal: (d.tribunal as string | null) ?? null,
    numero_processo: (d.numero_processo as string | null) ?? null,
    comarca: (d.comarca as string | null) ?? null,
    data_decisao: (d.data_decisao as string | null) ?? null,
    ementa: (d.ementa as string | null) ?? null,
    resumo_ia: (d.resumo_ia as string | null) ?? null,
    resultado,
    resultado_descricao: (d.resultado_descricao as string | null) ?? null,
    temas_juridicos: (d.temas_juridicos as string[] | null) ?? null,
    tipo_decisao: (d.tipo_decisao as string | null) ?? null,
    orgao_julgador: (d.orgao_julgador as string | null) ?? null,
    source_url: (d.source_url as string | null) ?? null,
    natureza: resultado ? "julgado" : "processo_relacionado",
  };
}

export async function fetchGroundingContext(
  query: string,
  supabaseUrl: string,
  serviceKey: string,
  limit = 5,
  onlyJulgados = false
): Promise<GroundingDecision[]> {
  if (!query || query.trim().length < 5) return [];
  const supabase = createClient(supabaseUrl, serviceKey);

  const results: GroundingDecision[] = [];
  const seen = new Set<string>();

  // 1. Try semantic vector search
  try {
    const embedding = await generateQueryEmbedding(query.slice(0, 1500));
    const { data: vec } = await supabase.rpc("search_decisions_vector", {
      query_embedding: embedding,
      match_threshold: 0.35,
      match_count: limit,
      only_julgados: onlyJulgados,
    });
    if (Array.isArray(vec)) {
      for (const d of vec) {
        if (!seen.has(d.id)) {
          seen.add(d.id);
          results.push(toGroundingDecision(d));
        }
      }
    }
  } catch (e) {
    console.warn("Vector grounding failed:", e instanceof Error ? e.message : e);
  }

  // 2. Full-text fallback if vector returned little
  if (results.length < 3) {
    try {
      const { data: fts } = await supabase.rpc("search_decisions", {
        search_query: query.slice(0, 200),
        result_limit: limit - results.length,
        filter_only_julgados: onlyJulgados ? true : null,
      });
      if (Array.isArray(fts)) {
        for (const d of fts) {
          if (!seen.has(d.id)) {
            seen.add(d.id);
            results.push(toGroundingDecision(d));
          }
          if (results.length >= limit) break;
        }
      }
    } catch (e) {
      console.warn("FTS grounding failed:", e instanceof Error ? e.message : e);
    }
  }

  return results.slice(0, limit);
}

/** Linha descritiva de uma decisão, com a natureza do texto disponível. */
export function describeDecision(d: GroundingDecision, index: number): string {
  const meta = [
    d.tipo_decisao,
    d.tribunal,
    d.orgao_julgador,
    d.numero_processo ? `processo ${d.numero_processo}` : null,
    d.comarca,
    d.data_decisao,
  ]
    .filter(Boolean)
    .join(" · ");

  const resultado = d.resultado
    ? `${d.resultado}${d.resultado_descricao ? ` (${d.resultado_descricao})` : ""}`
    : "sem julgamento de mérito registrado";

  const temas = (d.temas_juridicos || []).filter(Boolean).join(", ") || "não informados";

  const ementa = (d.ementa || "").trim();
  const corpo = ementa.length >= 50
    ? `EMENTA (texto oficial): "${ementa.slice(0, 400)}"`
    : d.resumo_ia
      ? `RESUMO DE METADADOS (gerado por IA a partir de classe, assuntos e movimentos do CNJ; não é texto oficial da decisão): "${d.resumo_ia.slice(0, 400)}"`
      : "SEM TEOR DISPONÍVEL (apenas dados de tramitação).";

  return `[${index}] ${meta}
Natureza: ${d.natureza === "julgado" ? "julgado (há resultado registrado)" : "processo relacionado (sem resultado registrado)"}
Resultado: ${resultado}
Temas: ${temas}
${corpo}`;
}

const REGRAS_CITACAO = `## REGRAS DE CITAÇÃO
- Ao citar uma decisão, use o formato exato: "conforme [tipo_decisao] do [tribunal], processo [número], resultado [resultado]".
- Processo sem resultado registrado NÃO é precedente: pode ser mencionado apenas como caso relacionado, nunca como fundamento.
- Trechos marcados como RESUMO DE METADADOS não são texto oficial da decisão. Não os apresente como ementa nem os cite entre aspas como se fossem transcrição.
- Legislação (CF, CLT, CDC, CC, CPC, CP): pode citar artigos que você tenha CERTEZA. Se houver dúvida sobre o número exato, cite genericamente ("o CDC protege contra cobrança indevida" em vez de arriscar "art. 42").
- Súmulas: só cite súmulas do STF ou STJ se tiver CERTEZA absoluta do número e do teor.
- Jurisprudência: SOMENTE as decisões do contexto acima.`;

export function buildGroundingBlock(decisions: GroundingDecision[]): string {
  if (decisions.length === 0) {
    return `\n\n## CONTEXTO DE JURISPRUDÊNCIA
Nenhuma decisão relevante encontrada no nosso banco para esta consulta.
Se sua resposta exigir jurisprudência específica (número de processo, ementa, súmula),
declare abertamente: "Não encontrei decisões específicas no nosso banco sobre este tema".
NUNCA cite números de processo, ementas ou súmulas que você não tenha CERTEZA absoluta —
prefira apenas mencionar a lei ou o tema geral.`;
  }

  const items = decisions.map((d, i) => describeDecision(d, i + 1)).join("\n\n");

  return `\n\n## CONTEXTO OBRIGATÓRIO — DECISÕES DISPONÍVEIS
Você SÓ pode citar decisões jurisprudenciais que estejam listadas abaixo (identificadas por [1], [2] etc.).
Se sua resposta precisar de uma decisão ausente da lista, diga: "Não encontrei decisões específicas no nosso banco sobre este ponto".
NUNCA invente número de processo, ementa, súmula ou nome de tribunal.

${items}

${REGRAS_CITACAO}`;
}
