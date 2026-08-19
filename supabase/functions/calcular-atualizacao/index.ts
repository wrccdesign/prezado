import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireQuotaOrGuest } from "../_shared/calculo-guard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-payment-env, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Lei 14.905/2024 — vigência a partir de 30/08/2024. */
const VIGENCIA_14905 = "2024-08-30";
/** Mês de transição: regime antigo até 29/08/2024, novo regime em 30 e 31/08/2024. */
const MES_TRANSICAO = "2024-08-01";
/** Juros legais de 1% a.m. a partir da vigência do CC/2002. */
const CC2002 = "2003-01-11";


const INDICES_VALIDOS = [
  "ipca",
  "ipca_e",
  "inpc",
  "igpm",
  "selic_mensal",
  "tr",
  "poupanca",
  "fixo",
] as const;

type Indice = typeof INDICES_VALIDOS[number];
type RegimeJuros = "legal_14905" | "taxa_fixa" | "nenhum";
type TipoJuros = "simples" | "compostos";
type Regime = "pre_14905" | "transicao_14905" | "pos_14905";

interface Body {
  valor: number;
  data_inicial: string;
  data_final: string;
  indice: Indice;
  pro_rata?: boolean;
  /**
   * Art. 389, parágrafo único, do CC é supletivo ("salvo disposição em
   * contrário"): quando true, o índice escolhido continua a ser aplicado
   * também após 30/08/2024, em vez de ser substituído pelo IPCA.
   */
  manter_indice_contratual?: boolean;
  regime_juros?: RegimeJuros;
  tipo_juros?: TipoJuros;
  taxa_juros_mensal?: number;
  juros_data_inicial?: string | null;
  juros_data_final?: string | null;
  multa_percentual?: number;
  multa_incide_sobre_juros?: boolean;
  honorarios_percentual?: number;
}


interface LinhaMemoria {
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


function bad(msg: string, status = 400) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function parseISO(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s || "")) return null;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return isNaN(dt.getTime()) ? null : dt;
}

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

function daysInMonth(d: Date): number {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
}

/** Lista de meses (1º dia) entre duas datas, inclusive. */
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const quota = await requireQuotaOrGuest(req, "calculo", corsHeaders);
  if (quota instanceof Response) return quota;

  let body: Body;

  try {
    body = await req.json();
  } catch {
    return bad("Corpo da requisição inválido");
  }

  const valor = Number(body.valor);
  if (!Number.isFinite(valor) || valor <= 0) return bad("Informe um valor positivo");

  const dIni = parseISO(body.data_inicial);
  const dFim = parseISO(body.data_final);
  if (!dIni || !dFim) return bad("Datas inválidas (use AAAA-MM-DD)");
  if (dFim < dIni) return bad("A data final deve ser posterior à data inicial");

  const indiceEscolhido: Indice = body.indice ?? "ipca";
  if (!INDICES_VALIDOS.includes(indiceEscolhido)) {
    return bad("Índice inválido");
  }
  const proRata = body.pro_rata === true;
  const manterIndiceContratual = body.manter_indice_contratual === true;

  const regimeJuros: RegimeJuros = body.regime_juros ?? "legal_14905";
  const tipoJuros: TipoJuros = body.tipo_juros ?? "simples";
  const taxaFixa = Number(body.taxa_juros_mensal ?? 0);
  const jurosIni = body.juros_data_inicial ? parseISO(body.juros_data_inicial) : dIni;
  const jurosFim = body.juros_data_final ? parseISO(body.juros_data_final) : dFim;
  if (!jurosIni || !jurosFim) return bad("Datas de juros inválidas");


  const multaPerc = Number(body.multa_percentual ?? 0);
  const multaSobreJuros = body.multa_incide_sobre_juros === true;
  const honorariosPerc = Number(body.honorarios_percentual ?? 0);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const meses = listaMeses(dIni, dFim);
  const primeiroMes = monthKey(dIni);
  const ultimoMes = monthKey(dFim);

  // Séries necessárias: índice escolhido (pré-lei), IPCA (pós-lei) e Taxa Legal (juros pós-lei).
  // A Taxa Legal (SGS 29543) é apurada com IPCA-15 do mês anterior (Res. CMN 5.171/2024);
  // o IPCA cheio (SGS 433) é usado para a correção do art. 389 do CC. São séries distintas
  // e uma NUNCA substitui ou deriva a outra.
  const codigos = new Set<string>(["ipca", "taxa_legal"]);
  if (indiceEscolhido !== "fixo") codigos.add(indiceEscolhido);

  const { data: idxRows, error: idxErr } = await supabase
    .from("indices_economicos")
    .select("codigo_indice, data_ref, valor_percentual")
    .in("codigo_indice", [...codigos])
    .gte("data_ref", primeiroMes)
    .lte("data_ref", ultimoMes);

  if (idxErr) return bad(`Falha ao ler índices: ${idxErr.message}`, 500);

  const mapa = new Map<string, number>();
  for (const r of idxRows ?? []) {
    mapa.set(`${r.codigo_indice}|${String(r.data_ref).slice(0, 10)}`, Number(r.valor_percentual));
  }

  const { data: syncRow } = await supabase
    .from("indices_economicos")
    .select("sincronizado_em")
    .order("sincronizado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  const memoria: LinhaMemoria[] = [];
  const mesesFaltantes: Array<{ mes_ref: string; indice: string }> = [];

  let fatorAcumulado = 1;
  let saldoCorrigido = valor;
  let saldoCapitalizado = valor;
  let jurosAcumulados = 0;

  /** Índice que passa a valer na correção após a Lei 14.905/2024. */
  const indicePosLei: Indice = manterIndiceContratual ? indiceEscolhido : "ipca";

  for (const mes of meses) {
    const key = monthKey(mes);
    const dim = daysInMonth(mes);
    const ultimoDia = new Date(Date.UTC(mes.getUTCFullYear(), mes.getUTCMonth(), dim));

    const varIndice = (codigo: Indice): number => {
      if (codigo === "fixo") return 0;
      const v = mapa.get(`${codigo}|${key}`);
      if (v === undefined) {
        mesesFaltantes.push({ mes_ref: key, indice: codigo });
        return 0;
      }
      return v;
    };
    const varTaxaLegal = (): number => {
      const tl = mapa.get(`taxa_legal|${key}`);
      if (tl === undefined) {
        mesesFaltantes.push({ mes_ref: key, indice: "taxa_legal" });
        return 0;
      }
      // Art. 406, §3º, CC — taxa legal negativa considera-se zero.
      return Math.max(0, tl);
    };

    // Agosto/2024 é mês de TRANSIÇÃO: a Lei 14.905/2024 entrou em vigor em
    // 30/08/2024 e a Res. CMN 5.171/2024 determina que a taxa legal aplicável
    // aos dias 30 e 31/08/2024 é a divulgada para agosto/2024. Logo, o mês é
    // rateado pro rata die: regime anterior até 29/08 e novo regime em 30–31/08.
    const isTransicao = key === MES_TRANSICAO;
    const regime: Regime = isTransicao
      ? "transicao_14905"
      : key > MES_TRANSICAO
      ? "pos_14905"
      : "pre_14905";

    // Pro rata die nos meses parciais das pontas
    const inicioDia = proRata && key === primeiroMes ? dIni.getUTCDate() : 1;
    const fimDia = proRata && key === ultimoMes ? dFim.getUTCDate() : dim;
    const proporcao = proRata ? Math.max(0, fimDia - inicioDia + 1) / dim : 1;

    // Frações do mês de transição (dias 1–29 x dias 30–31)
    const diasPre = Math.max(0, Math.min(fimDia, 29) - inicioDia + 1);
    const diasPos = Math.max(0, fimDia - Math.max(inicioDia, 30) + 1);
    const propPre = diasPre / dim;
    const propPos = diasPos / dim;

    // ── Correção monetária ──
    let fatorMes: number;
    let variacaoRegistrada: number;
    let indiceUtilizado: string;

    if (isTransicao) {
      const varPre = varIndice(indiceEscolhido);
      const varPos = varIndice(indicePosLei);
      fatorMes = 1 + (varPre / 100) * propPre + (varPos / 100) * propPos;
      variacaoRegistrada = Number(((fatorMes - 1) * 100).toFixed(6));
      indiceUtilizado = indiceEscolhido === indicePosLei
        ? `${indiceEscolhido} (mês de transição da Lei 14.905/2024)`
        : `${indiceEscolhido} (1–29/08) + ${indicePosLei} (30–31/08)`;
    } else {
      const codigoCorrecao = regime === "pos_14905" ? indicePosLei : indiceEscolhido;
      variacaoRegistrada = varIndice(codigoCorrecao);
      fatorMes = 1 + (variacaoRegistrada / 100) * proporcao;
      indiceUtilizado = regime === "pos_14905" && manterIndiceContratual
        ? `${codigoCorrecao} (índice contratual mantido — art. 389, § único, CC)`
        : codigoCorrecao;
    }

    fatorAcumulado *= fatorMes;
    saldoCorrigido = valor * fatorAcumulado;

    // ── Juros de mora ──
    const dentroJuros = ultimoDia >= jurosIni &&
      new Date(Date.UTC(mes.getUTCFullYear(), mes.getUTCMonth(), 1)) <=
        new Date(Date.UTC(jurosFim.getUTCFullYear(), jurosFim.getUTCMonth(), 1));

    let taxaMes = 0;
    if (dentroJuros && regimeJuros !== "nenhum") {
      if (regimeJuros === "taxa_fixa") {
        taxaMes = taxaFixa * proporcao;
      } else if (regime === "pos_14905") {
        // Art. 406, §1º, CC — Taxa Legal (SGS 29543)
        taxaMes = varTaxaLegal() * proporcao;
      } else if (regime === "transicao_14905") {
        // 1% a.m. até 29/08/2024 + Taxa Legal de agosto/2024 nos dias 30 e 31.
        taxaMes = 1 * propPre + varTaxaLegal() * propPos;
      } else {
        // Regra prática: 1% a.m. a partir de 11/01/2003; 0,5% a.m. antes
        taxaMes = (ultimoDia >= parseISO(CC2002)! ? 1 : 0.5) * proporcao;
      }
    }

    // Aplica correção também sobre o saldo capitalizado para juros compostos
    if (tipoJuros === "compostos") {
      saldoCapitalizado *= fatorMes;
    }

    // Juros simples sobre saldo corrigido; juros compostos sobre saldo capitalizado
    const baseJuros = tipoJuros === "compostos" ? saldoCapitalizado : saldoCorrigido;
    const jurosMes = baseJuros * (taxaMes / 100);
    jurosAcumulados += jurosMes;

    if (tipoJuros === "compostos") {
      saldoCapitalizado += jurosMes;
    }

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



  const valorCorrigido = r2(saldoCorrigido);
  const juros = r2(jurosAcumulados);

  const baseMulta = multaSobreJuros ? valorCorrigido + juros : valorCorrigido;
  const multa = r2(baseMulta * (multaPerc / 100));
  const subtotal = valorCorrigido + juros + multa;
  const honorarios = r2(subtotal * (honorariosPerc / 100));
  const total = r2(subtotal + honorarios);

  return new Response(
    JSON.stringify({
      valor_original: r2(valor),
      valor_corrigido: valorCorrigido,
      juros,
      multa,
      honorarios,
      total,
      fator_acumulado: Number(fatorAcumulado.toFixed(10)),
      memoria,
      meses_faltantes: mesesFaltantes,
      manter_indice_contratual: manterIndiceContratual,
      fonte: "Banco Central do Brasil — Sistema Gerenciador de Séries Temporais (SGS)",
      ultima_sincronizacao: syncRow?.sincronizado_em ?? null,
      base_legal: [
        `Arts. 389 e 406 do Código Civil, com redação da Lei 14.905/2024 (vigência em ${VIGENCIA_14905}).`,
        "Res. CMN 5.171/2024 — a taxa legal aplicável aos dias 30 e 31/08/2024 é a divulgada para agosto/2024; agosto/2024 é calculado pro rata die como mês de transição.",
        manterIndiceContratual
          ? "Art. 389, parágrafo único, do CC (norma supletiva): mantido o índice contratual/específico também após a vigência da Lei 14.905/2024."
          : "Art. 389, parágrafo único, do CC: correção pelo IPCA a partir da vigência da Lei 14.905/2024, na falta de disposição em contrário.",
      ],

    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
