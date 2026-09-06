/**
 * Verificação pós-geração de citações.
 *
 * `extractCitations` é pura: identifica por regex artigos de lei, súmulas e
 * números de processo (CNJ) em um texto gerado pela IA.
 * `verifyCitations` confere apenas os processos contra a tabela `decisions`
 * (o acervo é parcial, por isso nunca dizemos "inexistente" ou "inválido").
 * Súmulas são conferidas contra a tabela `sumulas` (acervo curado, parcial).
 * Artigos de lei seguem `nao_verificavel`.
 */

export type CitationTipo = "processo" | "sumula" | "artigo";
export type CitationStatus = "verificado" | "nao_encontrado" | "nao_verificavel";

export interface CitationItem {
  tipo: CitationTipo;
  texto: string;
  /** Só dígitos, para processos. */
  normalizado?: string;
  status?: CitationStatus;
}

export interface CitationReport {
  items: CitationItem[];
  verificados: number;
  nao_encontrados: number;
  nao_verificaveis: number;
}

const CNJ_PONTUADO = /\b\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}\b/g;
const CNJ_DIGITOS = /(?<![\d.\-])\d{20}(?![\d.\-])/g;
const SUMULA =
  /S[úu]mula\s+(?:Vinculante\s+)?(?:n[.º°]?\s*)?\d+\s+d[oa]\s+(?:STF|STJ|TST|TSE|TCU)/gi;
const ARTIGO_SIGLA =
  /art(?:igo)?\.?\s*\d+(?:[.\-º°]?[-\w]{0,4})?\s*(?:,\s*[^,.;]{0,40}?)?\s*,?\s*d[oa]s?\s+(?:CLT|CDC|CC|CPC|CF|CP|CPP)\b/gi;
const ARTIGO_LEI =
  /art(?:igo)?\.?\s*\d+(?:[.\-º°]?[-\w]{0,4})?\s*(?:,\s*[^,.;]{0,40}?)?\s*,?\s*d[ao]\s+Lei\s+(?:Complementar\s+)?n?[.º°]?\s*[\d.]+\s*\/\s*\d{4}/gi;

const onlyDigits = (s: string) => s.replace(/\D/g, "");

function pushUnique(map: Map<string, CitationItem>, item: CitationItem) {
  const key = `${item.tipo}:${(item.normalizado ?? item.texto).toLowerCase()}`;
  if (!map.has(key)) map.set(key, item);
}

/** Extração pura de citações a partir do texto gerado. */
export function extractCitations(text: string): CitationItem[] {
  const found = new Map<string, CitationItem>();
  if (!text) return [];

  for (const m of text.matchAll(CNJ_PONTUADO)) {
    pushUnique(found, { tipo: "processo", texto: m[0], normalizado: onlyDigits(m[0]) });
  }
  for (const m of text.matchAll(CNJ_DIGITOS)) {
    pushUnique(found, { tipo: "processo", texto: m[0], normalizado: onlyDigits(m[0]) });
  }
  for (const m of text.matchAll(SUMULA)) {
    pushUnique(found, { tipo: "sumula", texto: m[0].replace(/\s+/g, " ").trim() });
  }
  for (const m of text.matchAll(ARTIGO_LEI)) {
    pushUnique(found, { tipo: "artigo", texto: m[0].replace(/\s+/g, " ").trim() });
  }
  for (const m of text.matchAll(ARTIGO_SIGLA)) {
    pushUnique(found, { tipo: "artigo", texto: m[0].replace(/\s+/g, " ").trim() });
  }

  return [...found.values()];
}

/** Aceita o client do supabase-js ou um duplo de teste. */
// deno-lint-ignore no-explicit-any
type MinimalClient = { from: (table: string) => any };

/**
 * Confere os processos contra `decisions.numero_processo`, normalizando os dois
 * lados para dígitos (o banco tem os dois formatos, pontuado e corrido).
 */
/** Extrai tribunal, tipo e número do texto de uma súmula citada. */
export function parseSumula(
  texto: string,
): { tribunal: string; tipo: "comum" | "vinculante"; numero: number } | null {
  const m = texto.match(
    /S[úu]mula\s+(Vinculante\s+)?(?:n[.º°]?\s*)?(\d+)\s+d[oa]\s+(STF|STJ|TST|TSE|TCU)/i,
  );
  if (!m) return null;
  return {
    tribunal: m[3].toUpperCase(),
    tipo: m[1] ? "vinculante" : "comum",
    numero: Number(m[2]),
  };
}

export async function verifyCitations(
  items: CitationItem[],
  supabase: MinimalClient,
): Promise<CitationReport> {
  const processos = items.filter((i) => i.tipo === "processo" && i.normalizado);
  const encontrados = new Set<string>();

  if (processos.length > 0) {
    const candidatos = new Set<string>();
    for (const p of processos) {
      const d = p.normalizado!;
      candidatos.add(d);
      if (d.length === 20) {
        candidatos.add(
          `${d.slice(0, 7)}-${d.slice(7, 9)}.${d.slice(9, 13)}.${d.slice(13, 14)}.${d.slice(14, 16)}.${d.slice(16, 20)}`,
        );
      }
    }
    try {
      const { data } = await supabase
        .from("decisions")
        .select("numero_processo")
        .in("numero_processo", [...candidatos]);
      for (const row of (data ?? []) as Array<{ numero_processo: string | null }>) {
        if (row.numero_processo) encontrados.add(onlyDigits(row.numero_processo));
      }
    } catch (e) {
      console.error("verifyCitations query failed:", e);
    }
  }

  // Súmulas: confere número + tribunal + tipo no acervo curado.
  const sumulasOk = new Set<string>();
  const sumulaKeys = new Map<string, string>();
  const sumulas = items.filter((i) => i.tipo === "sumula");
  if (sumulas.length > 0) {
    try {
      const parsed = sumulas
        .map((i) => ({ item: i, p: parseSumula(i.texto) }))
        .filter((x) => x.p);
      for (const { item, p } of parsed) {
        sumulaKeys.set(item.texto, `${p!.tribunal}:${p!.tipo}:${p!.numero}`);
      }
      const numeros = [...new Set(parsed.map((x) => x.p!.numero))];
      if (numeros.length > 0) {
        const { data } = await supabase
          .from("sumulas")
          .select("tribunal, tipo, numero")
          .in("numero", numeros);
        for (
          const row of (data ?? []) as Array<
            { tribunal: string; tipo: string; numero: number }
          >
        ) {
          sumulasOk.add(`${row.tribunal.toUpperCase()}:${row.tipo}:${row.numero}`);
        }
      }
    } catch (e) {
      console.error("verifyCitations (súmulas) query failed:", e);
    }
  }

  const result = items.map((item) => {
    if (item.tipo === "sumula") {
      const key = sumulaKeys.get(item.texto);
      if (!key) return { ...item, status: "nao_verificavel" as const };
      return {
        ...item,
        status: (sumulasOk.has(key) ? "verificado" : "nao_encontrado") as CitationStatus,
      };
    }
    if (item.tipo !== "processo") return { ...item, status: "nao_verificavel" as const };
    return {
      ...item,
      status: (encontrados.has(item.normalizado ?? "")
        ? "verificado"
        : "nao_encontrado") as CitationStatus,
    };
  });

  return {
    items: result,
    verificados: result.filter((i) => i.status === "verificado").length,
    nao_encontrados: result.filter((i) => i.status === "nao_encontrado").length,
    nao_verificaveis: result.filter((i) => i.status === "nao_verificavel").length,
  };
}

/** Nunca lança: verificação é acessória e não pode atrasar nem quebrar a resposta. */
export async function buildCitationReport(
  text: string,
  supabase: MinimalClient,
): Promise<CitationReport | null> {
  try {
    const items = extractCitations(text);
    if (items.length === 0) {
      return { items: [], verificados: 0, nao_encontrados: 0, nao_verificaveis: 0 };
    }
    return await verifyCitations(items, supabase);
  } catch (e) {
    console.error("buildCitationReport failed:", e);
    return null;
  }
}
