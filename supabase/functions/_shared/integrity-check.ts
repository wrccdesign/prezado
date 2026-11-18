/**
 * Verificação de integridade de documento: procura sinais de comando oculto
 * destinado a induzir um sistema de IA (ou o julgador) a erro.
 * Só aponta sinais objetivos. Nunca conclui que houve má-fé: quem decide é o advogado.
 */

export type IntegritySignal = {
  tipo: "texto_minusculo" | "fora_da_pagina" | "caractere_invisivel" | "comando_para_ia";
  pagina?: number;
  trecho: string;
};

export type IntegrityReport = {
  status: "sem_sinais" | "suspeito";
  sinais: IntegritySignal[];
  /** O que foi efetivamente verificado neste arquivo. */
  verificado: string[];
};

const MAX_SINAIS = 20;

// Caracteres de largura zero e de controle bidirecional usados para esconder texto.
const INVISIVEIS = /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF\u00AD]/g;

// Frases típicas de comando dirigido a IA. Mantidas específicas para evitar falso positivo
// em texto jurídico comum ("desconsidere" sozinho aparece em peças legítimas).
const PADROES_COMANDO: RegExp[] = [
  /ignore\s+(?:todas\s+)?(?:as\s+)?instru[çc][õo]es\s+(?:anteriores|acima|pr[ée]vias)/i,
  /desconsidere\s+(?:todas\s+)?(?:as\s+)?instru[çc][õo]es/i,
  /ignore\s+(?:all\s+)?(?:previous|prior|above)\s+instructions/i,
  /disregard\s+(?:all\s+)?(?:previous|prior|above)\s+instructions/i,
  /\b(?:system\s+prompt|prompt\s+do\s+sistema|instru[çc][ãa]o\s+oculta)\b/i,
  /voc[êe]\s+(?:é|e)\s+(?:agora\s+)?um[a]?\s+(?:assistente|modelo|ia)\b/i,
  /(?:assistente|modelo|intelig[êe]ncia\s+artificial|\bia\b)[^.\n]{0,60}\b(?:deve|dever[áa])\s+(?:concluir|recomendar|decidir|julgar|opinar)/i,
  /\byou\s+are\s+(?:now\s+)?an?\s+(?:ai|assistant|language\s+model)\b/i,
  /^\s*(?:system|assistant)\s*:/im,
];

function trechoAo(text: string, index: number, len: number): string {
  const start = Math.max(0, index - 40);
  const end = Math.min(text.length, index + len + 40);
  return text.slice(start, end).replace(/\s+/g, " ").trim().slice(0, 200);
}

/** Varredura sobre o texto (vale para PDF, DOCX, TXT, imagem e texto colado). */
export function checkTextSignals(text: string): IntegritySignal[] {
  const sinais: IntegritySignal[] = [];
  const invisiveis = text.match(INVISIVEIS)?.length ?? 0;
  // Um ou dois hífens discretos aparecem em PDF legítimo; sequência indica ocultação.
  if (invisiveis >= 5) {
    sinais.push({ tipo: "caractere_invisivel", trecho: `${invisiveis} caracteres invisíveis no texto` });
  }
  const limpo = text.replace(INVISIVEIS, "");
  for (const re of PADROES_COMANDO) {
    const m = re.exec(limpo);
    if (m) sinais.push({ tipo: "comando_para_ia", trecho: trechoAo(limpo, m.index, m[0].length) });
    if (sinais.length >= MAX_SINAIS) break;
  }
  return sinais;
}

export type PdfTextItem = { str: string; transform: number[]; width?: number };

/** Sinais de layout num PDF: fonte microscópica ou texto posicionado fora da página. */
export function checkPdfItems(
  items: PdfTextItem[],
  view: number[],
  pagina: number,
): IntegritySignal[] {
  const [x0, y0, x1, y1] = view;
  const minusculo: string[] = [];
  const fora: string[] = [];
  for (const it of items) {
    const s = (it.str ?? "").trim();
    if (s.length < 3) continue;
    const [a, b, , , x, y] = it.transform;
    const size = Math.hypot(a, b);
    if (size > 0 && size < 2) minusculo.push(s);
    const w = it.width ?? 0;
    if (x + w < x0 - 1 || x > x1 + 1 || y < y0 - 1 || y > y1 + 1) fora.push(s);
  }
  const out: IntegritySignal[] = [];
  const junta = (xs: string[]) => xs.join(" ").replace(/\s+/g, " ").slice(0, 200);
  // Exige volume mínimo para não acusar um ponto ou marca d'água isolada.
  if (minusculo.join("").length >= 20) out.push({ tipo: "texto_minusculo", pagina, trecho: junta(minusculo) });
  if (fora.join("").length >= 20) out.push({ tipo: "fora_da_pagina", pagina, trecho: junta(fora) });
  return out;
}

export function buildReport(sinais: IntegritySignal[], verificado: string[]): IntegrityReport {
  const s = sinais.slice(0, MAX_SINAIS);
  return { status: s.length ? "suspeito" : "sem_sinais", sinais: s, verificado };
}
