/**
 * Formata uma data vinda do banco no tipo `date` puro (YYYY-MM-DD) para
 * DD/MM/YYYY por manipulação de string.
 *
 * Não usar `new Date("2024-11-29")`: a string é lida como meia-noite UTC e a
 * renderização em UTC-3 volta um dia. Este helper NÃO deve ser usado em
 * timestamps reais com hora (created_at etc.), onde a conversão de fuso é
 * desejada.
 */
export function formatDateBR(value?: string | null): string {
  if (!value) return "";
  const match = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return String(value);
  const [, ano, mes, dia] = match;
  return `${dia}/${mes}/${ano}`;
}

// Feriados nacionais (Lei 662/1949, Lei 6.802/1980, Lei 10.607/2002, Lei 14.759/2023)
// e móveis de expressão nacional (Paixão de Cristo). Carnaval e Corpus Christi
// não são feriados nacionais por lei e ficam fora.
function pascoa(ano: number): Date {
  const a = ano % 19, b = Math.floor(ano / 100), c = ano % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes - 1, dia);
}

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function feriadosNacionais(ano: number): Map<string, string> {
  const m = new Map<string, string>();
  const fixos: Array<[string, string]> = [
    ["01-01", "Confraternização Universal"],
    ["04-21", "Tiradentes"],
    ["05-01", "Dia do Trabalho"],
    ["09-07", "Independência"],
    ["10-12", "Nossa Senhora Aparecida"],
    ["11-02", "Finados"],
    ["11-15", "Proclamação da República"],
    ["12-25", "Natal"],
  ];
  for (const [md, nome] of fixos) m.set(`${ano}-${md}`, nome);
  if (ano >= 2024) m.set(`${ano}-11-20`, "Dia Nacional de Zumbi e da Consciência Negra");
  const p = pascoa(ano);
  const sexta = new Date(p.getFullYear(), p.getMonth(), p.getDate() - 2);
  m.set(iso(sexta), "Sexta-feira da Paixão");
  return m;
}

function nomeFeriado(d: Date): string | undefined {
  return feriadosNacionais(d.getFullYear()).get(iso(d));
}

export function ehDiaUtil(d: Date): boolean {
  const w = d.getDay();
  return w !== 0 && w !== 6 && !nomeFeriado(d);
}

export interface DiaDescartado { data: string; motivo: string }

/** Soma (ou subtrai, se n < 0) dias úteis pulando fins de semana e feriados nacionais. */
export function somarDiasUteis(inicio: Date, n: number): { final: Date; descartados: DiaDescartado[] } {
  const passo = n < 0 ? -1 : 1;
  let restante = Math.abs(n);
  const d = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
  const descartados: DiaDescartado[] = [];
  while (restante > 0) {
    d.setDate(d.getDate() + passo);
    if (ehDiaUtil(d)) restante--;
    else descartados.push({ data: formatDateBR(iso(d)), motivo: nomeFeriado(d) ?? (d.getDay() === 0 ? "domingo" : "sábado") });
  }
  return { final: d, descartados };
}

/** Diferença com sinal: positiva se fim > inicio. Dias úteis excluem feriados nacionais. */
export function diferencaDatas(inicio: Date, fim: Date): { corridos: number; uteis: number; invertido: boolean } {
  const a = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
  const b = new Date(fim.getFullYear(), fim.getMonth(), fim.getDate());
  const corridos = Math.round((b.getTime() - a.getTime()) / 86400000);
  const invertido = corridos < 0;
  const [de, ate] = invertido ? [b, a] : [a, b];
  let uteis = 0;
  const d = new Date(de);
  while (d < ate) {
    d.setDate(d.getDate() + 1);
    if (ehDiaUtil(d)) uteis++;
  }
  return { corridos, uteis: invertido ? -uteis : uteis, invertido };
}
