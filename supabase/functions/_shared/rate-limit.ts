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
 *
 * `peticao_preview` são as etapas de preparação (enquadramento, fundamentação,
 * precedentes) de UMA petição que ainda vai ser gerada: revisar o material
 * antes de gerar não pode custar petições adicionais. A cota `peticao` é
 * debitada só na geração final.
 */
export const UNMETERED_ACTIONS = new Set(["calculo", "peticao_preview"]);

/**
 * Refinamentos incluídos em CADA análise: reanalisar o mesmo caso depois de
 * esclarecer um apontamento é a mesma tarefa, não uma análise nova. Passando
 * deste número, a rodada seguinte debita uma unidade de "analise".
 */
export const ANALISE_FREE_ROUNDS: Record<string, number> = {
  free: 1,
  profissional: 5,
  escritorio: 10,
  admin: 10,
};

export function analiseFreeRounds(plan: string): number {
  return ANALISE_FREE_ROUNDS[plan] ?? ANALISE_FREE_ROUNDS.free;
}



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

/** Plano sintético devolvido para administradores. */
export const ADMIN_PLAN = "admin";

type RoleClient = {
  from: (table: string) => any;
};

/** Consulta server-side do papel admin. Falha de consulta conta como não-admin. */
export async function isAdminUser(supabase: RoleClient, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    return !error && !!data;
  } catch {
    return false;
  }
}

export async function checkRateLimit(
  userId: string,
  action: string,
  supabaseUrl: string,
  supabaseServiceKey: string,
  env: PaymentEnv = "live",
  options?: {
    /**
     * Decide, já sabendo o plano, se esta chamada deve debitar cota. Retornando
     * true, a chamada é liberada sem consumir o mês (a trava de rajada continua
     * valendo). Usado pelos refinamentos incluídos na análise.
     */
    skipMeteringFor?: (plan: string) => boolean;
    /** Só para testes: cliente já construído. */
    client?: any;
  },
): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
  plan: string;
  renewsAt: string;
  unknownAction?: boolean;
  burstLimited?: boolean;
  /** false quando a chamada foi liberada sem debitar cota. */
  metered?: boolean;
}> {

  const supabase = options?.client ?? createClient(supabaseUrl, supabaseServiceKey);
  const renewsAt = saoPauloMonthEnd().toISOString();

  // Admin (papel em user_roles, lido com a service key, nunca de dado do cliente):
  // sem cota mensal e sem trava de rajada. O uso continua registrado com a
  // mesma action, para as métricas.
  if (await isAdminUser(supabase, userId)) {
    await supabase.from("usage_tracking").insert({ user_id: userId, action });
    return { allowed: true, used: 0, limit: UNLIMITED, plan: ADMIN_PLAN, renewsAt, metered: false };
  }

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

  // Refinamento incluído no plano: libera sem debitar a cota mensal. O registro
  // com sufixo "_refino" só alimenta a trava de rajada.
  if (!unmetered && options?.skipMeteringFor?.(plan)) {
    await supabase.from("usage_tracking").insert({ user_id: userId, action: `${action}_refino` });
    return { allowed: true, used: 0, limit, plan, renewsAt, metered: false };
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

  return { allowed: true, used: used + 1, limit, plan, renewsAt, metered: true };

}

/** Substantivo de cada ação, no singular e no plural. */
export const ACTION_NOUNS: Record<string, { one: string; many: string; fem: boolean }> = {
  search: { one: "busca", many: "buscas", fem: true },
  chat: { one: "mensagem de chat", many: "mensagens de chat", fem: true },
  diagnostico: { one: "diagnóstico", many: "diagnósticos", fem: false },
  diagnostico_completo_free: { one: "diagnóstico completo", many: "diagnósticos completos", fem: false },
  peticao: { one: "petição", many: "petições", fem: true },
  analise: { one: "análise", many: "análises", fem: true },
  documento: { one: "leitura de documento", many: "leituras de documento", fem: true },
  calculo: { one: "cálculo", many: "cálculos", fem: false },
};

/** "1 diagnóstico", "2 diagnósticos". */
export function countNoun(action: string, n: number): string {
  const noun = ACTION_NOUNS[action] ?? { one: "uso", many: "usos", fem: false };
  return `${n} ${n === 1 ? noun.one : noun.many}`;
}

/** Mensagem padrão de cota mensal estourada. O botão "Ver planos" leva a /planos. */
export function monthlyLimitMessage(action: string, limit: number, plan: string): string {
  if (limit === 0) {
    return "Este recurso não está disponível no seu plano. Veja os planos para liberar.";
  }
  const noun = ACTION_NOUNS[action] ?? { one: "uso", many: "usos", fem: false };
  const possessivo = limit === 1 ? (noun.fem ? "sua" : "seu") : (noun.fem ? "suas" : "seus");
  const upgradePlan = plan === "profissional" ? "escritorio" : "profissional";
  const upgradeLabel = upgradePlan === "escritorio" ? "Escritório" : "Profissional";
  const upgradeLimit = PLAN_LIMITS[upgradePlan]?.[action];
  const upgradeHint = plan === "escritorio" || upgradeLimit === undefined || upgradeLimit <= limit
    ? ""
    : ` O plano ${upgradeLabel} libera ${countNoun(action, upgradeLimit)} por mês.`;
  return `Você usou ${possessivo} ${countNoun(action, limit)} deste mês (plano ${plan}). O limite renova em ${formatRenewal()}.${upgradeHint}`;
}

/** Mensagem da trava de rajada, situação diferente de cota mensal esgotada. */
export function burstLimitMessage(): string {
  return `Muitas requisições em pouco tempo (limite de ${BURST_LIMIT_PER_HOUR} por hora). Aguarde alguns minutos. Sua cota mensal continua disponível.`;
}
