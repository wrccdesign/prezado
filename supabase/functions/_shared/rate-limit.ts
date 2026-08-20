import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolvePaymentEnv, type PaymentEnv } from "./payment-env.ts";

/**
 * Every metered action MUST be declared here, for every plan. There is no
 * silent default: an action missing from this table is denied (see
 * `checkRateLimit`), so adding a new paid feature without a limit fails loudly
 * instead of leaking an unlimited entitlement to the free plan.
 *
 * As cotas são MENSAIS (mês-calendário em America/Sao_Paulo), sem rolagem de
 * saldo entre meses.
 */
export const PLAN_LIMITS: Record<string, Record<string, number>> = {
  free: {
    search: 20,
    chat: 10,
    diagnostico: 1,
    diagnostico_completo_free: 1,
    peticao: 0,
    analise: 3,
    documento: 5,
  },
  profissional: {
    search: 400,
    chat: 200,
    diagnostico: 60,
    diagnostico_completo_free: 60,
    peticao: 60,
    analise: 40,
    documento: 80,
  },
  escritorio: {
    search: 1500,
    chat: 800,
    diagnostico: 200,
    diagnostico_completo_free: 200,
    peticao: 200,
    analise: 150,
    documento: 300,
  },
};

/**
 * Ações sem cota mensal (canal de aquisição): rodam sem IA e com dado que já
 * está no nosso banco, então não são racionadas por plano. Continuam sujeitas
 * à trava de rajada por hora — o que sai é o teto mensal, não a proteção
 * contra abuso/raspagem.
 */
export const UNMETERED_ACTIONS = new Set(["calculo"]);

/** Sentinela de limite para ações ilimitadas. */
export const UNLIMITED = -1;

/**
 * Trava anti-abuso: cota mensal sem teto instantâneo permite drenar o mês em
 * minutos com script. Máximo de chamadas por hora somando TODAS as ações,
 * igual para todos os planos.
 */
export const BURST_LIMIT_PER_HOUR = 30;



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
 * Janela de uso: mês-calendário em America/Sao_Paulo (UTC-3, sem horário de
 * verão desde 2019). Usar UTC viraria o mês às 21h do último dia local.
 */
const SP_OFFSET_MS = 3 * 60 * 60 * 1000;

export function saoPauloMonthStart(now: Date = new Date()): Date {
  const local = new Date(now.getTime() - SP_OFFSET_MS);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1) + SP_OFFSET_MS);
}

export function saoPauloMonthEnd(now: Date = new Date()): Date {
  const local = new Date(now.getTime() - SP_OFFSET_MS);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth() + 1, 1) + SP_OFFSET_MS);
}

/** Data de renovação (1º dia do mês seguinte) formatada como dd/mm. */
export function formatRenewal(date: Date = saoPauloMonthEnd()): string {
  const local = new Date(date.getTime() - SP_OFFSET_MS);
  const dd = String(local.getUTCDate()).padStart(2, "0");
  const mm = String(local.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}

export async function checkRateLimit(
  userId: string,
  action: string,
  supabaseUrl: string,
  supabaseServiceKey: string,
  env: PaymentEnv = "live",
): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
  plan: string;
  renewsAt: string;
  unknownAction?: boolean;
  burstLimited?: boolean;
}> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const renewsAt = saoPauloMonthEnd().toISOString();

  const { data: planData } = await supabase.rpc("get_user_plan", {
    p_user_id: userId,
    p_env: env,
  });
  const plan = (planData as string) || "free";
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

  const unmetered = UNMETERED_ACTIONS.has(action);

  if (!unmetered && !(action in limits)) {
    console.error(
      `[rate-limit] Ação "${action}" não está cadastrada em PLAN_LIMITS (plano "${plan}"). Requisição negada.`,
    );
    return { allowed: false, used: 0, limit: 0, plan, renewsAt, unknownAction: true };
  }

  const limit = unmetered ? UNLIMITED : limits[action];
  if (limit === 0) {
    return { allowed: false, used: 0, limit: 0, plan, renewsAt };
  }


  // Trava de rajada antes da cota mensal: todas as ações da última hora.
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: burstCount } = await supabase
    .from("usage_tracking")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", oneHourAgo);

  if ((burstCount ?? 0) >= BURST_LIMIT_PER_HOUR) {
    return { allowed: false, used: 0, limit, plan, renewsAt, burstLimited: true };
  }

  // Ação ilimitada: registra o uso (alimenta a trava de rajada) e libera.
  if (unmetered) {
    await supabase.from("usage_tracking").insert({ user_id: userId, action });
    return { allowed: true, used: 0, limit: UNLIMITED, plan, renewsAt };
  }

  const { count } = await supabase
    .from("usage_tracking")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("action", action)
    .gte("created_at", saoPauloMonthStart().toISOString())
    .lt("created_at", saoPauloMonthEnd().toISOString());

  const used = count ?? 0;

  if (used >= limit) {
    return { allowed: false, used, limit, plan, renewsAt };
  }


  await supabase.from("usage_tracking").insert({ user_id: userId, action });

  return { allowed: true, used: used + 1, limit, plan, renewsAt };
}

const ACTION_NOUNS: Record<string, string> = {
  search: "buscas",
  chat: "mensagens de chat",
  diagnostico: "diagnósticos",
  diagnostico_completo_free: "diagnósticos completos",
  peticao: "petições",
  analise: "análises",
  documento: "leituras de documento",
  calculo: "cálculos",
};

/** Mensagem padrão de cota mensal estourada. */
export function monthlyLimitMessage(action: string, limit: number, plan: string): string {
  if (limit === 0) {
    return "Este recurso não está disponível no seu plano. Faça upgrade em /planos para liberar.";
  }
  const noun = ACTION_NOUNS[action] ?? "usos";
  const upgradePlan = plan === "profissional" ? "escritorio" : "profissional";
  const upgradeLabel = upgradePlan === "escritorio" ? "Escritório" : "Profissional";
  const upgradeLimit = PLAN_LIMITS[upgradePlan]?.[action];
  const upgradeHint = plan === "escritorio" || upgradeLimit === undefined || upgradeLimit <= limit
    ? ""
    : ` O plano ${upgradeLabel} libera ${upgradeLimit} ${noun} por mês — veja em /planos.`;
  return `Você usou suas ${limit} ${noun} deste mês (plano ${plan}). O limite renova em ${formatRenewal()}.${upgradeHint}`;
}

/** Mensagem da trava de rajada — situação diferente de cota mensal esgotada. */
export function burstLimitMessage(): string {
  return `Muitas requisições em pouco tempo (limite de ${BURST_LIMIT_PER_HOUR} por hora). Aguarde alguns minutos — sua cota mensal continua disponível.`;
}

