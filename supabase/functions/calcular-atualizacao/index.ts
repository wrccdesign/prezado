import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireQuotaOrGuest } from "../_shared/calculo-guard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-payment-env, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

import {
  calcular,
  codigosNecessarios,
  INDICES_VALIDOS,
  type Indice,
  monthKey,
  parseISO,
  type RegimeJuros,
  type TipoJuros,
} from "./calculo.ts";

interface Body {
  valor: number;
  data_inicial: string;
  data_final: string;
  indice: Indice;
  pro_rata?: boolean;
  /** Art. 389, parágrafo único, do CC: mantém o índice escolhido após 30/08/2024. */
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

function bad(msg: string, status = 400) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
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

  const primeiroMes = monthKey(dIni);
  const ultimoMes = monthKey(dFim);
  // IPCA cheio (SGS 433) corrige; Taxa Legal (SGS 29543) são os juros pós-lei;
  // Selic mensal (SGS 4390) é o encargo único do Tema 1.368 até 29/08/2024.
  const codigos = codigosNecessarios(indiceEscolhido, regimeJuros);

  const { data: idxRows, error: idxErr } = await supabase
    .from("indices_economicos")
    .select("codigo_indice, data_ref, valor_percentual")
    .in("codigo_indice", codigos)
    .gte("data_ref", primeiroMes)
    .lte("data_ref", ultimoMes);

  if (idxErr) {
    console.error("calcular-atualizacao: falha ao ler índices", idxErr);
    return bad("Não foi possível consultar os índices agora. Tente de novo em instantes.", 500);
  }

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

  const calc = calcular({
    valor, dIni, dFim, indice: indiceEscolhido, proRata, manterIndiceContratual,
    regimeJuros, tipoJuros, taxaFixa, jurosIni, jurosFim,
  }, mapa);
  const memoria = calc.memoria;
  const mesesFaltantes = calc.mesesFaltantes;
  const fatorAcumulado = calc.fatorAcumulado;
  const valorCorrigido = calc.valorCorrigido;
  const juros = calc.juros;

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
      fonte: "Banco Central do Brasil, Sistema Gerenciador de Séries Temporais (SGS)",
      ultima_sincronizacao: syncRow?.sincronizado_em ?? null,
      criterios: calc.criterios,
      avisos: calc.avisos,
      base_legal: [
        ...(regimeJuros === "legal_14905" ? calc.criterios : []),
        ...calc.avisos,
        `Arts. 389 e 406 do Código Civil, com redação da Lei 14.905/2024 (vigência em 30/08/2024).`,
        "Res. CMN 5.171/2024: a taxa legal aplicável aos dias 30 e 31/08/2024 é a divulgada para agosto/2024; agosto/2024 é calculado pro rata die como mês de transição.",
        manterIndiceContratual
          ? "Art. 389, parágrafo único, do CC (norma supletiva): mantido o índice contratual/específico também após a vigência da Lei 14.905/2024."
          : "Art. 389, parágrafo único, do CC: correção pelo IPCA a partir da vigência da Lei 14.905/2024, na falta de disposição em contrário.",
      ],

    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
