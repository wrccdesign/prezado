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
  /**
   * "precedente": tem ementa (50+ caracteres), pode fundamentar tese.
   * "julgado": tem resultado registrado, sem ementa; só serve como caso análogo.
   * "relacionado": sem resultado e sem ementa; não pode ser citado.
   */
  natureza: NaturezaFonte;
}

export type NaturezaFonte = "precedente" | "julgado" | "relacionado";

/** Tipos que nunca servem de apoio: não decidem o mérito da tese. */
const TIPO_EXCLUIDO = /interlocut|homolog/i;
/** Sem ementa, só sentença com resultado registrado pode aparecer, e apenas como caso análogo. */
const TIPO_SENTENCA = /senten/i;

/**
 * Três níveis de fonte, conforme o teor efetivamente disponível.
 * Decisão interlocutória e homologação nunca são precedente nem julgado.
 */
export function classifyNatureza(
  ementa: string | null | undefined,
  resultado: string | null | undefined,
  tipoDecisao?: string | null,
): NaturezaFonte {
  if (tipoDecisao && TIPO_EXCLUIDO.test(tipoDecisao)) return "relacionado";
  if ((ementa ?? "").trim().length >= 50) return "precedente";
  if (resultado && tipoDecisao && TIPO_SENTENCA.test(tipoDecisao)) return "julgado";
  return "relacionado";
}

/** Filtro mínimo: só entra no contexto o que pode ser citado. */
export function isUsableSource(d: Pick<GroundingDecision, "natureza">): boolean {
  return d.natureza !== "relacionado";
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
    natureza: classifyNatureza((d.ementa as string | null) ?? null, resultado, (d.tipo_decisao as string | null) ?? null),
  };
}

export interface GroundingSumula {
  tribunal: string;
  tipo: string;
  numero: number;
  enunciado: string;
  area: string | null;
  source_url: string | null;
}

/** Súmulas vigentes do acervo curado, relevantes para a consulta. */
export async function fetchGroundingSumulas(
  query: string,
  supabaseUrl: string,
  serviceKey: string,
  limit = 3,
): Promise<GroundingSumula[]> {
  if (!query || query.trim().length < 5) return [];
  try {
    const supabase = createClient(supabaseUrl, serviceKey);
    const { data } = await supabase.rpc("search_sumulas", {
      search_query: query.slice(0, 200),
      filter_tribunal: null,
      filter_area: null,
      result_limit: limit,
    });
    return Array.isArray(data) ? (data as GroundingSumula[]) : [];
  } catch (e) {
    console.warn("Súmula grounding failed:", e instanceof Error ? e.message : e);
    return [];
  }
}

export function buildSumulasBlock(sumulas: GroundingSumula[]): string {
  if (sumulas.length === 0) return "";
  const linhas = sumulas
    .map((s) =>
      `- ${s.tipo === "vinculante" ? "Súmula Vinculante" : "Súmula"} ${s.numero} do ${s.tribunal}${
        s.area ? ` (${s.area})` : ""
      }: "${s.enunciado}"`
    )
    .join("\n");
  return `\n\n## SÚMULAS DISPONÍVEIS (texto oficial conferido)
${linhas}
Cite súmula APENAS se ela estiver nesta lista. Nenhuma outra súmula pode ser citada por número.`;
}

/**
 * Função pura: converte linhas brutas do banco, descarta repetidas e as que não
 * podem ser citadas ("relacionado"), e acrescenta em `target` até `limit`.
 * Usada tanto na busca vetorial quanto no fallback FTS.
 */
export function collectUsable(
  target: GroundingDecision[],
  seen: Set<string>,
  rows: unknown,
  limit: number,
): GroundingDecision[] {
  if (!Array.isArray(rows)) return target;
  for (const raw of rows as Array<Record<string, unknown>>) {
    if (target.length >= limit) break;
    const id = raw?.id as string | undefined;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const g = toGroundingDecision(raw);
    if (isUsableSource(g)) target.push(g);
  }
  return target;
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
      match_count: limit * 3,
      only_julgados: onlyJulgados,
    });
    collectUsable(results, seen, vec, limit);
  } catch (e) {
    console.warn("Vector grounding failed:", e instanceof Error ? e.message : e);
  }

  // 2. Full-text fallback se, já filtradas, sobraram menos de 3 fontes utilizáveis
  if (results.length < 3) {
    try {
      const { data: fts } = await supabase.rpc("search_decisions", {
        search_query: query.slice(0, 200),
        result_limit: limit * 3,
        filter_only_julgados: onlyJulgados ? true : null,
      });
      collectUsable(results, seen, fts, limit);
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
Natureza: ${
    d.natureza === "precedente"
      ? "precedente (há ementa oficial; pode fundamentar tese)"
      : d.natureza === "julgado"
        ? "caso análogo (sentença sem ementa; só pode ser mencionada como caso análogo)"
        : "relacionado (sem resultado e sem teor; não pode ser citado)"
  }
Resultado: ${resultado}
Temas: ${temas}
${corpo}`;
}

const REGRAS_CITACAO = `## REGRAS DE CITAÇÃO
- Ao citar uma decisão, use o formato exato: "conforme [tipo_decisao] do [tribunal], processo [número], resultado [resultado]".
- Fonte marcada como "precedente" (tem ementa oficial): pode sustentar tese jurídica.
- Fonte marcada como "caso análogo": só pode ser mencionada na forma "caso análogo: [tipo_decisao] do [tribunal], processo [número]". É PROIBIDO escrever que o tribunal "julgou procedente pedido semelhante", atribuir a ela fatos que não constam do contexto, ou usá-la para afirmar entendimento consolidado, jurisprudência pacífica ou tese do tribunal.
- Fonte marcada como "relacionado": não pode ser citada de forma alguma.
- Trechos marcados como RESUMO DE METADADOS não são texto oficial da decisão. Não os apresente como ementa nem os cite entre aspas como se fossem transcrição.
- Legislação (CF, CLT, CDC, CC, CPC, CP): pode citar artigos que você tenha CERTEZA. Se houver dúvida sobre o número exato, cite genericamente ("o CDC protege contra cobrança indevida" em vez de arriscar "art. 42").
- Súmulas: cite apenas as súmulas listadas no bloco "SÚMULAS DISPONÍVEIS". Se esse bloco não existir nesta conversa, não cite nenhuma súmula por número.
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
