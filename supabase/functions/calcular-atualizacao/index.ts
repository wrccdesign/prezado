import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireUser } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-payment-env",
};

/** Lei 14.905/2024 — vigência a partir de 30/08/2024. */
const VIGENCIA_14905 = "2024-08-30";
/** Juros legais de 1% a.m. a partir da vigência do CC/2002. */
const CC2002 = "2003-01-11";

type Indice = "ipca" | "inpc" | "igpm" | "selic_mensal" | "fixo";
type RegimeJuros = "legal_14905" | "taxa_fixa" | "nenhum";

interface Body {
  valor: number;
  data_inicial: string;
  data_final: string;
  indice: Indice;
  pro_rata?: boolean;
  regime_juros?: RegimeJuros;
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
  regime: "pre_14905" | "pos_14905";
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

  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

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
  if (!["ipca", "inpc", "igpm", "selic_mensal", "fixo"].includes(indiceEscolhido)) {
    return bad("Índice inválido");
  }
  const proRata = body.pro_rata === true;
  const regimeJuros: RegimeJuros = body.regime_juros ?? "legal_14905";
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
  let saldo = valor;
  let jurosAcumulados = 0;

  for (const mes of meses) {
    const key = monthKey(mes);
    const ultimoDia = new Date(
      Date.UTC(mes.getUTCFullYear(), mes.getUTCMonth(), daysInMonth(mes)),
    );
    // Agosto/2024 (mês da vigência, em 30/08) permanece no regime anterior;
    // a partir de setembro/2024 aplica-se o regime da Lei 14.905/2024.
    const regime: "pre_14905" | "pos_14905" = key > "2024-08-01" ? "pos_14905" : "pre_14905";

    // ── Correção monetária ──
    const codigoCorrecao = regime === "pos_14905" ? "ipca" : indiceEscolhido;
    let variacao = 0;
    if (codigoCorrecao !== "fixo") {
      const v = mapa.get(`${codigoCorrecao}|${key}`);
      if (v === undefined) {
        mesesFaltantes.push({ mes_ref: key, indice: codigoCorrecao });
      } else {
        variacao = v;
      }
    }

    // Pro rata die nos meses parciais das pontas
    let proporcao = 1;
    if (proRata) {
      const dim = daysInMonth(mes);
      const inicioDia = key === primeiroMes ? dIni.getUTCDate() : 1;
      const fimDia = key === ultimoMes ? dFim.getUTCDate() : dim;
      proporcao = Math.max(0, (fimDia - inicioDia + 1)) / dim;
    }

    const fatorMes = 1 + (variacao / 100) * proporcao;
    fatorAcumulado *= fatorMes;
    saldo = valor * fatorAcumulado;

    // ── Juros de mora ──
    const dentroJuros = ultimoDia >= jurosIni &&
      new Date(Date.UTC(mes.getUTCFullYear(), mes.getUTCMonth(), 1)) <=
        new Date(Date.UTC(jurosFim.getUTCFullYear(), jurosFim.getUTCMonth(), 1));

    let taxaMes = 0;
    if (dentroJuros && regimeJuros !== "nenhum") {
      if (regimeJuros === "taxa_fixa") {
        taxaMes = taxaFixa;
      } else if (regime === "pos_14905") {
        // Art. 406, §1º, CC — Taxa Legal (SGS 29543); se negativa, considera-se zero (§3º)
        const tl = mapa.get(`taxa_legal|${key}`);
        if (tl === undefined) {
          mesesFaltantes.push({ mes_ref: key, indice: "taxa_legal" });
          taxaMes = 0;
        } else {
          taxaMes = Math.max(0, tl);
        }
      } else {
        // Regra prática: 1% a.m. a partir de 11/01/2003; 0,5% a.m. antes
        taxaMes = ultimoDia >= parseISO(CC2002)! ? 1 : 0.5;
      }
      taxaMes *= proporcao;
    }

    // Juros simples, sem capitalização, sobre o saldo corrigido do mês
    const jurosMes = saldo * (taxaMes / 100);
    jurosAcumulados += jurosMes;

    memoria.push({
      mes_ref: key,
      indice_utilizado: codigoCorrecao,
      variacao_percentual: variacao,
      fator_do_mes: Number(fatorMes.toFixed(10)),
      fator_acumulado: Number(fatorAcumulado.toFixed(10)),
      saldo_corrigido: r2(saldo),
      juros_do_mes: r2(jurosMes),
      juros_acumulados: r2(jurosAcumulados),
      regime,
    });
  }

  const valorCorrigido = r2(saldo);
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
      fonte: "Banco Central do Brasil — Sistema Gerenciador de Séries Temporais (SGS)",
      ultima_sincronizacao: syncRow?.sincronizado_em ?? null,
      base_legal:
        "Arts. 389 e 406 do Código Civil, com redação da Lei 14.905/2024 (vigência em 30/08/2024).",
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
