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
}

export async function fetchGroundingContext(
  query: string,
  supabaseUrl: string,
  serviceKey: string,
  limit = 5
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
    });
    if (Array.isArray(vec)) {
      for (const d of vec) {
        if (!seen.has(d.id)) {
          seen.add(d.id);
          results.push({
            id: d.id,
            tribunal: d.tribunal,
            numero_processo: d.numero_processo,
            comarca: d.comarca,
            data_decisao: d.data_decisao,
            ementa: d.ementa,
          });
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
      });
      if (Array.isArray(fts)) {
        for (const d of fts) {
          if (!seen.has(d.id)) {
            seen.add(d.id);
            results.push({
              id: d.id,
              tribunal: d.tribunal,
              numero_processo: d.numero_processo,
              comarca: d.comarca,
              data_decisao: d.data_decisao,
              ementa: d.ementa,
            });
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

export function buildGroundingBlock(decisions: GroundingDecision[]): string {
  if (decisions.length === 0) {
    return `\n\n## CONTEXTO DE JURISPRUDÊNCIA
Nenhuma decisão relevante encontrada no nosso banco para esta consulta.
Se sua resposta exigir jurisprudência específica (número de processo, ementa, súmula),
declare abertamente: "Não encontrei decisões específicas no nosso banco sobre este tema".
NUNCA cite números de processo, ementas ou súmulas que você não tenha CERTEZA absoluta —
prefira apenas mencionar a lei ou o tema geral.`;
  }

  const items = decisions
    .map((d, i) => {
      const ementa = (d.ementa || "").slice(0, 400);
      const meta = [d.tribunal, d.numero_processo, d.comarca, d.data_decisao].filter(Boolean).join(" · ");
      return `[${i + 1}] ${meta}\n"${ementa}"`;
    })
    .join("\n\n");

  return `\n\n## CONTEXTO OBRIGATÓRIO — DECISÕES DISPONÍVEIS
Você SÓ pode citar decisões jurisprudenciais que estejam listadas abaixo (identificadas por [1], [2] etc.).
Se sua resposta precisar de uma decisão ausente da lista, diga: "Não encontrei decisões específicas no nosso banco sobre este ponto".
NUNCA invente número de processo, ementa, súmula ou nome de tribunal.
Sempre que citar uma decisão, use o formato: "conforme decisão do [tribunal] no processo [número]" e mencione o número exato listado.

${items}

## REGRAS DE CITAÇÃO
- Legislação (CF, CLT, CDC, CC, CPC, CP): pode citar artigos que você tenha CERTEZA. Se houver dúvida sobre o número exato, cite genericamente ("o CDC protege contra cobrança indevida" em vez de inventar "art. 42").
- Súmulas: só cite súmulas do STF ou STJ se tiver CERTEZA absoluta do número e do teor.
- Jurisprudência: SOMENTE as decisões do CONTEXTO acima.`;
}
