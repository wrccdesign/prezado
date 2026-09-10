import { createClient } from "npm:@supabase/supabase-js@2";
import {
  type AsaasEnv,
  getPayment,
  getSubscription,
  getWebhookToken,
  planFromPriceId,
  resolveAsaasEnv,
} from "../_shared/asaas.ts";

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

function isoDate(date?: string | null): string | null {
  if (!date) return null;
  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

async function logEvent(event: any, env: AsaasEnv, eventId: string): Promise<boolean> {
  const { error } = await getSupabase().from("payment_events").insert({
    event_id: eventId,
    event_type: event.event || "unknown",
    environment: env,
    occurred_at: event.date ? new Date(event.date).toISOString() : new Date().toISOString(),
    provider: "asaas",
    provider_subscription_id: event.subscription?.id || event.payment?.subscription || null,
    payload: event as unknown as Record<string, unknown>,
  });
  if (error) {
    console.log("Event already processed or log failed:", eventId, error.message);
    return false;
  }
  return true;
}

async function activateRecurringSubscription(
  subscriptionId: string,
  env: AsaasEnv,
  payment?: any,
) {
  const sub = await getSubscription(env, subscriptionId);
  const priceId = sub.externalReference;
  const planId = planFromPriceId(priceId);

  // Localiza user_id pelo customer
  const { data: rows } = await getSupabase()
    .from("subscriptions")
    .select("user_id")
    .eq("provider_customer_id", sub.customer)
    .eq("provider", "asaas")
    .eq("environment", env)
    .limit(1);
  const userId = rows?.[0]?.user_id as string | undefined;
  if (!userId) {
    console.error("No user_id found for Asaas customer", sub.customer);
    return;
  }

  const start = new Date().toISOString();
  const end = sub.nextDueDate
    ? new Date(sub.nextDueDate + "T23:59:59").toISOString()
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await getSupabase().from("subscriptions").upsert({
    user_id: userId,
    provider: "asaas",
    provider_customer_id: sub.customer,
    provider_subscription_id: sub.id,
    plan_id: planId,
    price_id: priceId,
    status: sub.status === "ACTIVE" ? "active" : "incomplete",
    access_type: "recurring",
    current_period_start: start,
    current_period_end: end,
    cancel_at_period_end: false,
    environment: env,
    updated_at: new Date().toISOString(),
  }, { onConflict: "provider_subscription_id,provider,environment" });
}

async function activateOneTimePayment(paymentId: string, env: AsaasEnv) {
  const payment = await getPayment(env, paymentId);
  const priceId = payment.externalReference;
  const planId = planFromPriceId(priceId);

  const { data: rows } = await getSupabase()
    .from("subscriptions")
    .select("user_id")
    .eq("provider_customer_id", payment.customer)
    .eq("provider", "asaas")
    .eq("environment", env)
    .limit(1);
  const userId = rows?.[0]?.user_id as string | undefined;
  if (!userId) {
    console.error("No user_id found for Asaas customer", payment.customer);
    return;
  }

  const start = new Date().toISOString();
  const end = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  await getSupabase().from("subscriptions").upsert({
    user_id: userId,
    provider: "asaas",
    provider_customer_id: payment.customer,
    payment_provider_ref: payment.id,
    plan_id: planId,
    price_id: priceId,
    status: "active",
    access_type: "one_time",
    access_expires_at: end,
    current_period_start: start,
    current_period_end: end,
    cancel_at_period_end: false,
    environment: env,
    updated_at: new Date().toISOString(),
  }, { onConflict: "payment_provider_ref,environment" });
}

async function markSubscriptionCanceled(subscriptionId: string, env: AsaasEnv) {
  await getSupabase()
    .from("subscriptions")
    .update({ status: "canceled", plan_id: "free", updated_at: new Date().toISOString() })
    .eq("provider_subscription_id", subscriptionId)
    .eq("provider", "asaas")
    .eq("environment", env);
}

async function markPaymentFailed(paymentId: string, env: AsaasEnv) {
  await getSupabase()
    .from("subscriptions")
    .update({ status: "canceled", plan_id: "free", updated_at: new Date().toISOString() })
    .eq("payment_provider_ref", paymentId)
    .eq("provider", "asaas")
    .eq("environment", env);
}

async function markPastDue(subscriptionId: string, env: AsaasEnv) {
  await getSupabase()
    .from("subscriptions")
    .update({ status: "past_due", updated_at: new Date().toISOString() })
    .eq("provider_subscription_id", subscriptionId)
    .eq("provider", "asaas")
    .eq("environment", env);
}

async function renewSubscription(subscriptionId: string, env: AsaasEnv) {
  const sub = await getSubscription(env, subscriptionId);
  const end = sub.nextDueDate
    ? new Date(sub.nextDueDate + "T23:59:59").toISOString()
    : null;
  if (!end) return;
  await getSupabase()
    .from("subscriptions")
    .update({ current_period_end: end, updated_at: new Date().toISOString() })
    .eq("provider_subscription_id", subscriptionId)
    .eq("provider", "asaas")
    .eq("environment", env);
}

async function handleWebhook(req: Request, env: AsaasEnv) {
  const event = await req.json().catch(() => ({}));
  const eventId = event.id || crypto.randomUUID();
  const fresh = await logEvent(event, env, eventId);
  if (!fresh) return;

  const eventType = event.event as string | undefined;
  const payment = event.payment as any;
  const subscription = event.subscription as any;

  switch (eventType) {
    case "PAYMENT_RECEIVED":
    case "PAYMENT_CONFIRMED":
      if (payment?.subscription) {
        await activateRecurringSubscription(payment.subscription, env, payment);
      } else if (payment?.id) {
        await activateOneTimePayment(payment.id, env);
      }
      break;
    case "PAYMENT_OVERDUE":
      if (payment?.subscription) {
        await markPastDue(payment.subscription, env);
      }
      break;
    case "PAYMENT_DELETED":
    case "PAYMENT_REFUNDED":
      if (payment?.subscription) {
        await markSubscriptionCanceled(payment.subscription, env);
      } else if (payment?.id) {
        await markPaymentFailed(payment.id, env);
      }
      break;
    case "SUBSCRIPTION_CANCELLED":
      if (subscription?.id) {
        await markSubscriptionCanceled(subscription.id, env);
      }
      break;
    case "SUBSCRIPTION_RENEWED":
      if (subscription?.id) {
        await renewSubscription(subscription.id, env);
      }
      break;
    default:
      console.log("Unhandled Asaas event:", eventType);
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const rawEnv = url.searchParams.get("env");
  if (rawEnv !== "sandbox" && rawEnv !== "live") {
    return new Response(JSON.stringify({ received: true, ignored: "invalid env" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = url.searchParams.get("token") || req.headers.get("X-Asaas-Token") || "";
  if (token !== getWebhookToken()) {
    return new Response(JSON.stringify({ received: false, error: "unauthorized" }), {
      status: 401,
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
    console.error("asaas-webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});
