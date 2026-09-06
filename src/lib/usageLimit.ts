/**
 * As edge functions medidas por crédito respondem 429 com
 * `{ error, limit, plan, limit_reached, upgrade_url }`. Quando chamadas via
 * `supabase.functions.invoke`, o corpo do erro vem em `error.context`.
 */
export interface LimitErrorInfo {
  message: string;
  /** Cota mensal do plano esgotada — vale oferecer upgrade. */
  limitReached: boolean;
  /** Trava de rajada (muitas chamadas por hora) — não é problema de plano. */
  burstLimited: boolean;
  /** Sessão ausente ou expirada — o usuário precisa entrar de novo. */
  authRequired: boolean;
}

export async function readFunctionError(error: unknown, fallback: string): Promise<LimitErrorInfo> {
  const context = (error as { context?: Response })?.context;
  if (context && typeof context.json === "function") {
    try {
      const body = await context.clone().json();
      const burstLimited = body?.burst_limit === true;
      const authRequired = context.status === 401 || body?.auth_required === true;
      return {
        message: typeof body?.error === "string" ? body.error : fallback,
        limitReached: !burstLimited && !authRequired && (context.status === 429 || body?.limit_reached === true),
        burstLimited,
        authRequired,
      };
    } catch {
      // corpo não-JSON — segue para o fallback
    }
  }
  const message = error instanceof Error ? error.message : fallback;
  return { message, limitReached: false, burstLimited: false, authRequired: false };
}
