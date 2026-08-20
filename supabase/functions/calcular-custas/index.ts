import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireQuotaOrGuest } from "../_shared/calculo-guard.ts";
import {
  calcularCustas,
  CustasError,
  RODAPE_LEGAL,
  type CustasInput,
  type RegraCustas,
  type UnidadeFiscal,
} from "../_shared/custas-engine.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-payment-env, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function bad(msg: string, status = 400) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const quota = await requireQuotaOrGuest(req, "calculo", corsHeaders);
  if (quota instanceof Response) return quota;

  let body: CustasInput;
  try {
    body = await req.json();
  } catch {
    return bad("Corpo da requisição inválido");
  }

  const tribunal = (body.tribunal || "TJSP").toUpperCase();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: regras, error: erroRegras } = await supabase
    .from("custas_regras")
    .select("*")
    .eq("tribunal", tribunal);

  if (erroRegras) {
    console.error("erro ao carregar custas_regras", erroRegras);
    return bad("Não foi possível carregar as regras de custas.", 500);
  }

  const { data: unidades, error: erroUnidades } = await supabase
    .from("unidades_fiscais")
    .select("*");

  if (erroUnidades) {
    console.error("erro ao carregar unidades_fiscais", erroUnidades);
    return bad("Não foi possível carregar as unidades fiscais.", 500);
  }

  try {
    const resultado = calcularCustas(
      { ...body, tribunal },
      (regras ?? []) as unknown as RegraCustas[],
      (unidades ?? []) as unknown as UnidadeFiscal[],
    );

    return new Response(
      JSON.stringify({ ...resultado, rodape_legal: RODAPE_LEGAL }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    if (e instanceof CustasError) return bad(e.message);
    console.error("erro no cálculo de custas", e);
    return bad("Não foi possível concluir o cálculo.", 500);
  }
});
