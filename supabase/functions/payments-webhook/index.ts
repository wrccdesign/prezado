import { createClient } from "npm:@supabase/supabase-js@2";
import {
  type StripeEnv,
  createStripeClient,
  planFromPriceId,
  verifyWebhook,
} from "../_shared/stripe.ts";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
  }
  return _supabase;
}

function priceIdOf(item: any): string | undefined {
  return item?.price?.lookup_key
    || item?.price?.metadata?.lovable_external_id
    || item?.price?.id;
}

function isoFromUnix(seconds: number | null | undefined): string | null {
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

async function upsertSubscription(subscription: any, env: StripeEnv) {
  const supabase = getSupabase();
  const item = subscription.items?.data?.[0];
  const priceId = priceIdOf(item);
  const productId = typeof item?.price?.product === "string" ? item.price.product : item?.price?.product?.id;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  const row = {
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer,
    product_id: productId ?? null,
    price_id: priceId ?? null,
    plan_id: planFromPriceId(priceId),
    status: subscription.status,
    access_type: "recurring",
    current_period_start: isoFromUnix(periodStart),
    current_period_end: isoFromUnix(periodEnd),
    cancel_at_period_end: subscription.cancel_at_period_end ?? false,
    environment: env,
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env)
    .maybeSingle();

  if (existing) {
    await supabase.from("subscriptions").update(row).eq("id", (existing as { id: string }).id);
    return;
  }

  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("No userId in subscription metadata", subscription.id);
    return;
  }
  await supabase.from("subscriptions").insert({ ...row, user_id: userId });
}

async function markCanceled(subscription: any, env: StripeEnv) {
  await getSupabase()
    .from("subscriptions")
    .update({
      status: "canceled",
      plan_id: "free",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);
}

/** Mark a pro-rata credit coupon as used so it can't be reused. */
async function consumeCreditCoupon(env: StripeEnv, subscriptionId?: string | null) {
  if (!subscriptionId) return;
  const key = `credit_${env}_${subscriptionId}`;
  const supabase = getSupabase();
  const { data } = await supabase
    .from("payment_events")
    .select("payload")
    .eq("event_id", key)
    .maybeSingle();
  const payload = ((data as { payload?: Record<string, unknown> } | null)?.payload ?? {}) as Record<string, unknown>;
  await supabase
    .from("payment_events")
    .update({ payload: { ...payload, consumed: true } })
    .eq("event_id", key);
}

/** Grant fixed-duration access after a successful one-time (annual) payment. */
async function grantOneTimeAccess(session: any, env: StripeEnv) {
  const meta = session.metadata ?? {};
  const userId = meta.userId;
  const priceId = meta.priceId;
  const days = Number(meta.duration_days ?? 0);
  if (!userId || !days) return; // not an annual upfront purchase

  const supabase = getSupabase();
  const planId = planFromPriceId(priceId);
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id, access_expires_at")
    .eq("payment_provider_ref", session.id)
    .eq("environment", env)
    .maybeSingle();

  const row = {
    user_id: userId,
    stripe_customer_id: session.customer ?? null,
    price_id: priceId ?? null,
    plan_id: planId,
    status: "active",
    access_type: "one_time",
    access_expires_at: expiresAt,
    payment_provider_ref: session.id,
    current_period_start: new Date().toISOString(),
    current_period_end: expiresAt,
    cancel_at_period_end: false,
    environment: env,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    // Idempotent: never extend an already granted access.
    if ((existing as { access_expires_at: string | null }).access_expires_at) return;
    await supabase.from("subscriptions").update(row).eq("id", (existing as { id: string }).id);
  } else {
    await supabase.from("subscriptions").insert(row);
  }

  // Only now cancel the monthly subscription being replaced.
  const replaces = meta.replaces_subscription_id;
  if (replaces) {
    try {
      const stripe = createStripeClient(env);
      await stripe.subscriptions.cancel(replaces);
    } catch (e) {
      console.error("Failed to cancel replaced subscription", replaces, e);
    }
    await supabase
      .from("subscriptions")
      .update({ status: "canceled", plan_id: "free", updated_at: new Date().toISOString() })
      .eq("stripe_subscription_id", replaces)
      .eq("environment", env);
  }
  await consumeCreditCoupon(env, replaces);
}

/**
 * Record a Pix payment awaiting settlement — no access granted yet.
 * O Pix não é oferecido no checkout hoje (conta Stripe irlandesa), mas o
 * processamento de entrada continua ativo de propósito: se um pagamento em Pix
 * chegar (sessão antiga, teste ou conta BR habilitada), o acesso é concedido.
 */

async function recordPendingOneTime(session: any, env: StripeEnv) {
  const meta = session.metadata ?? {};
  if (!meta.userId || !meta.duration_days) return;
  const supabase = getSupabase();
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("payment_provider_ref", session.id)
    .eq("environment", env)
    .maybeSingle();
  if (existing) return;
  await supabase.from("subscriptions").insert({
    user_id: meta.userId,
    stripe_customer_id: session.customer ?? null,
    price_id: meta.priceId ?? null,
    plan_id: "free",
    status: "incomplete",
    access_type: "one_time",
    access_expires_at: null,
    payment_provider_ref: session.id,
    environment: env,
    updated_at: new Date().toISOString(),
  });
}

async function failOneTime(session: any, env: StripeEnv) {
  const meta = session.metadata ?? {};
  if (!meta.userId || !meta.duration_days) return;
  await getSupabase()
    .from("subscriptions")
    .update({ status: "canceled", plan_id: "free", updated_at: new Date().toISOString() })
    .eq("payment_provider_ref", session.id)
    .eq("environment", env)
    .is("access_expires_at", null);
}

/** Returns false when the event was already processed. */
async function logEvent(event: any, env: StripeEnv, eventId: string): Promise<boolean> {
  const { error } = await getSupabase().from("payment_events").insert({
    event_id: eventId,
    event_type: event.type,
    environment: env,
    occurred_at: new Date().toISOString(),
    payload: event as unknown as Record<string, unknown>,
  });
  if (error) {
    // Duplicate primary key => Stripe retry of an already handled event.
    console.log("Event already processed or log failed:", eventId, error.message);
    return false;
  }
  return true;
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env) as any;
  const eventId = event.id ?? crypto.randomUUID();
  const fresh = await logEvent(event, env, eventId);
  if (!fresh) return;

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await upsertSubscription(event.data.object, env);
      break;
    case "customer.subscription.deleted":
      await markCanceled(event.data.object, env);
      break;
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.payment_status === "unpaid") {
        await recordPendingOneTime(session, env);
      } else {
        await grantOneTimeAccess(session, env);
      }
      break;
    }
    case "checkout.session.async_payment_succeeded":
      await grantOneTimeAccess(event.data.object, env);
      break;
    case "checkout.session.async_payment_failed":
    case "checkout.session.expired":
      await failOneTime(event.data.object, env);
      break;
    case "invoice.paid":
      // Subscription state is handled by customer.subscription.* events.
      break;
    default:
      console.log("Unhandled event:", event.type);
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  const rawEnv = new URL(req.url).searchParams.get("env");
  if (rawEnv !== "sandbox" && rawEnv !== "live") {
    console.error("Webhook received with invalid env:", rawEnv);
    return new Response(JSON.stringify({ received: true, ignored: "invalid env" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    await handleWebhook(req, rawEnv);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});
