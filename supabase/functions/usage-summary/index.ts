import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  PLAN_LIMITS,
  UNLIMITED,
  UNMETERED_ACTIONS,
  extractEnv,
  saoPauloMonthEnd,
  saoPauloMonthStart,
} from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-payment-env, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ACTION_LABELS: Record<string, string> = {
  search: "Buscas de jurisprudência",
  chat: "Chat jurídico",
  diagnostico: "Diagnósticos",
  diagnostico_completo_free: "Diagnósticos completos (prévia)",
  peticao: "Petições",
  analise: "Análises de documentos",
  documento: "Leituras/OCR de documentos",
  calculo: "Cálculos jurídicos",
};


function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Não autenticado" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const token = authHeader.slice("Bearer ".length);
    const { data: { user }, error: userError } = await admin.auth.getUser(token);
    if (userError || !user) return json({ error: "Não autenticado" }, 401);

    const env = extractEnv(req);
    const { data: planData } = await admin.rpc("get_user_plan", {
      p_user_id: user.id,
      p_env: env,
    });
    const plan = (planData as string) || "free";
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

    // Mês de uso em America/Sao_Paulo, igual ao checkRateLimit.
    const { data: rows } = await admin
      .from("usage_tracking")
      .select("action")
      .eq("user_id", user.id)
      .gte("created_at", saoPauloMonthStart().toISOString())
      .lt("created_at", saoPauloMonthEnd().toISOString());

    const counts: Record<string, number> = {};
    for (const row of rows ?? []) {
      const action = (row as { action: string }).action;
      counts[action] = (counts[action] ?? 0) + 1;
    }

    const periodStart = saoPauloMonthStart();
    const renews = saoPauloMonthEnd();


    return json({
      plan,
      environment: env,
      period_start: periodStart.toISOString(),
      renews_at: renews.toISOString(),
      resets_at: renews.toISOString(),
      // `diagnostico_completo_free` é o teaser interno do paywall, não é um
      // benefício anunciado — fica fora do painel de uso.
      actions: [
        ...Object.keys(limits)
          .filter((action) => action !== "diagnostico_completo_free")
          .map((action) => ({
            action,
            label: ACTION_LABELS[action] ?? action,
            used: Math.min(counts[action] ?? 0, limits[action]),
            limit: limits[action],
          })),
        // Ações sem cota mensal aparecem como ilimitadas (limit = -1).
        ...[...UNMETERED_ACTIONS].map((action) => ({
          action,
          label: ACTION_LABELS[action] ?? action,
          used: counts[action] ?? 0,
          limit: UNLIMITED,
        })),
      ],

    });
  } catch (e) {
    console.error("usage-summary error:", e);
    return json({ error: e instanceof Error ? e.message : "Erro desconhecido" }, 500);
  }
});
