import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  type StripeEnv,
  createStripeClient,
  isOneTimePrice,
  ONE_TIME_ACCESS_DAYS,
  planFromPriceId,
} from "../_shared/stripe.ts";
import { resolvePaymentEnv } from "../_shared/payment-env.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId?: string },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) {
    throw new Error("Invalid userId");
  }
  if (options.userId) {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    if (found.data.length) return found.data[0].id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data.length) {
      const customer = existing.data[0];
      if (options.userId && customer.metadata?.userId !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

/** Active recurring subscription of this customer, if any. */
async function findActiveSubscription(
  stripe: ReturnType<typeof createStripeClient>,
  customerId: string,
) {
  const list = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 20 });
  return list.data
    .filter((s) => ["active", "trialing"].includes(s.status))
    .sort((a, b) => (b.created ?? 0) - (a.created ?? 0))[0] ?? null;
}

/**
 * Pro-rated credit (in cents) for the unused part of an active monthly
 * subscription. Capped at one month and at the annual price.
 */
export function proratedCreditCents(
  monthlyAmount: number,
  periodStart: number,
  periodEnd: number,
  annualAmount: number,
  now = Math.floor(Date.now() / 1000),
): number {
  if (!monthlyAmount || !periodStart || !periodEnd || periodEnd <= periodStart) return 0;
  const total = periodEnd - periodStart;
  const remaining = Math.max(0, Math.min(periodEnd - now, total));
  const credit = Math.floor((remaining / total) * monthlyAmount);
  return Math.max(0, Math.min(credit, monthlyAmount, Math.max(0, annualAmount - 100)));
}

/** Reuse a credit coupon per subscription so it can't be stacked. */
async function ensureCreditCoupon(
  stripe: ReturnType<typeof createStripeClient>,
  env: StripeEnv,
  subscriptionId: string,
  amountOff: number,
): Promise<string | null> {
  if (amountOff <= 0) return null;
  const key = `credit_${env}_${subscriptionId}`;

  const { data: existing } = await supabase
    .from("payment_events")
    .select("payload")
    .eq("event_id", key)
    .maybeSingle();

  const payload = (existing as { payload?: Record<string, unknown> } | null)?.payload as
    | { coupon_id?: string; consumed?: boolean }
    | undefined;
  if (payload?.coupon_id && !payload.consumed) {
    try {
      const coupon = await stripe.coupons.retrieve(payload.coupon_id);
      if (coupon && !(coupon as { deleted?: boolean }).deleted) return coupon.id;
    } catch (_e) {
      // fall through and mint a new one
    }
  }
  if (payload?.consumed) return null;

  const coupon = await stripe.coupons.create({
    amount_off: amountOff,
    currency: "brl",
    duration: "once",
    name: "Crédito proporcional do plano mensal",
    metadata: { subscriptionId },
  });

  await supabase.from("payment_events").upsert({
    event_id: key,
    event_type: "credit_coupon",
    environment: env,
    occurred_at: new Date().toISOString(),
    payload: { coupon_id: coupon.id, amount_off: amountOff, consumed: false, subscriptionId },
  }, { onConflict: "event_id" });

  return coupon.id;
}

async function createCheckoutSession(options: {
  priceId: string;
  userId: string;
  customerEmail?: string;
  returnUrl: string;
  environment: StripeEnv;
}) {
  if (!/^[a-zA-Z0-9_-]+$/.test(options.priceId)) throw new Error("Invalid priceId");
  const stripe = createStripeClient(options.environment);

  const prices = await stripe.prices.list({ lookup_keys: [options.priceId] });
  if (!prices.data.length) throw new Error("Price not found");
  const stripePrice = prices.data[0];
  const isRecurring = stripePrice.type === "recurring";
  const oneTime = !isRecurring && isOneTimePrice(options.priceId);

  const customerId = await resolveOrCreateCustomer(stripe, {
    email: options.customerEmail,
    userId: options.userId,
  });

  const baseMetadata: Record<string, string> = {
    userId: options.userId,
    plan: planFromPriceId(options.priceId),
    priceId: options.priceId,
  };

  if (!isRecurring) {
    // Annual, paid upfront (card only for now).
    const productId = typeof stripePrice.product === "string"
      ? stripePrice.product
      : stripePrice.product.id;
    const product = await stripe.products.retrieve(productId);

    let couponId: string | null = null;
    let existingSubscriptionId: string | undefined;
    if (oneTime) {
      const activeSub = await findActiveSubscription(stripe, customerId);
      if (activeSub) {
        existingSubscriptionId = activeSub.id;
        const item = activeSub.items?.data?.[0];
        const credit = proratedCreditCents(
          item?.price?.unit_amount ?? 0,
          (item as any)?.current_period_start ?? (activeSub as any).current_period_start,
          (item as any)?.current_period_end ?? (activeSub as any).current_period_end,
          stripePrice.unit_amount ?? 0,
        );
        couponId = await ensureCreditCoupon(stripe, options.environment, activeSub.id, credit);
      }
    }

    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: stripePrice.id, quantity: 1 }],
      mode: "payment",
      ui_mode: "embedded_page",
      locale: "pt-BR",
      return_url: options.returnUrl,
      customer: customerId,
      ...(oneTime && {
        // Pix requires a Brazilian Stripe account; ours is Irish. Re-add
        // "pix" here as soon as the BR account is active.
        payment_method_types: ["card"] as any,

        tax_id_collection: { enabled: true },
      }),
      ...(couponId && { discounts: [{ coupon: couponId }] }),
      payment_intent_data: { description: product.name },
      metadata: {
        ...baseMetadata,
        ...(oneTime && { duration_days: String(ONE_TIME_ACCESS_DAYS[options.priceId]) }),
        ...(couponId && { credit_coupon_id: couponId }),
        ...(existingSubscriptionId && { replaces_subscription_id: existingSubscriptionId }),
      },
    });
    return session.client_secret;
  }

  const session = await stripe.checkout.sessions.create({
    line_items: [{ price: stripePrice.id, quantity: 1 }],
    mode: "subscription",
    ui_mode: "embedded_page",
    locale: "pt-BR",
    return_url: options.returnUrl,
    customer: customerId,
    metadata: baseMetadata,
    subscription_data: { metadata: { userId: options.userId } },
  });

  return session.client_secret;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token ?? "");
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const priceId = typeof body?.priceId === "string" ? body.priceId : "";
    if (!priceId) {
      return new Response(JSON.stringify({ error: "priceId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const environment = resolvePaymentEnv(req);
    const origin = req.headers.get("origin") || "https://honorifico.com.br";
    const returnUrl = typeof body?.returnUrl === "string" && body.returnUrl.startsWith(origin)
      ? body.returnUrl
      : `${origin}/planos?checkout=success&session_id={CHECKOUT_SESSION_ID}`;

    const clientSecret = await createCheckoutSession({
      priceId,
      userId: user.id,
      customerEmail: user.email ?? undefined,
      returnUrl,
      environment,
    });

    return new Response(JSON.stringify({ clientSecret, environment }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("create-checkout error:", error);
    const message = error instanceof Error ? error.message : "Erro ao iniciar checkout";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
