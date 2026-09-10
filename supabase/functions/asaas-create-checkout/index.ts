import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  type AsaasEnv,
  createAnnualCharge,
  createSubscription,
  findOrCreateCustomer,
  isRecurringPrice,
  listCustomerPayments,
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
    const returnUrl = typeof body?.returnUrl === "string" && body.returnUrl.startsWith(origin)
      ? body.returnUrl
      : `${origin}/planos?checkout=success`;

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

    if (recurring) {
      const sub = await createSubscription(env, customer.id, priceId as PriceId);

      // Registra linha provisória; webhook confirmará o pagamento.
      await supabase.from("subscriptions").upsert({
        user_id: user.id,
        provider: "asaas",
        provider_customer_id: customer.id,
        provider_subscription_id: sub.id,
        plan_id: planId,
        price_id: priceId,
        status: "incomplete",
        access_type: "recurring",
        environment: env,
        updated_at: new Date().toISOString(),
      }, { onConflict: "provider_subscription_id,provider,environment" });

      // A primeira cobrança da assinatura é gerada automaticamente.
      const payments = await listCustomerPayments(env, customer.id);
      const firstPayment = payments
        .filter((p) => p.subscription === sub.id)
        .sort((a, b) => (b.dueDate || "").localeCompare(a.dueDate || ""))[0];
      const checkoutUrl = firstPayment?.invoiceUrl || `${returnUrl}&subscription_id=${sub.id}`;

      return json({ checkoutUrl });
    }

    // Anual à vista
    const payment = await createAnnualCharge(env, customer.id, priceId as PriceId);

    await supabase.from("subscriptions").upsert({
      user_id: user.id,
      provider: "asaas",
      provider_customer_id: customer.id,
      payment_provider_ref: payment.id,
      plan_id: planId,
      price_id: priceId,
      status: "incomplete",
      access_type: "one_time",
      environment: env,
      updated_at: new Date().toISOString(),
    }, { onConflict: "payment_provider_ref,environment" });

    return json({ checkoutUrl: payment.invoiceUrl || `${returnUrl}&payment_id=${payment.id}` });
  } catch (error) {
    console.error("asaas-create-checkout error:", error);
    return json({ error: error instanceof Error ? error.message : "Erro ao iniciar checkout" }, 400);
  }
});
