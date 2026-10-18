/**
 * Revisão automática de saída (Fase 2).
 *
 * Regra central: a revisão CORRIGE só o que é verificável em código
 * (valor por extenso, ortografia via passada com trava) e SINALIZA o resto
 * (datas/valores que não constam nos fatos, gênero da parte). Nunca reescreve
 * conteúdo jurídico.
 */

import { aiChatText, type AIUsageMeta } from "./ai.ts";

export interface OutputReview {
  correcoes: string[];
  pontos_a_conferir: string[];
}

export interface ReviewContext {
  /** Fatos informados pelo usuário (ou texto analisado). */
  fatos?: string;
  /** Pedidos informados pelo usuário (petição). */
  pedidos?: string;
}

// ---------------------------------------------------------------------------
// 1. Valor por extenso (gerado em código, pt-BR)
// ---------------------------------------------------------------------------

const UNIDADES = [
  "zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove",
  "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove",
];
const DEZENAS = [
  "", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa",
];
const CENTENAS = [
  "", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos",
  "seiscentos", "setecentos", "oitocentos", "novecentos",
];

function extensoAte999(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "cem";
  const partes: string[] = [];
  const c = Math.floor(n / 100);
  const resto = n % 100;
  if (c > 0) partes.push(CENTENAS[c]);
  if (resto > 0) {
    if (resto < 20) {
      partes.push(UNIDADES[resto]);
    } else {
      const d = Math.floor(resto / 10);
      const u = resto % 10;
      partes.push(u > 0 ? `${DEZENAS[d]} e ${UNIDADES[u]}` : DEZENAS[d]);
    }
  }
  return partes.join(" e ");
}

function extensoInteiro(n: number): string {
  if (n === 0) return "zero";
  const partes: string[] = [];
  const milhoes = Math.floor(n / 1_000_000);
  const milhares = Math.floor((n % 1_000_000) / 1000);
  const resto = n % 1000;

  if (milhoes > 0) {
    const m = extensoInteiro(milhoes);
    partes.push(milhoes === 1 ? "um milhão" : `${m} milhões`);
  }
  if (milhares > 0) {
    // "mil", nunca "um mil"
    partes.push(milhares === 1 ? "mil" : `${extensoAte999(milhares)} mil`);
  }
  if (resto > 0) {
    partes.push(extensoAte999(resto));
  }

  // Padrão escolhido: vírgula separando o grupo de milhares/milhões do resto
  // ("cinco mil, quatrocentos e oitenta reais").
  if (partes.length > 1 && resto > 0) {
    return `${partes.slice(0, -1).join(" e ")}, ${partes[partes.length - 1]}`;
  }
  return partes.join(" e ");
}

/**
 * Valor monetário por extenso em pt-BR.
 * 480 -> "quatrocentos e oitenta reais"; 5000 -> "cinco mil reais";
 * 5480 -> "cinco mil, quatrocentos e oitenta reais"; 1 -> "um real";
 * 0.5 -> "cinquenta centavos"; 1000000 -> "um milhão de reais".
 */
export function valorPorExtenso(valor: number): string {
  if (!Number.isFinite(valor) || valor < 0) return "";
  const centavosTotais = Math.round(valor * 100);
  const reais = Math.floor(centavosTotais / 100);
  const centavos = centavosTotais % 100;

  const partes: string[] = [];
  if (reais > 0) {
    const ext = extensoInteiro(reais);
    if (reais === 1) {
      partes.push("um real");
    } else if (reais % 1_000_000 === 0) {
      partes.push(`${ext} de reais`);
    } else {
      partes.push(`${ext} reais`);
    }
  }
  if (centavos > 0) {
    const ext = extensoInteiro(centavos);
    partes.push(centavos === 1 ? "um centavo" : `${ext} centavos`);
  }
  if (partes.length === 0) return "zero real";
  return partes.join(" e ");
}

/** Converte "1.250,37" / "1250,37" / "1250" em número. */
export function parseValorBRL(texto: string): number | null {
  const limpo = texto.trim().replace(/\s/g, "");
  if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$/.test(limpo) && !/^\d+(,\d{1,2})?$/.test(limpo)) {
    return null;
  }
  const normalizado = limpo.replace(/\./g, "").replace(",", ".");
  const n = Number(normalizado);
  return Number.isFinite(n) ? n : null;
}

function normalizarExtenso(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[(),.;]/g, "")
    .trim();
}

/**
 * Varre "R$ <número> (<extenso>)" e reescreve o extenso a partir do número.
 * O número manda, nunca o extenso. Retorna o texto corrigido e as correções.
 */
export function corrigirValoresPorExtenso(texto: string): { texto: string; correcoes: string[] } {
  const correcoes: string[] = [];
  const re = /R\$\s*([\d.]+(?:,\d{1,2})?)\s*\(([^)]+)\)/g;
  const textoFinal = texto.replace(re, (match, numStr: string, extensoAtual: string) => {
    const valor = parseValorBRL(numStr);
    if (valor === null) return match;
    const extensoCorreto = valorPorExtenso(valor);
    if (!extensoCorreto) return match;
    if (normalizarExtenso(extensoAtual) === normalizarExtenso(extensoCorreto)) return match;
    correcoes.push(`Valor por extenso ajustado: R$ ${numStr}`);
    return `R$ ${numStr} (${extensoCorreto})`;
  });
  return { texto: textoFinal, correcoes };
}

// ---------------------------------------------------------------------------
// 2. Fidelidade aos fatos (só sinaliza, nunca corrige)
// ---------------------------------------------------------------------------

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function extrairDatas(texto: string): string[] {
  const out = new Set<string>();
  for (const m of texto.matchAll(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g)) {
    out.add(`${Number(m[1])}/${Number(m[2])}/${m[3]}`);
  }
  for (const m of texto.matchAll(/\b(\d{1,2})\s+de\s+([a-zç]+)\s+de\s+(\d{4})\b/gi)) {
    const mes = MESES.indexOf(m[2].toLowerCase());
    if (mes >= 0) out.add(`${Number(m[1])}/${mes + 1}/${m[3]}`);
  }
  return [...out];
}

function extrairValores(texto: string): number[] {
  const out: number[] = [];
  for (const m of texto.matchAll(/R\$\s*([\d.]+(?:,\d{1,2})?)/g)) {
    const v = parseValorBRL(m[1]);
    if (v !== null) out.push(v);
  }
  return out;
}

/** Anos de leis/decisões citadas (ex.: "Lei 8.078/1990", "de 1940") não são datas de fato. */
function anosDeLeis(texto: string): Set<string> {
  const out = new Set<string>();
  for (const m of texto.matchAll(/(?:lei|decreto|resolu[çc][ãa]o|s[úu]mula|emenda)[^.\n]{0,60}?\/(\d{4})/gi)) {
    out.add(m[1]);
  }
  return out;
}

const MARCAS_FEMININO = /\b(fui|estou|sou|era|fiquei|fui sendo|me senti|me considero)\s+[\wç]+a\b|\b(realocada|demitida|demissionada|contratada|contratante|empregada|lesada|enganada|cobrada|prejudicada|afastada|grávida|gestante|mulher|esposa|mãe)\b/i;
const MARCAS_MASCULINO = /\b(fui|estou|sou|era|fiquei)\s+[\wç]+o\b|\b(realocado|demitido|contratado|empregado|lesado|enganado|prejudicado|afastado|marido|pai|homem)\b/i;

function generoDosFatos(fatos: string): "f" | "m" | null {
  if (MARCAS_FEMININO.test(fatos)) return "f";
  if (MARCAS_MASCULINO.test(fatos)) return "m";
  return null;
}

/**
 * Compara a saída com os fatos/pedidos e devolve pontos a conferir.
 * Nunca altera o texto.
 */
export function verificarFidelidadeFatos(saida: string, ctx: ReviewContext): string[] {
  const pontos: string[] = [];
  const base = `${ctx.fatos ?? ""}\n${ctx.pedidos ?? ""}`;
  if (!base.trim() || !saida.trim()) return pontos;

  const datasBase = new Set(extrairDatas(base));
  const valoresBase = new Set(extrairValores(base).map((v) => v.toFixed(2)));
  // Valor da causa: soma explícita dos valores dos pedidos é legítima.
  const somaPedidos = extrairValores(ctx.pedidos ?? "").reduce((a, b) => a + b, 0);
  if (somaPedidos > 0) valoresBase.add(somaPedidos.toFixed(2));
  const anosLei = anosDeLeis(saida);

  for (const m of saida.matchAll(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g)) {
    const chave = `${Number(m[1])}/${Number(m[2])}/${m[3]}`;
    if (!datasBase.has(chave) && !anosLei.has(m[3])) {
      pontos.push(`A data ${m[0]} não aparece nos fatos informados.`);
    }
  }
  for (const m of saida.matchAll(/R\$\s*([\d.]+(?:,\d{1,2})?)/g)) {
    const v = parseValorBRL(m[1]);
    if (v !== null && !valoresBase.has(v.toFixed(2))) {
      pontos.push(`O valor R$ ${m[1]} não aparece nos fatos nem nos pedidos informados.`);
    }
  }

  const genero = generoDosFatos(base);
  if (genero === "f" && /\bo autor\b/i.test(saida) && !/\ba autora\b/i.test(saida)) {
    pontos.push("Os fatos indicam pessoa do sexo feminino, mas o texto usa \"o Autor\". Confira a concordância.");
  }
  if (genero === "m" && /\ba autora\b/i.test(saida) && !/\bo autor\b/i.test(saida)) {
    pontos.push("Os fatos indicam pessoa do sexo masculino, mas o texto usa \"a Autora\". Confira a concordância.");
  }

  // Deduplica mantendo a ordem.
  return [...new Set(pontos)];
}

// ---------------------------------------------------------------------------
// 3. Passada de gramática com trava
// ---------------------------------------------------------------------------

/** Tokens que a correção de gramática não pode tocar. */
function tokensProtegidos(texto: string): string[] {
  const out: string[] = [];
  const padroes: RegExp[] = [
    /\b\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}\b/g, // número CNJ
    /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, // datas
    /R\$\s*[\d.]+(?:,\d{1,2})?/g, // valores
    /\b\d+([.,]\d+)?%?\b/g, // números em geral
    /\b(STF|STJ|TST|TSE|STM|CNJ|TRF\d?|TJ[A-Z]{2}|TRT\d{1,2}|OAB)\b/g, // siglas
    /\bart\.?\s*\d+(\.\d+)?/gi, // artigos de lei
    /\bS[úu]mula\s+(Vinculante\s+)?\d+/gi, // súmulas
    /\bTema\s+\d+/gi, // temas repetitivos
    /\bLei\s+(n[º°]\s*)?[\d.]+\/\d{4}/gi, // leis com número/ano
  ];
  for (const re of padroes) {
    for (const m of texto.matchAll(re)) out.push(m[0].toLowerCase().replace(/\s+/g, " "));
  }
  return out.sort();
}

function multisetIgual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

/**
 * Trava da passada de gramática: a correção é aceita só se preservar todos os
 * tokens protegidos (números, datas, siglas, processos, artigos, súmulas,
 * temas) e mudar no máximo 3% dos caracteres.
 */
export function gramaticaSegura(antes: string, depois: string): boolean {
  if (!antes || !depois) return false;
  const variacao = Math.abs(depois.length - antes.length) / antes.length;
  if (variacao > 0.03) return false;
  return multisetIgual(tokensProtegidos(antes), tokensProtegidos(depois));
}

const GRAMMAR_PROMPT = `Corrija APENAS erros de ortografia e de concordância verbal e nominal do texto abaixo.
É PROIBIDO: alterar qualquer número, data, valor, sigla, nome próprio, artigo de lei, súmula ou número de processo; reescrever frases; mudar o sentido; adicionar ou remover conteúdo.
Se o texto estiver correto, devolva-o exatamente como recebeu.
Responda somente com o texto corrigido, sem comentários.`;

/**
 * Passada de gramática via modelo leve, com trava em código. Em caso de falha
 * da IA ou de violação da trava, mantém o original e registra em log.
 */
export async function passadaGramatica(texto: string, meta: AIUsageMeta): Promise<string> {
  if (!texto || texto.trim().length < 40) return texto;
  try {
    const corrigido = await aiChatText({
      model: "light",
      ...meta,
      temperature: 0,
      timeoutMs: 30_000,
      messages: [
        { role: "system", content: GRAMMAR_PROMPT },
        { role: "user", content: texto.slice(0, 20000) },
      ],
    });
    if (!corrigido || !corrigido.trim()) return texto;
    if (!gramaticaSegura(texto, corrigido)) {
      console.warn(`[output-review] passada de gramática descartada pela trava (${meta.functionName})`);
      return texto;
    }
    return corrigido;
  } catch (e) {
    console.error("[output-review] passada de gramática falhou, mantendo original:", e instanceof Error ? e.message : e);
    return texto;
  }
}

// ---------------------------------------------------------------------------
// 4. Orquestrador
// ---------------------------------------------------------------------------

/**
 * Revisa um texto de saída: corrige valores por extenso, roda a passada de
 * gramática com trava e sinaliza pontos de fidelidade aos fatos.
 */
export async function revisarSaida(
  texto: string,
  ctx: ReviewContext,
  meta: AIUsageMeta,
): Promise<{ texto: string; review: OutputReview }> {
  const { texto: comValores, correcoes } = corrigirValoresPorExtenso(texto);
  const revisado = await passadaGramatica(comValores, meta);
  const pontos = verificarFidelidadeFatos(revisado, ctx);
  return { texto: revisado, review: { correcoes, pontos_a_conferir: pontos } };
}

const SEPARADOR = "\n§§§\n";

/**
 * Revisa uma lista de campos de texto com UMA passada de gramática conjunta
 * (separador interno). Se o modelo quebrar a estrutura, a gramática é
 * descartada e ficam só as correções verificáveis em código.
 */
export async function revisarCampos<T extends Record<string, unknown>>(
  obj: T,
  campos: string[],
  ctx: ReviewContext,
  meta: AIUsageMeta,
): Promise<{ obj: T; review: OutputReview }> {
  const correcoes: string[] = [];
  const pontos: string[] = [];
  const resultado: Record<string, unknown> = { ...obj };

  // 1. Valores por extenso, campo a campo (verificável em código).
  const textos: string[] = [];
  const indiceCampos: number[] = [];
  campos.forEach((campo, i) => {
    const valor = obj[campo];
    if (typeof valor === "string" && valor.trim()) {
      const { texto, correcoes: c } = corrigirValoresPorExtenso(valor);
      correcoes.push(...c);
      resultado[campo] = texto;
      textos.push(texto);
      indiceCampos.push(i);
    }
  });

  // 2. Passada de gramática única sobre os campos de texto.
  if (textos.length > 0) {
    const junto = textos.join(SEPARADOR);
    const revisado = await passadaGramatica(junto, meta);
    const partes = revisado.split(SEPARADOR);
    if (partes.length === textos.length) {
      partes.forEach((parte, k) => {
        resultado[campos[indiceCampos[k]]] = parte;
      });
    } else {
      console.warn(`[output-review] gramática descartada: estrutura quebrada (${meta.functionName})`);
    }
  }

  // 3. Fidelidade aos fatos sobre o texto final.
  const textoFinal = campos
    .map((c) => resultado[c])
    .filter((v): v is string => typeof v === "string")
    .join("\n");
  pontos.push(...verificarFidelidadeFatos(textoFinal, ctx));

  return {
    obj: resultado as T,
    review: {
      correcoes: [...new Set(correcoes)],
      pontos_a_conferir: [...new Set(pontos)],
    },
  };
}
