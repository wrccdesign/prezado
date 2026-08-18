import { requireUser } from "./auth.ts";
import { checkRateLimit, extractEnv } from "./rate-limit.ts";

const MENSAGEM_SEM_PLANO: Record<string, string> = {
  calculo: "As calculadoras não estão disponíveis no seu plano.",
  analise: "A análise de documentos não está disponível no seu plano.",
  chat: "O chat jurídico não está disponível no seu plano.",
};

/**
 * Exige sessão de usuário e consome uma unidade da cota diária do plano para a
 * ação informada. Retorna o `userId` ou uma `Response` pronta para o cliente
 * (401 sem sessão, 429 quando a cota do dia estourou).
 */
export async function requireQuota(
  req: Request,
  action: string,
  corsHeaders: Record<string, string>,
): Promise<{ userId: string } | Response> {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  const { allowed, used, limit, plan } = await checkRateLimit(
    auth.userId,
    action,
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    extractEnv(req),
  );

  if (!allowed) {
    return new Response(
      JSON.stringify({
        error: limit === 0
          ? MENSAGEM_SEM_PLANO[action] ?? "Este recurso não está disponível no seu plano."
          : `Você atingiu o limite diário do plano ${plan} (${limit}). Faça upgrade para continuar.`,
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

/** Atalho para as calculadoras jurídicas (ação `calculo`). */
export function requireCalculoQuota(req: Request, corsHeaders: Record<string, string>) {
  return requireQuota(req, "calculo", corsHeaders);
}
