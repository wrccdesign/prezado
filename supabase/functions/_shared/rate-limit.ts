import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolvePaymentEnv, type PaymentEnv } from "./payment-env.ts";

/**
 * Every metered action MUST be declared here, for every plan. There is no
 * silent default: an action missing from this table is denied (see
 * `checkRateLimit`), so adding a new paid feature without a limit fails loudly
 * instead of leaking an unlimited entitlement to the free plan.
 */
export const PLAN_LIMITS: Record<string, Record<string, number>> = {
  free: {
    search: 5,
    chat: 3,
    diagnostico: 2,
    diagnostico_completo_free: 1,
    peticao: 0,
    analise: 3,
    calculo: 10,
  },
  profissional: {
    search: 50,
    chat: 30,
    diagnostico: 15,
    diagnostico_completo_free: 15,
    peticao: 10,
    analise: 30,
    calculo: 100,
  },
  escritorio: {
    search: 200,
    chat: 100,
    diagnostico: 50,
    diagnostico_completo_free: 50,
    peticao: 30,
    analise: 100,
    calculo: 300,
  },
};

export type { PaymentEnv };

/**
 * The environment is derived from the request origin, never from a header the
 * client controls — otherwise a production user could claim "sandbox" and
 * inherit an entitlement paid with a test card.
 */
export function extractEnv(req: Request): PaymentEnv {
  return resolvePaymentEnv(req);
}

/**
 * Usage day boundaries in America/Sao_Paulo (UTC-3, no DST since 2019), which
 * is what /planos promises to the user ("renovados à meia-noite, horário de
 * Brasília"). Using UTC here would reset counters at 21h local time.
 */
const SP_OFFSET_MS = 3 * 60 * 60 * 1000;

export function saoPauloDayStart(now: Date = new Date()): Date {
  const local = new Date(now.getTime() - SP_OFFSET_MS);
  return new Date(
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) + SP_OFFSET_MS,
  );
}

export function saoPauloDayEnd(now: Date = new Date()): Date {
  return new Date(saoPauloDayStart(now).getTime() + 86_400_000);
}

export async function checkRateLimit(
  userId: string,
  action: string,
  supabaseUrl: string,
  supabaseServiceKey: string,
  env: PaymentEnv = "live",
): Promise<{ allowed: boolean; used: number; limit: number; plan: string; unknownAction?: boolean }> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: planData } = await supabase.rpc("get_user_plan", {
    p_user_id: userId,
    p_env: env,
  });
  const plan = (planData as string) || "free";
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

  if (!(action in limits)) {
    console.error(
      `[rate-limit] Ação "${action}" não está cadastrada em PLAN_LIMITS (plano "${plan}"). Requisição negada.`,
    );
    return { allowed: false, used: 0, limit: 0, plan, unknownAction: true };
  }

  const limit = limits[action];
  if (limit === 0) {
    return { allowed: false, used: 0, limit: 0, plan };
  }

  const { count } = await supabase
    .from("usage_tracking")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("action", action)
    .gte("created_at", saoPauloDayStart().toISOString())
    .lt("created_at", saoPauloDayEnd().toISOString());

  const used = count ?? 0;

  if (used >= limit) {
    return { allowed: false, used, limit, plan };
  }

  await supabase.from("usage_tracking").insert({ user_id: userId, action });

  return { allowed: true, used: used + 1, limit, plan };
}
