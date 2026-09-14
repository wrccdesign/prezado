import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  type AsaasEnv,
  cancelSubscription,
  isPixKeyMissingError,
  checkoutSessionUrl,
  createCheckoutSession,
  createSubscription,
  findOrCreateCustomer,
  isRecurringPrice,
  listActiveCustomerSubscriptions,
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

/** Janela de reuso da sessão de checkout já criada. */
const REUSE_WINDOW_MS = 30 * 60 * 1000;

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

    const phone = typeof body?.phone === "string" ? body.phone.replace(/\D/g, "") : "";
    if (phone.length < 10 || phone.length > 11) {
      return json({ error: "Informe um telefone com DDD para o pagamento." }, 400);
    }

    const planId = planFromPriceId(priceId);
    const recurring = isRecurringPrice(priceId);

    // Forma de pagamento pedida. No anual o Asaas mostra Pix e cartão na mesma tela.
    const requestedBillingType = recurring
      ? (body?.billingType === "PIX" ? "PIX" : "CREDIT_CARD")
      : "PIX_OR_CREDIT_CARD";

    // 1) Reaproveita uma sessão de checkout recente do mesmo plano E da mesma
    //    forma de pagamento — trocar de Pix para cartão precisa de link novo.
    const cutoff = new Date(Date.now() - REUSE_WINDOW_MS).toISOString();
    const { data: reusable } = await supabase
      .from("subscriptions")
      .select("id, checkout_url, checkout_expires_at")
      .eq("user_id", user.id)
      .eq("environment", env)
      .eq("provider", "asaas")
      .eq("price_id", priceId)
      .eq("status", "incomplete")
      .eq("checkout_billing_type", requestedBillingType)
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (
      reusable?.checkout_url &&
      reusable.checkout_expires_at &&
      new Date(reusable.checkout_expires_at as string) > new Date()
    ) {
      return json({ checkoutUrl: reusable.checkout_url, reused: true });
    }

    const customer = await findOrCreateCustomer(env, {
      email: user.email ?? undefined,
      userId: user.id,
      name: user.user_metadata?.full_name as string | undefined,
      cpfCnpj,
      phone,
    });

    // 2) Nunca cria uma segunda assinatura ativa para o mesmo plano.
    if (recurring) {
      const activeRemote = await listActiveCustomerSubscriptions(env, customer.id);
      const samePlan = activeRemote.find((s) => (s.externalReference ?? "").endsWith(`:${priceId}`));
      if (samePlan) {
        return json({
          error: "Você já tem uma assinatura ativa deste plano. Veja os detalhes na sua conta.",
          alreadySubscribed: true,
          manageUrl: `${origin}/conta`,
        }, 409);
      }
    }

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();


    // 3) Grava a intenção ANTES de criar no Asaas, para não gerar cobrança órfã.
    const intent = {
      user_id: user.id,
      provider: "asaas",
      provider_customer_id: customer.id,
      plan_id: planId,
      price_id: priceId,
      status: "incomplete",
      access_type: recurring ? "recurring" : "one_time",
      environment: env,
      checkout_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    };

    let intentId = reusable?.id as string | undefined;
    if (intentId) {
      const { error } = await supabase.from("subscriptions").update(intent).eq("id", intentId);
      if (error) throw new Error(`Erro ao registrar a cobrança: ${error.message}`);
    } else {
      const { data: inserted, error } = await supabase
        .from("subscriptions")
        .insert(intent)
        .select("id")
        .single();
      if (error || !inserted) {
        throw new Error(`Erro ao registrar a cobrança: ${error?.message ?? "sem retorno"}`);
      }
      intentId = inserted.id as string;
    }

    if (requestedBillingType === "PIX") {
      let subscription;
      try {
        subscription = await createSubscription(
          env,
          customer.id,
          priceId as PriceId,
          user.id,
          "PIX",
        );
      } catch (error) {
        if (isPixKeyMissingError(error)) {
          return json(
            {
              error:
                "O Pix ainda não está disponível para esta conta. Escolha pagamento no cartão para continuar.",
              pixUnavailable: true,
            },
            400,
          );
        }
        throw error;
      }

      // Daqui em diante, qualquer falha cancela a assinatura recém-criada.
      try {
        const payments = await listCustomerPayments(env, customer.id);
        const firstPayment = payments.find((payment) => payment.subscription === subscription.id);
        if (!firstPayment?.invoiceUrl) {
          throw new Error("O Asaas não retornou a cobrança Pix da assinatura.");
        }

        const { error: linkError } = await supabase
          .from("subscriptions")
          .update({
            provider_subscription_id: subscription.id,
            checkout_url: firstPayment.invoiceUrl,
            checkout_expires_at: expiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq("id", intentId);
        if (linkError) throw new Error(`Erro ao registrar assinatura: ${linkError.message}`);

        return json({ checkoutUrl: firstPayment.invoiceUrl, billingType: "PIX" });
      } catch (error) {
        try {
          await cancelSubscription(env, subscription.id);
          console.error("Assinatura Pix cancelada após falha local:", subscription.id);
        } catch (cancelError) {
          console.error("Falha ao cancelar assinatura órfã:", subscription.id, cancelError);
        }
        throw error;
      }
    }

    const sessionOptions = {
      customerId: customer.id,
      priceId: priceId as PriceId,
      userId: user.id,
      successUrl: `${origin}/planos?checkout=success`,
      cancelUrl: `${origin}/planos?checkout=cancelled`,
      expiredUrl: `${origin}/planos?checkout=expired`,
      billingTypes: ["CREDIT_CARD"],
    };

    const session = await createCheckoutSession(env, sessionOptions);

    const checkoutUrl = session.link || checkoutSessionUrl(env, session.id);
    await supabase
      .from("subscriptions")
      .update({
        checkout_url: checkoutUrl,
        checkout_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", intentId);

    return json({ checkoutUrl });
  } catch (error) {
    console.error("asaas-create-checkout error:", error);
    return json({ error: error instanceof Error ? error.message : "Erro ao iniciar checkout" }, 400);
  }
});
