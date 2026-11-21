/**
 * Núcleo puro do cálculo de correção monetária e juros (sem rede, sem banco),
 * para que a regra por período seja testável com índices mockados.
 *
 * Regime padrão `legal_14905` (dívida civil sem taxa pactuada):
 * - até 10/01/2003: 0,5% a.m. (art. 1.062 CC/1916) + índice escolhido;
 * - 11/01/2003 a 29/08/2024, com juros fluindo: Selic (SGS 4390) como encargo
 *   único, Tema 1.368 do STJ (REsp 2.199.164/PR); sem índice de preços e sem 1%;
 * - antes do termo inicial dos juros: só o índice escolhido;
 * - a partir de 30/08/2024: IPCA (ou índice contratual) + Taxa Legal (SGS 29543, piso zero).
 */

export const VIGENCIA_14905 = "2024-08-30";
export const MES_TRANSICAO = "2024-08-01";
/** Art. 406 do CC/2002 vigora a partir de 11/01/2003 (art. 2.044). */
export const CC2002 = "2003-01-11";
/** Último dia do período do Tema 1.368. */
export const FIM_TEMA_1368 = "2024-08-29";

export const INDICES_VALIDOS = [
  "ipca", "ipca_e", "inpc", "igpm", "selic_mensal", "tr", "poupanca", "fixo",
] as const;

export type Indice = typeof INDICES_VALIDOS[number];
export type RegimeJuros = "legal_14905" | "taxa_fixa" | "nenhum";
export type TipoJuros = "simples" | "compostos";
export type Regime = "pre_14905" | "tema_1368" | "transicao_14905" | "pos_14905";

export interface LinhaMemoria {
  mes_ref: string;
  indice_utilizado: string;
  variacao_percentual: number;
  fator_do_mes: number;
  fator_acumulado: number;
  saldo_corrigido: number;
  juros_do_mes: number;
  juros_acumulados: number;
  regime: Regime;
}

export interface Parametros {
  valor: number;
  dIni: Date;
  dFim: Date;
  indice: Indice;
  proRata: boolean;
  manterIndiceContratual: boolean;
  regimeJuros: RegimeJuros;
  tipoJuros: TipoJuros;
  taxaFixa: number;
  jurosIni: Date;
  jurosFim: Date;
}

export interface ResultadoCalculo {
  memoria: LinhaMemoria[];
  mesesFaltantes: Array<{ mes_ref: string; indice: string }>;
  fatorAcumulado: number;
  valorCorrigido: number;
  juros: number;
  criterios: string[];
  avisos: string[];
}

export function parseISO(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s || "")) return null;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return isNaN(dt.getTime()) ? null : dt;
}

export function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

function daysInMonth(d: Date): number {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
}

function listaMeses(ini: Date, fim: Date): Date[] {
  const out: Date[] = [];
  const cur = new Date(Date.UTC(ini.getUTCFullYear(), ini.getUTCMonth(), 1));
  const last = new Date(Date.UTC(fim.getUTCFullYear(), fim.getUTCMonth(), 1));
  while (cur <= last) {
    out.push(new Date(cur));
    cur.setUTCMonth(cur.getUTCMonth() + 1);
  }
  return out;
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const fmtData = (d: Date) =>
  `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;

/** Códigos de série que o cálculo precisa ler. */
export function codigosNecessarios(indice: Indice, regimeJuros: RegimeJuros): string[] {
  const s = new Set<string>(["ipca", "taxa_legal"]);
  if (indice !== "fixo") s.add(indice);
  if (regimeJuros === "legal_14905") s.add("selic_mensal");
  return [...s];
}

/** Dia do mês de `d` limitado ao mês `mes` (0 se antes, dim+1 se depois). */
function diaNoMes(d: Date, mes: Date, dim: number): number {
  const k = monthKey(d), m = monthKey(mes);
  if (k < m) return 0;
  if (k > m) return dim + 1;
  return d.getUTCDate();
}

export function calcular(p: Parametros, mapa: Map<string, number>): ResultadoCalculo {
  const { valor, dIni, dFim, indice: indiceEscolhido, proRata, manterIndiceContratual,
    regimeJuros, tipoJuros, taxaFixa, jurosIni, jurosFim } = p;

  const meses = listaMeses(dIni, dFim);
  const primeiroMes = monthKey(dIni);
  const ultimoMes = monthKey(dFim);
  const indicePosLei: Indice = manterIndiceContratual ? indiceEscolhido : "ipca";
  const legal = regimeJuros === "legal_14905";
  const cc2002 = parseISO(CC2002)!;
  const fimTema = parseISO(FIM_TEMA_1368)!;

  const memoria: LinhaMemoria[] = [];
  const mesesFaltantes: Array<{ mes_ref: string; indice: string }> = [];
  let fatorAcumulado = 1;
  let saldoCorrigido = valor;
  let saldoCapitalizado = valor;
  let jurosAcumulados = 0;

  // Datas efetivas de cada trecho, para a nota de critérios.
  let usouPre2003 = false;
  let usouSoIndice = false;
  let primeiroSelic: Date | null = null;
  let usouPos = false;

  for (const mes of meses) {
    const key = monthKey(mes);
    const dim = daysInMonth(mes);
    const ultimoDia = new Date(Date.UTC(mes.getUTCFullYear(), mes.getUTCMonth(), dim));

    const varSerie = (codigo: string): number => {
      if (codigo === "fixo") return 0;
      const v = mapa.get(`${codigo}|${key}`);
      if (v === undefined) {
        if (!mesesFaltantes.some((m) => m.mes_ref === key && m.indice === codigo)) {
          mesesFaltantes.push({ mes_ref: key, indice: codigo });
        }
        return 0;
      }
      return v;
    };

    const regimeMes: Regime = key === MES_TRANSICAO
      ? "transicao_14905"
      : key > MES_TRANSICAO ? "pos_14905" : "pre_14905";

    // Dias cobertos pela correção neste mês
    const inicioDia = proRata && key === primeiroMes ? dIni.getUTCDate() : 1;
    const fimDia = proRata && key === ultimoMes ? dFim.getUTCDate() : dim;
    const diasMes = Math.max(0, fimDia - inicioDia + 1);
    const proporcao = proRata ? diasMes / dim : 1;

    // Janela de juros no mês (sem pró-rata, o mês do termo inicial conta inteiro,
    // como a correção já faz).
    const jMesIni = new Date(Date.UTC(jurosIni.getUTCFullYear(), jurosIni.getUTCMonth(), 1));
    const jMesFim = new Date(Date.UTC(jurosFim.getUTCFullYear(), jurosFim.getUTCMonth(), 1));
    const dentroJurosMes = ultimoDia >= jMesIni && mes <= jMesFim;
    let jIniDia = proRata ? diaNoMes(jurosIni, mes, dim) : (dentroJurosMes ? 1 : dim + 1);
    let jFimDia = proRata ? diaNoMes(jurosFim, mes, dim) : (dentroJurosMes ? dim : 0);
    if (jIniDia === 0) jIniDia = 1;
    if (jFimDia === dim + 1) jFimDia = dim;

    // Classifica cada dia coberto
    const cc2002Dia = diaNoMes(cc2002, mes, dim); // dias >= este são CC/2002
    const fimTemaDia = diaNoMes(fimTema, mes, dim); // dias <= este são pré-lei
    let dSelic = 0, dIdxPre = 0, dPos = 0, dJurosPre2003 = 0, dJurosPos = 0;
    for (let dia = inicioDia; dia <= fimDia; dia++) {
      const juros = regimeJuros !== "nenhum" && dia >= jIniDia && dia <= jFimDia;
      const preLei = dia <= fimTemaDia;
      const posCC = dia >= cc2002Dia;
      if (!preLei) {
        dPos++;
        if (juros) dJurosPos++;
      } else if (legal && juros && posCC) {
        dSelic++;
      } else {
        dIdxPre++;
        if (juros && !posCC) dJurosPre2003++;
      }
    }

    // ── Correção (fator único do mês, por frações de dias) ──
    const partes: Array<{ cod: string; dias: number }> = [];
    if (dSelic) partes.push({ cod: "selic_mensal", dias: dSelic });
    if (dIdxPre) partes.push({ cod: indiceEscolhido, dias: dIdxPre });
    if (dPos) partes.push({ cod: indicePosLei, dias: dPos });

    const baseDias = proRata ? dim : diasMes || dim;
    let fatorMes = 1;
    for (const pt of partes) fatorMes += (varSerie(pt.cod) / 100) * (pt.dias / baseDias);
    const variacaoRegistrada = Number(((fatorMes - 1) * 100).toFixed(6));

    let indiceUtilizado: string;
    let regime: Regime = regimeMes;
    if (regimeMes === "transicao_14905") {
      const pecas: string[] = [];
      if (dSelic) pecas.push("selic (Tema 1.368, juros e correção)");
      if (dIdxPre) pecas.push(indiceEscolhido);
      const pre = pecas.length ? `${pecas.join(" + ")} (1 a 29/08)` : "";
      const pos = dPos ? `${indicePosLei} (30 e 31/08)` : "";
      indiceUtilizado = [pre, pos].filter(Boolean).join(" + ");
    } else if (regimeMes === "pos_14905") {
      indiceUtilizado = manterIndiceContratual
        ? `${indicePosLei} (índice contratual mantido, art. 389, § único, CC)`
        : indicePosLei;
    } else if (dSelic && !dIdxPre) {
      regime = "tema_1368";
      indiceUtilizado = "selic (Tema 1.368, juros e correção)";
    } else if (dSelic && dIdxPre) {
      regime = "tema_1368";
      indiceUtilizado = `${indiceEscolhido} (antes dos juros) + selic (Tema 1.368, juros e correção)`;
    } else {
      indiceUtilizado = indiceEscolhido;
    }

    if (dSelic && !primeiroSelic) {
      primeiroSelic = new Date(Date.UTC(mes.getUTCFullYear(), mes.getUTCMonth(),
        Math.max(inicioDia, jIniDia, Math.min(cc2002Dia, dim))));
    }
    if (dJurosPre2003) usouPre2003 = true;
    if (dIdxPre && !dJurosPre2003) usouSoIndice = true;
    if (dPos) usouPos = true;

    fatorAcumulado *= fatorMes;
    saldoCorrigido = valor * fatorAcumulado;

    // ── Juros de mora ──
    let taxaMes = 0;
    if (regimeJuros === "taxa_fixa") {
      if (dentroJurosMes) taxaMes = taxaFixa * proporcao;
    } else if (legal) {
      if (dJurosPre2003) taxaMes += 0.5 * (dJurosPre2003 / baseDias);
      // Art. 406, §3º: taxa legal negativa considera-se zero.
      if (dJurosPos) taxaMes += Math.max(0, varSerie("taxa_legal")) * (dJurosPos / baseDias);
    }

    if (tipoJuros === "compostos") saldoCapitalizado *= fatorMes;
    const baseJuros = tipoJuros === "compostos" ? saldoCapitalizado : saldoCorrigido;
    const jurosMes = baseJuros * (taxaMes / 100);
    jurosAcumulados += jurosMes;
    if (tipoJuros === "compostos") saldoCapitalizado += jurosMes;

    memoria.push({
      mes_ref: key,
      indice_utilizado: indiceUtilizado,
      variacao_percentual: variacaoRegistrada,
      fator_do_mes: Number(fatorMes.toFixed(10)),
      fator_acumulado: Number(fatorAcumulado.toFixed(10)),
      saldo_corrigido: r2(saldoCorrigido),
      juros_do_mes: r2(jurosMes),
      juros_acumulados: r2(jurosAcumulados),
      regime,
    });
  }

  const criterios: string[] = [];
  const avisos: string[] = [];
  if (legal) {
    if (usouPre2003) {
      criterios.push("Até 10/01/2003: juros de 6% a.a. (art. 1.062 do CC/1916) e correção pelo índice escolhido.");
    }
    if (usouSoIndice) {
      criterios.push("Antes do termo inicial dos juros: só correção pelo índice escolhido, sem Selic e sem juros.");
    }
    if (primeiroSelic) {
      criterios.push(
        `De ${fmtData(primeiroSelic)} a 29/08/2024: Selic (SGS 4390) como encargo único, nos termos do Tema 1.368 do STJ (REsp 2.199.164/PR). Neste trecho não se cumula índice de correção, e os juros do mês aparecem zerados porque já estão dentro da Selic aplicada ao saldo.`,
      );
    }
    if (usouPos) {
      criterios.push(
        `A partir de 30/08/2024: correção pelo ${manterIndiceContratual ? "índice contratual (opção marcada)" : "IPCA"} e juros pela Taxa Legal (SGS 29543), Lei 14.905/2024.`,
      );
    }
    criterios.push("Se a sentença ou o contrato já fixou outro critério, escolha taxa fixa e o índice do título.");
    if (jurosIni < dIni) {
      avisos.push(
        `Os juros começam em ${fmtData(jurosIni)}, antes da data inicial da correção (${fmtData(dIni)}). Esse intervalo não foi calculado: o Tema 1.368 não definiu a hipótese e o critério depende do título. Confira esse trecho à parte.`,
      );
    }
  }

  return {
    memoria,
    mesesFaltantes,
    fatorAcumulado,
    valorCorrigido: r2(saldoCorrigido),
    juros: r2(jurosAcumulados),
    criterios,
    avisos,
  };
}
