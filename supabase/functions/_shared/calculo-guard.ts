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
// A contagem é persistida em `public.anon_usage`, com hash SHA-256 do IP —
// nunca o IP em claro. Isso vale entre instâncias da edge function e sobrevive
// a cold start, ao contrário do contador em memória que existia antes.
//
// Mesmo teto de rajada dos usuários logados: 30 requisições por hora por IP.
// ---------------------------------------------------------------------------

const GUEST_WINDOW_MS = 60 * 60 * 1000;
const GUEST_LIMIT_PER_HOUR = BURST_LIMIT_PER_HOUR;

function guestIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  return fwd.split(",")[0].trim() || req.headers.get("cf-connecting-ip") || "unknown";
}

async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(`honorifico:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Permite uso por visitantes anônimos com limite por IP persistido no banco.
 * Usuários autenticados seguem pelo fluxo normal de cota/rajada. Retorna
 * `{ userId, guest }` ou uma `Response` 429/limite estourado.
 */
export async function requireQuotaOrGuest(
  req: Request,
  action: string,
  corsHeaders: Record<string, string>,
  guestLimit = GUEST_LIMIT_PER_HOUR,
): Promise<{ userId: string | null; guest: boolean } | Response> {
  const auth = await requireUser(req);

  if (!(auth instanceof Response)) {
    const quota = await requireQuota(req, action, corsHeaders);
    if (quota instanceof Response) return quota;
    return { userId: quota.userId, guest: false };
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const ipHash = await hashIp(guestIp(req));
  const since = new Date(Date.now() - GUEST_WINDOW_MS).toISOString();

  const { count } = await supabase
    .from("anon_usage")
    .select("*", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", since);

  if ((count ?? 0) >= guestLimit) {
    return new Response(
      JSON.stringify({
        error:
          `Muitas requisições em pouco tempo (limite de ${guestLimit} por hora). Aguarde alguns minutos ou crie sua conta grátis.`,
        guest_limit: true,
        upgrade_url: "/auth",
      }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  await supabase.from("anon_usage").insert({ ip_hash: ipHash, action });

  return { userId: null, guest: true };
}


