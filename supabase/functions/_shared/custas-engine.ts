/**
 * Motor puro de cálculo de custas processuais.
 *
 * Não depende de runtime (Deno/Node/browser): recebe as regras e as unidades
 * fiscais já carregadas do banco e devolve o valor devido com memória de
 * cálculo. É o mesmo código usado pela edge function `calcular-custas` e pelos
 * testes automatizados.
 *
 * Genérico por tribunal: nada de TJSP está codificado aqui — alíquotas, pisos,
 * tetos, guias e URLs vêm de `custas_regras`.
 */

export interface RegraCustas {
  tribunal: string;
  uf: string;
  tipo_ato: string;
  base_calculo: "valor_causa" | "valor_condenacao" | "valor_credito" | "fixo";
  aliquota: number | null;
  valor_fixo_qtd: number | null;
  unidade_fiscal: string;
  piso_qtd: number | null;
  teto_qtd: number | null;
  tipo_guia: string;
  codigo_receita: string | null;
  url_emissao: string | null;
  vigencia_inicio: string;
  vigencia_fim: string | null;
  fonte_normativa: string | null;
  observacoes: string | null;
}

export interface UnidadeFiscal {
  codigo: string;
  ano: number;
  valor: number;
  fonte_normativa: string | null;
  vigencia_inicio: string;
}

export interface CustasInput {
  tribunal: string;
  tipo_ato: string;
  valor_base: number;
  /** Data do ato processual (YYYY-MM-DD) — define a regra aplicável. */
  data_ato: string;
  /** Data prevista para o recolhimento (YYYY-MM-DD). Padrão: a data do ato. */
  data_recolhimento?: string;
  qtd_autores?: number;
  justica_gratuita?: boolean;
  parte_isenta?: boolean;
  natureza_isenta?: boolean;
  motivo_isencao?: string;
}

export interface LinhaMemoria {
  rotulo: string;
  detalhe: string;
  valor: number | null;
}

export interface CustasResultado {
  tribunal: string;
  tipo_ato: string;
  valor_base: number;
  valor_devido: number;
  isento: boolean;
  motivo_isencao: string | null;
  regra_aplicada: {
    base_calculo: string;
    aliquota: number | null;
    valor_fixo_qtd: number | null;
    vigencia_inicio: string;
    vigencia_fim: string | null;
    fonte_normativa: string | null;
    observacoes: string | null;
  };
  unidade_fiscal: {
    codigo: string;
    ano: number;
    valor: number;
    vigencia_inicio: string;
    fonte_normativa: string | null;
    referencia: string;
  };
  valor_bruto: number;
  piso_reais: number | null;
  teto_reais: number | null;
  piso_aplicado: boolean;
  teto_aplicado: boolean;
  acrescimo_litisconsorcio: number;
  qtd_autores: number;
  memoria: LinhaMemoria[];
  tipo_guia: string;
  codigo_receita: string | null;
  url_emissao: string | null;
  fonte_normativa: string | null;
  base_legal: string[];
  aviso_outras_guias: string[];
  aviso_emissao: string;
}

export class CustasError extends Error {}

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseData(s: string, campo = "data"): Date {
  if (!DATE_RE.test(s || "")) throw new CustasError(`Informe uma ${campo} válida (AAAA-MM-DD).`);
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (isNaN(dt.getTime())) throw new CustasError(`Informe uma ${campo} válida (AAAA-MM-DD).`);
  return dt;
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Primeiro dia do mês de uma data ISO. */
export function primeiroDiaDoMes(dataISO: string): string {
  const d = parseData(dataISO);
  return iso(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)));
}

/** Regra vigente na data do ato — não a mais recente. */
export function selecionarRegra(
  regras: RegraCustas[],
  tribunal: string,
  tipoAto: string,
  dataAto: string,
): RegraCustas {
  const alvo = parseData(dataAto, "data do ato");
  const candidatas = regras.filter(
    (r) =>
      r.tribunal === tribunal &&
      r.tipo_ato === tipoAto &&
      parseData(r.vigencia_inicio) <= alvo &&
      (!r.vigencia_fim || parseData(r.vigencia_fim) >= alvo),
  );
  if (candidatas.length === 0) {
    throw new CustasError(
      `Não há regra de custas cadastrada para ${tipoAto} no ${tribunal} na data ${dataAto}.`,
    );
  }
  candidatas.sort((a, b) => (a.vigencia_inicio < b.vigencia_inicio ? 1 : -1));
  return candidatas[0];
}

/**
 * Unidade fiscal vigente no PRIMEIRO DIA DO MÊS do recolhimento — regra
 * expressa do TJSP. Não é a do ajuizamento nem a do ano corrente.
 */
export function selecionarUnidadeFiscal(
  unidades: UnidadeFiscal[],
  codigo: string,
  dataRecolhimento: string,
): { unidade: UnidadeFiscal; referencia: string } {
  const referencia = primeiroDiaDoMes(dataRecolhimento);
  const alvo = parseData(referencia);
  const candidatas = unidades
    .filter((u) => u.codigo === codigo && parseData(u.vigencia_inicio) <= alvo)
    .sort((a, b) => (a.vigencia_inicio < b.vigencia_inicio ? 1 : -1));
  if (candidatas.length === 0) {
    throw new CustasError(
      `Valor da ${codigo} não cadastrado para a competência ${referencia} (exercício de ${
        referencia.slice(0, 4)
      }). Cadastre a ${codigo} desse exercício na tabela de unidades fiscais para calcular atos dessa data.`,
    );
  }

  return { unidade: candidatas[0], referencia };
}

const ISENCOES: Array<{ flag: keyof CustasInput; texto: string }> = [
  {
    flag: "justica_gratuita",
    texto:
      "Beneficiário da justiça gratuita — isento do recolhimento (art. 5º, LXXIV, da CF e art. 98 do CPC).",
  },
  {
    flag: "parte_isenta",
    texto:
      "Parte isenta por qualidade: União, Estado, Município, respectivas autarquias e fundações e o Ministério Público (art. 6º da Lei Estadual 11.608/2003).",
  },
  {
    flag: "natureza_isenta",
    texto:
      "Feito isento pela natureza: jurisdição de menores, acidentes do trabalho, alimentos cuja prestação mensal não seja superior a 2 salários mínimos e ações de competência dos Juizados Especiais, somente em 1ª instância (art. 6º da Lei Estadual 11.608/2003).",
  },
];

const AVISOS_OUTRAS_GUIAS = [
  "A DARE cobre apenas a taxa judiciária. Ela não abrange as demais despesas do processo.",
  "As despesas processuais (porte de remessa e retorno, diligências cartorárias e afins) são recolhidas em guia FEDTJ.",
  "As diligências do oficial de justiça são recolhidas em guia GRD, uma por ato de citação/intimação.",
];

const AVISO_EMISSAO =
  "A DARE emitida vence em 5 dias corridos contados da emissão, prorrogando-se para o primeiro dia útil seguinte quando o vencimento cair em dia não útil.";

export const RODAPE_LEGAL =
  "O Honorífico calcula e fundamenta o valor. A emissão e o pagamento da guia são feitos exclusivamente no portal oficial do tribunal, e o valor deve ser conferido no ato da emissão.";

export function calcularCustas(
  input: CustasInput,
  regras: RegraCustas[],
  unidades: UnidadeFiscal[],
): CustasResultado {
  const tribunal = (input.tribunal || "").trim().toUpperCase();
  const tipoAto = (input.tipo_ato || "").trim();
  if (!tribunal) throw new CustasError("Informe o tribunal.");
  if (!tipoAto) throw new CustasError("Informe o tipo de ato.");

  const dataAto = input.data_ato;
  parseData(dataAto, "data do ato");
  const dataRecolhimento = input.data_recolhimento || dataAto;
  parseData(dataRecolhimento, "data de recolhimento");

  const regra = selecionarRegra(regras, tribunal, tipoAto, dataAto);
  const { unidade, referencia } = selecionarUnidadeFiscal(
    unidades,
    regra.unidade_fiscal,
    dataRecolhimento,
  );

  const uf = unidade.valor;
  const qtdAutores = Math.max(1, Math.floor(input.qtd_autores || 1));

  const valorBase = Number(input.valor_base || 0);
  if (regra.base_calculo !== "fixo" && (!isFinite(valorBase) || valorBase <= 0)) {
    throw new CustasError("Informe um valor base maior que zero.");
  }

  const memoria: LinhaMemoria[] = [];
  const baseLegal: string[] = [];
  if (regra.fonte_normativa) baseLegal.push(regra.fonte_normativa);

  memoria.push({
    rotulo: "Regra aplicada",
    detalhe:
      `${descreverRegra(regra)} — vigência a partir de ${formatarData(regra.vigencia_inicio)}` +
      (regra.vigencia_fim ? ` até ${formatarData(regra.vigencia_fim)}` : "") +
      `. Selecionada pela data do ato (${formatarData(dataAto)}).`,
    valor: null,
  });

  memoria.push({
    rotulo: `${unidade.codigo} aplicada`,
    detalhe:
      `${unidade.codigo} ${unidade.ano} = ${moeda(uf)} — valor vigente no primeiro dia do mês do recolhimento (${formatarData(referencia)}).`,
    valor: uf,
  });

  // Isenções
  const isencao = ISENCOES.find((i) => input[i.flag] === true);
  if (isencao) {
    const motivo = input.motivo_isencao ? `${isencao.texto} Motivo informado: ${input.motivo_isencao}` : isencao.texto;
    memoria.push({ rotulo: "Isenção", detalhe: motivo, valor: null });
    memoria.push({ rotulo: "Valor devido", detalhe: "Isento de recolhimento.", valor: 0 });
    baseLegal.push("Art. 6º da Lei Estadual 11.608/2003; art. 98 do CPC; art. 5º, LXXIV, da CF.");
    return montar(input, tribunal, tipoAto, regra, unidade, referencia, {
      valorBase: regra.base_calculo === "fixo" ? 0 : valorBase,
      valorBruto: 0,
      pisoReais: null,
      tetoReais: null,
      pisoAplicado: false,
      tetoAplicado: false,
      acrescimo: 0,
      qtdAutores,
      valorDevido: 0,
      isento: true,
      motivoIsencao: motivo,
      memoria,
      baseLegal,
    });
  }

  // Cálculo bruto
  let valorBruto: number;
  if (regra.base_calculo === "fixo") {
    const qtd = Number(regra.valor_fixo_qtd || 0);
    valorBruto = r2(qtd * uf);
    memoria.push({
      rotulo: "Valor fixo",
      detalhe: `${formatarQtd(qtd)} ${unidade.codigo} × ${moeda(uf)}`,
      valor: valorBruto,
    });
  } else {
    const aliquota = Number(regra.aliquota || 0);
    valorBruto = r2((valorBase * aliquota) / 100);
    memoria.push({
      rotulo: "Base de cálculo",
      detalhe: `${rotuloBase(regra.base_calculo)}: ${moeda(valorBase)}`,
      valor: valorBase,
    });
    memoria.push({
      rotulo: "Alíquota aplicada",
      detalhe: `${formatarQtd(aliquota)}% sobre a base`,
      valor: valorBruto,
    });
  }

  // Piso e teto
  const pisoReais = regra.piso_qtd != null ? r2(Number(regra.piso_qtd) * uf) : null;
  const tetoReais = regra.teto_qtd != null ? r2(Number(regra.teto_qtd) * uf) : null;
  let valorDevido = valorBruto;
  let pisoAplicado = false;
  let tetoAplicado = false;

  if (pisoReais != null) {
    memoria.push({
      rotulo: "Piso legal",
      detalhe: `${formatarQtd(Number(regra.piso_qtd))} ${unidade.codigo} = ${moeda(pisoReais)}`,
      valor: pisoReais,
    });
    if (valorDevido < pisoReais) {
      valorDevido = pisoReais;
      pisoAplicado = true;
      memoria.push({
        rotulo: "Piso aplicado",
        detalhe: `O resultado do percentual (${moeda(valorBruto)}) é inferior ao piso legal. Prevalece o piso de ${moeda(pisoReais)}.`,
        valor: pisoReais,
      });
    }
  }

  if (tetoReais != null) {
    memoria.push({
      rotulo: "Teto legal",
      detalhe: `${formatarQtd(Number(regra.teto_qtd))} ${unidade.codigo} = ${moeda(tetoReais)}`,
      valor: tetoReais,
    });
    if (valorDevido > tetoReais) {
      valorDevido = tetoReais;
      tetoAplicado = true;
      memoria.push({
        rotulo: "Teto aplicado",
        detalhe: `O resultado do percentual (${moeda(valorBruto)}) excede o teto legal. Prevalece o teto de ${moeda(tetoReais)}.`,
        valor: tetoReais,
      });
    }
  }

  // Litisconsórcio ativo voluntário: +10 unidades por grupo de 10 autores
  // (ou fração) que exceder o primeiro grupo.
  // Litisconsórcio ativo voluntário: +10 unidades por grupo de 10 autores
  // (ou fração) que exceder o primeiro grupo.
  //
  // NOTA (pendência de conferência): a leitura literal da norma ("10 UFESPs para
  // cada grupo de 10 autores, ou fração que a exceder") admite entendimento de que
  // 15 autores gerariam DUAS parcelas (Math.ceil(qtd / 10)), e não uma. Mantemos a
  // fórmula conservadora (`Math.ceil(qtd / 10) - 1`, isto é, o primeiro grupo já
  // coberto pela taxa) porque não foi possível confirmar o comportamento no Portal
  // de Custas do TJSP: o simulador exige autenticação e não expõe cálculo público.
  // Só alterar após conferência no portal, registrando a fonte em
  // `custas_regras.observacoes`.
  let acrescimo = 0;
  if (qtdAutores > 10) {
    const gruposExcedentes = Math.ceil(qtdAutores / 10) - 1;
    acrescimo = r2(gruposExcedentes * 10 * uf);
    memoria.push({

      rotulo: "Litisconsórcio ativo voluntário",
      detalhe: `${qtdAutores} autores — ${gruposExcedentes} grupo(s) de 10 (ou fração) excedente(s) × 10 ${unidade.codigo} = ${moeda(acrescimo)}`,
      valor: acrescimo,
    });
    valorDevido = r2(valorDevido + acrescimo);
  }

  memoria.push({
    rotulo: "Valor devido",
    detalhe: `Taxa judiciária a recolher em guia ${regra.tipo_guia}${regra.codigo_receita ? ` (código de receita ${regra.codigo_receita})` : ""}.`,
    valor: valorDevido,
  });

  return montar(input, tribunal, tipoAto, regra, unidade, referencia, {
    valorBase: regra.base_calculo === "fixo" ? 0 : valorBase,
    valorBruto,
    pisoReais,
    tetoReais,
    pisoAplicado,
    tetoAplicado,
    acrescimo,
    qtdAutores,
    valorDevido,
    isento: false,
    motivoIsencao: null,
    memoria,
    baseLegal,
  });
}

interface Parciais {
  valorBase: number;
  valorBruto: number;
  pisoReais: number | null;
  tetoReais: number | null;
  pisoAplicado: boolean;
  tetoAplicado: boolean;
  acrescimo: number;
  qtdAutores: number;
  valorDevido: number;
  isento: boolean;
  motivoIsencao: string | null;
  memoria: LinhaMemoria[];
  baseLegal: string[];
}

function montar(
  _input: CustasInput,
  tribunal: string,
  tipoAto: string,
  regra: RegraCustas,
  unidade: UnidadeFiscal,
  referencia: string,
  p: Parciais,
): CustasResultado {
  return {
    tribunal,
    tipo_ato: tipoAto,
    valor_base: p.valorBase,
    valor_devido: p.valorDevido,
    isento: p.isento,
    motivo_isencao: p.motivoIsencao,
    regra_aplicada: {
      base_calculo: regra.base_calculo,
      aliquota: regra.aliquota != null ? Number(regra.aliquota) : null,
      valor_fixo_qtd: regra.valor_fixo_qtd != null ? Number(regra.valor_fixo_qtd) : null,
      vigencia_inicio: regra.vigencia_inicio,
      vigencia_fim: regra.vigencia_fim,
      fonte_normativa: regra.fonte_normativa,
      observacoes: regra.observacoes,
    },
    unidade_fiscal: {
      codigo: unidade.codigo,
      ano: unidade.ano,
      valor: Number(unidade.valor),
      vigencia_inicio: unidade.vigencia_inicio,
      fonte_normativa: unidade.fonte_normativa,
      referencia,
    },
    valor_bruto: p.valorBruto,
    piso_reais: p.pisoReais,
    teto_reais: p.tetoReais,
    piso_aplicado: p.pisoAplicado,
    teto_aplicado: p.tetoAplicado,
    acrescimo_litisconsorcio: p.acrescimo,
    qtd_autores: p.qtdAutores,
    memoria: p.memoria,
    tipo_guia: regra.tipo_guia,
    codigo_receita: regra.codigo_receita,
    url_emissao: regra.url_emissao,
    fonte_normativa: regra.fonte_normativa,
    base_legal: p.baseLegal,
    aviso_outras_guias: AVISOS_OUTRAS_GUIAS,
    aviso_emissao: AVISO_EMISSAO,
  };
}

function descreverRegra(r: RegraCustas): string {
  if (r.base_calculo === "fixo") {
    return `valor fixo de ${formatarQtd(Number(r.valor_fixo_qtd || 0))} ${r.unidade_fiscal}`;
  }
  return `${formatarQtd(Number(r.aliquota || 0))}% sobre o ${rotuloBase(r.base_calculo).toLowerCase()}`;
}

export function rotuloBase(base: string): string {
  switch (base) {
    case "valor_causa":
      return "Valor da causa";
    case "valor_condenacao":
      return "Valor da condenação (ou da causa atualizado)";
    case "valor_credito":
      return "Valor do crédito a satisfazer";
    default:
      return "Valor fixo";
  }
}

function formatarQtd(n: number): string {
  return String(Number(n)).replace(".", ",");
}

function formatarData(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function moeda(n: number): string {
  const [inteiro, frac] = n.toFixed(2).split(".");
  return `R$ ${inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${frac}`;
}
