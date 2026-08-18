import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  PLAN_LIMITS,
  extractEnv,
  saoPauloDayEnd,
  saoPauloDayStart,
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

    const today = new Date().toISOString().split("T")[0];
    const { data: rows } = await admin
      .from("usage_tracking")
      .select("action")
      .eq("user_id", user.id)
      .gte("created_at", `${today}T00:00:00.000Z`);

    const counts: Record<string, number> = {};
    for (const row of rows ?? []) {
      const action = (row as { action: string }).action;
      counts[action] = (counts[action] ?? 0) + 1;
    }

    const resets = new Date();
    resets.setUTCHours(24, 0, 0, 0);

    return json({
      plan,
      environment: env,
      resets_at: resets.toISOString(),
      actions: Object.keys(limits).map((action) => ({
        action,
        label: ACTION_LABELS[action] ?? action,
        used: Math.min(counts[action] ?? 0, limits[action]),
        limit: limits[action],
      })),
    });
  } catch (e) {
    console.error("usage-summary error:", e);
    return json({ error: e instanceof Error ? e.message : "Erro desconhecido" }, 500);
  }
});
