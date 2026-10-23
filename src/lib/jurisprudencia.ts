import { JURISPRUDENCIA_TEMAS } from "@/seo/jurisprudenciaTemas";

const SUPERIORES = new Set(["STF", "STJ", "TST", "TSE", "STM"]);

/** Formata número CNJ de 20 dígitos como NNNNNNN-DD.AAAA.J.TR.OOOO; outros formatos voltam intactos. */
export function formatCnj(raw: string | null | undefined): string {
  if (!raw) return "";
  const d = raw.replace(/\D/g, "");
  if (d.length !== 20) return raw;
  return `${d.slice(0, 7)}-${d.slice(7, 9)}.${d.slice(9, 13)}.${d.slice(13, 14)}.${d.slice(14, 16)}.${d.slice(16)}`;
}

/** Segmento de justiça (J) do número CNJ, ou null. */
function segmentoCnj(raw: string | null | undefined): string | null {
  const d = (raw || "").replace(/\D/g, "");
  return d.length === 20 ? d.slice(13, 14) : null;
}

/**
 * Link de fonte confiável para o tribunal do processo. Consulta processual do STJ
 * só vale para processos do STJ; nos demais casos o link é descartado.
 */
export function linkFonteConfiavel(
  sourceUrl: string | null | undefined,
  tribunal: string | null | undefined,
  numero?: string | null,
): string | null {
  if (!sourceUrl) return null;
  let host = "";
  try { host = new URL(sourceUrl).hostname.toLowerCase(); } catch { return null; }
  const trib = (tribunal || "").toUpperCase();
  if (host.endsWith("stj.jus.br") && trib !== "STJ") return null;
  if (host.endsWith("stj.jus.br") && segmentoCnj(numero) === "5") return null;
  return sourceUrl;
}

export function instanciaLabel(instancia: string | null | undefined, tribunal: string | null | undefined): string | null {
  if (!instancia) return null;
  if (instancia === "1grau") return "1º Grau";
  if (instancia === "2grau") return "2º Grau";
  if (instancia === "superior") return SUPERIORES.has((tribunal || "").toUpperCase()) ? "Superior" : "Regional";
  return instancia;
}

/** Relator só aparece quando é um nome, não um código interno ou um gabinete genérico. */
export function relatorExibivel(relator: string | null | undefined): string | null {
  if (!relator) return null;
  if (/c[oó]digo\s*\d+/i.test(relator)) return null;
  if (/gabinete da presid[eê]ncia/i.test(relator)) return null;
  return relator;
}

const STOP = new Set(["de", "da", "do", "das", "dos", "e", "em", "a", "o", "por", "para", "com", "na", "no", "um", "uma", "sobre"]);

export function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !STOP.has(t));
}

/** Proporção dos termos da busca presentes no texto. */
function cobertura(qTokens: string[], texto: string) {
  if (!qTokens.length) return 0;
  const set = new Set(tokens(texto));
  return qTokens.filter((t) => set.has(t)).length / qTokens.length;
}

export interface DecisaoCurada {
  id: string;
  tribunal: string;
  tipo: string;
  numero: string;
  relator: string;
  data: string;
  ementa: string;
  fonte: string;
  temaSlug: string;
}

/**
 * Decisões das páginas de tema que combinam com a busca. Usado quando a busca
 * principal volta vazia, para não dar falso negativo sobre tema documentado.
 */
export function buscarDecisoesCuradas(query: string, limite = 10): DecisaoCurada[] {
  const q = tokens(query);
  if (!q.length) return [];
  const vistos = new Set<string>();
  const achados: { d: DecisaoCurada; score: number }[] = [];
  for (const tema of JURISPRUDENCIA_TEMAS) {
    const scoreTema = cobertura(q, `${tema.query} ${tema.title}`);
    for (const d of tema.decisoes) {
      if (vistos.has(d.id)) continue;
      const score = Math.max(scoreTema, cobertura(q, d.ementa));
      if (score >= 0.6) {
        vistos.add(d.id);
        achados.push({ d: { ...d, temaSlug: tema.slug }, score });
      }
    }
  }
  return achados.sort((a, b) => b.score - a.score).slice(0, limite).map((a) => a.d);
}

/** Súmula só aparece se o enunciado ou a área tiver termos da busca. */
export function sumulaRelevante(query: string, enunciado: string, area: string | null | undefined): boolean {
  const q = tokens(query);
  if (!q.length) return false;
  const set = new Set(tokens(`${enunciado} ${area || ""}`));
  const hits = q.filter((t) => set.has(t)).length;
  return hits >= Math.min(2, q.length);
}
