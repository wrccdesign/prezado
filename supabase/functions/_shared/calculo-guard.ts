import { requireUser } from "./auth.ts";
import { checkRateLimit, extractEnv } from "./rate-limit.ts";

/**
 * As calculadoras jurídicas são autenticadas e medidas como ação `calculo`.
 * Retorna o `userId` ou uma `Response` pronta para devolver ao cliente
 * (401 sem sessão, 429 quando a cota diária do plano estourou).
 */
export async function requireCalculoQuota(
  req: Request,
  corsHeaders: Record<string, string>,
): Promise<{ userId: string } | Response> {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  const { allowed, used, limit, plan } = await checkRateLimit(
    auth.userId,
    "calculo",
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    extractEnv(req),
  );

  if (!allowed) {
    return new Response(
      JSON.stringify({
        error: limit === 0
          ? "As calculadoras não estão disponíveis no seu plano."
          : `Você atingiu o limite de ${limit} cálculo(s) por dia do plano ${plan}. Faça upgrade para continuar.`,
        used,
        limit,
        plan,
        limit_reached: true,
        upgrade_url: "/planos",
      }),

      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  return { userId: auth.userId };
}
