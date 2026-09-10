import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  type AsaasEnv,
  checkoutSessionUrl,
  createCheckoutSession,
  findOrCreateCustomer,
  isRecurringPrice,
  planFromPriceId,
  resolveAsaasEnv,
  type PriceId,
  PLAN_CONFIG,
} from "../_shared/asaas.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token ?? "");
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const priceId = typeof body?.priceId === "string" ? body.priceId : "";
    if (!priceId || !PLAN_CONFIG[priceId as PriceId]) {
      return json({ error: "priceId inválido" }, 400);
    }

    const env: AsaasEnv = resolveAsaasEnv(req);
    const origin = req.headers.get("origin") || "https://honorifico.com.br";

    const cpfCnpj = typeof body?.cpfCnpj === "string" ? body.cpfCnpj.replace(/\D/g, "") : "";
    if (!cpfCnpj || (cpfCnpj.length !== 11 && cpfCnpj.length !== 14)) {
      return json({ error: "Informe um CPF ou CNPJ válido para o pagamento." }, 400);
    }

    const customer = await findOrCreateCustomer(env, {
      email: user.email ?? undefined,
      userId: user.id,
      name: user.user_metadata?.full_name as string | undefined,
      cpfCnpj,
    });

    const planId = planFromPriceId(priceId);
    const recurring = isRecurringPrice(priceId);

    const session = await createCheckoutSession(env, {
      customerId: customer.id,
      priceId: priceId as PriceId,
      userId: user.id,
      successUrl: `${origin}/planos?checkout=success`,
      cancelUrl: `${origin}/planos?checkout=cancelled`,
      expiredUrl: `${origin}/planos?checkout=expired`,
    });

    // Registra a intenção; o webhook confirma o pagamento.
    const intent = {
      user_id: user.id,
      provider: "asaas",
      provider_customer_id: customer.id,
      plan_id: planId,
      price_id: priceId,
      status: "incomplete",
      access_type: recurring ? "recurring" : "one_time",
      environment: env,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("environment", env)
      .eq("provider", "asaas")
      .eq("status", "incomplete")
      .limit(1)
      .maybeSingle();

    if (existing?.id) {
      await supabase.from("subscriptions").update(intent).eq("id", existing.id);
    } else {
      await supabase.from("subscriptions").insert(intent);
    }

    return json({ checkoutUrl: session.link || checkoutSessionUrl(env, session.id) });
  } catch (error) {
    console.error("asaas-create-checkout error:", error);
    return json({ error: error instanceof Error ? error.message : "Erro ao iniciar checkout" }, 400);
  }
});
