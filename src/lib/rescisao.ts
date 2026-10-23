export type TipoDemissao = "sem_justa_causa" | "com_justa_causa" | "pedido_demissao" | "acordo_mutuo";

export interface VerbaRescisao {
  label: string;
  valor: number;
  formula: string;
}

export interface ResultadoRescisao {
  verbas: VerbaRescisao[];
  fgts: VerbaRescisao[];
  totalBruto: number;
  totalFgts: number;
  diasAviso: number;
  dataProjetada: Date;
  periodosAquisitivosCompletos: number;
  saldoFgtsEstimado: boolean;
}

export interface EntradaRescisao {
  remuneracao: number;
  admissao: Date;
  demissao: Date;
  tipo: TipoDemissao;
  /** Saldo do FGTS informado; null quando o usuário não informou (estimado). */
  saldoFgts: number | null;
  periodosVencidosNaoGozados: number;
}

const r2 = (v: number) => Math.round(v * 100) / 100;
const fmtData = (d: Date) =>
  `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

function addDias(d: Date, dias: number) {
  const n = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  n.setDate(n.getDate() + dias);
  return n;
}

function addMeses(d: Date, meses: number) {
  return new Date(d.getFullYear(), d.getMonth() + meses, d.getDate());
}

function diasEntre(a: Date, b: Date) {
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((ub - ua) / 86400000);
}

/** Anos completos de serviço entre admissão e a data. */
export function anosCompletos(admissao: Date, ate: Date) {
  let anos = ate.getFullYear() - admissao.getFullYear();
  if (addMeses(admissao, anos * 12) > ate) anos -= 1;
  return Math.max(0, anos);
}

/** Avos a partir de um marco: cada mês completo conta 1; fração final de 15 dias ou mais conta 1 (art. 146, parágrafo único, CLT). */
export function avosDesde(inicio: Date, fim: Date) {
  let meses = 0;
  while (addMeses(inicio, meses + 1) <= addDias(fim, 1)) meses += 1;
  const resto = diasEntre(addMeses(inicio, meses), fim) + 1;
  return Math.min(12, meses + (resto >= 15 ? 1 : 0));
}

/**
 * Avos do 13º (Lei 4.090/1962, art. 1º, §2º): mês com 15 dias ou mais conta.
 * Conta desde o ano de `desdeAno` (ano da demissão) até a data projetada, para que
 * a projeção do aviso para o ano seguinte não apague os avos do ano da demissão.
 */
export function avos13(admissao: Date, fim: Date, desdeAno: number = fim.getFullYear()) {
  let avos = 0;
  for (let ano = desdeAno; ano <= fim.getFullYear(); ano++) {
    const ultimoMes = ano === fim.getFullYear() ? fim.getMonth() : 11;
    for (let m = 0; m <= ultimoMes; m++) {
      const ini = new Date(ano, m, 1);
      const fimMes = new Date(ano, m + 1, 0);
      const a = admissao > ini ? admissao : ini;
      const b = fim < fimMes ? fim : fimMes;
      if (b < a) continue;
      if (diasEntre(a, b) + 1 >= 15) avos += 1;
    }
  }
  return avos;
}

export function calcularRescisao(e: EntradaRescisao): ResultadoRescisao {
  const { remuneracao: rem, admissao, demissao, tipo } = e;
  const anos = anosCompletos(admissao, demissao);
  const temAvisoIndenizado = tipo === "sem_justa_causa" || tipo === "acordo_mutuo";
  const diasAviso = temAvisoIndenizado ? Math.min(30 + anos * 3, 90) : 0;
  // Art. 487, §1º, da CLT: o aviso indenizado integra o tempo de serviço.
  const dataProjetada = temAvisoIndenizado ? addDias(demissao, diasAviso) : demissao;
  const justa = tipo === "com_justa_causa";

  const diasMes = demissao.getDate();
  const saldoSalario = r2((rem / 30) * diasMes);

  const avisoBase = (rem / 30) * diasAviso;
  const avisoPrevio = r2(tipo === "acordo_mutuo" ? avisoBase / 2 : avisoBase);

  const n13 = justa ? 0 : avos13(admissao, dataProjetada, demissao.getFullYear());
  const decimo = r2((rem / 12) * n13);

  const periodos = anosCompletos(admissao, dataProjetada);
  const ultimoAniversario = addMeses(admissao, periodos * 12);
  const nFerias = justa ? 0 : avosDesde(ultimoAniversario, addDias(dataProjetada, -1));
  const feriasProp = r2((rem / 12) * nFerias);
  const tercoProp = r2(feriasProp / 3);

  const nVencidas = Math.max(0, Math.min(e.periodosVencidosNaoGozados, periodos));
  const feriasVenc = r2(rem * nVencidas);
  const tercoVenc = r2(feriasVenc / 3);

  const verbas: VerbaRescisao[] = [
    { label: "Saldo de salário", valor: saldoSalario, formula: `${fmtN(rem)} / 30 x ${diasMes} dias` },
  ];
  if (temAvisoIndenizado)
    verbas.push({
      label: "Aviso prévio indenizado",
      valor: avisoPrevio,
      formula: `${fmtN(rem)} / 30 x ${diasAviso} dias (30 + 3 por ano completo, Lei 12.506/2011)${tipo === "acordo_mutuo" ? ", pela metade (art. 484-A)" : ""}`,
    });
  if (!justa) {
    verbas.push({ label: "13º salário proporcional", valor: decimo, formula: `${fmtN(rem)} / 12 x ${n13}/12, com projeção do aviso até ${fmtData(dataProjetada)}` });
    verbas.push({ label: "Férias proporcionais", valor: feriasProp, formula: `${fmtN(rem)} / 12 x ${nFerias}/12, período aquisitivo desde ${fmtData(ultimoAniversario)}, com projeção do aviso (art. 487, § 1º, CLT)` });
    verbas.push({ label: "1/3 de férias proporcionais", valor: tercoProp, formula: "férias proporcionais / 3 (art. 7º, XVII, CF)" });
  }
  if (nVencidas > 0) {
    verbas.push({ label: "Férias vencidas", valor: feriasVenc, formula: `${fmtN(rem)} x ${nVencidas} período(s) não gozado(s)` });
    verbas.push({ label: "1/3 de férias vencidas", valor: tercoVenc, formula: "férias vencidas / 3" });
  }

  const baseFgtsRescisao = saldoSalario + avisoPrevio + decimo;
  const fgtsRescisao = r2(baseFgtsRescisao * 0.08);
  const mesesAnteriores = Math.max(0, (demissao.getFullYear() - admissao.getFullYear()) * 12 + demissao.getMonth() - admissao.getMonth());
  const saldoEstimado = e.saldoFgts === null;
  const saldo = saldoEstimado ? r2(rem * 0.08 * mesesAnteriores) : e.saldoFgts!;
  const pctMulta = tipo === "sem_justa_causa" ? 0.4 : tipo === "acordo_mutuo" ? 0.2 : 0;
  const multa = r2((saldo + fgtsRescisao) * pctMulta);

  const fgts: VerbaRescisao[] = [
    { label: "FGTS sobre verbas rescisórias", valor: fgtsRescisao, formula: "8% x (saldo de salário + aviso prévio + 13º)" },
  ];
  if (pctMulta > 0)
    fgts.push({
      label: `Multa de ${pctMulta * 100}% do FGTS`,
      valor: multa,
      formula: `${pctMulta * 100}% x (saldo do FGTS ${fmtN(saldo)}${saldoEstimado ? `, estimado em 8% x ${fmtN(rem)} x ${mesesAnteriores} meses` : ""} + FGTS rescisório)`,
    });

  return {
    verbas,
    fgts,
    totalBruto: r2(verbas.reduce((a, b) => a + b.valor, 0)),
    totalFgts: r2(fgts.reduce((a, b) => a + b.valor, 0)),
    diasAviso,
    dataProjetada,
    periodosAquisitivosCompletos: anosCompletos(admissao, demissao),
    saldoFgtsEstimado: saldoEstimado && pctMulta > 0,
  };
}

function fmtN(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
