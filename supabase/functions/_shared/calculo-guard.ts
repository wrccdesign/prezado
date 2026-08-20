import { requireUser } from "./auth.ts";
import { burstLimitMessage, checkRateLimit, extractEnv, monthlyLimitMessage } from "./rate-limit.ts";

const MENSAGEM_SEM_PLANO: Record<string, string> = {
  calculo: "As calculadoras não estão disponíveis no seu plano.",
  analise: "A análise de documentos não está disponível no seu plano.",
  chat: "O chat jurídico não está disponível no seu plano.",
  documento: "A leitura de documentos não está disponível no seu plano.",
};

/**
 * Exige sessão de usuário e consome uma unidade da cota mensal do plano para a
 * ação informada. Retorna o `userId` ou uma `Response` pronta para o cliente
 * (401 sem sessão, 429 quando a cota do mês estourou).
 */
export async function requireQuota(
  req: Request,
  action: string,
  corsHeaders: Record<string, string>,
): Promise<{ userId: string } | Response> {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  const { allowed, used, limit, plan, renewsAt, burstLimited } = await checkRateLimit(
    auth.userId,
    action,
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    extractEnv(req),
  );

  if (!allowed) {
    return new Response(
      JSON.stringify({
        error: burstLimited
          ? burstLimitMessage()
          : limit === 0
          ? MENSAGEM_SEM_PLANO[action] ?? "Este recurso não está disponível no seu plano."
          : monthlyLimitMessage(action, limit, plan),
        used,
        limit,
        plan,
        renews_at: renewsAt,
        limit_reached: !burstLimited,
        burst_limit: burstLimited === true,
        upgrade_url: "/planos",
      }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  return { userId: auth.userId };
}


/** Atalho para as calculadoras jurídicas (ação `calculo`). */
export function requireCalculoQuota(req: Request, corsHeaders: Record<string, string>) {
  return requireQuota(req, "calculo", corsHeaders);
}

// ---------------------------------------------------------------------------
// Modo convidado (visitante sem login)
//
// ATENÇÃO — LIMITE APENAS DISSUASIVO, NÃO CONFIÁVEL.
// A contagem por IP vive num Map em memória do isolate: não é compartilhada
// entre instâncias da edge function e é zerada em todo cold start. Na prática o
// visitante pode exceder o limite. Isso é tolerável para `calculo`, que é puro
// CPU e custo desprezível.
//
// NÃO USE `requireQuotaOrGuest` em nenhuma ação que chame IA, faça scraping ou
// consuma qualquer API paga — nesses casos exija sessão (`requireQuota`) ou
// implemente contagem persistente em tabela, com hash do IP.
// ---------------------------------------------------------------------------

const GUEST_WINDOW_MS = 24 * 60 * 60 * 1000;
const guestHits = new Map<string, { count: number; resetAt: number }>();


function guestKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  return fwd.split(",")[0].trim() || req.headers.get("cf-connecting-ip") || "unknown";
}

/**
 * Permite uso limitado por visitantes anônimos. Usuários autenticados seguem
 * pelo fluxo normal de cota mensal. Retorna `{ userId, guest }` ou uma
 * `Response` (limite de convidado ou cota do plano estourada).
 */
export async function requireQuotaOrGuest(
  req: Request,
  action: string,
  corsHeaders: Record<string, string>,
  guestLimit = 3,
): Promise<{ userId: string | null; guest: boolean } | Response> {
  const auth = await requireUser(req);

  if (!(auth instanceof Response)) {
    const quota = await requireQuota(req, action, corsHeaders);
    if (quota instanceof Response) return quota;
    return { userId: quota.userId, guest: false };
  }

  const key = guestKey(req);
  const now = Date.now();
  const entry = guestHits.get(key);

  if (!entry || entry.resetAt <= now) {
    guestHits.set(key, { count: 1, resetAt: now + GUEST_WINDOW_MS });
    return { userId: null, guest: true };
  }

  if (entry.count >= guestLimit) {
    return new Response(
      JSON.stringify({
        error:
          "Você usou suas consultas gratuitas de demonstração. Crie sua conta grátis para continuar — são 7 dias com todos os recursos do plano Profissional.",
        guest_limit: true,
        upgrade_url: "/auth",
      }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  entry.count += 1;
  return { userId: null, guest: true };
}

