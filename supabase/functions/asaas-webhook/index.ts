import { createClient } from "npm:@supabase/supabase-js@2";
import {
  type AsaasEnv,
  getPayment,
  getSubscription,
  matchWebhookEnv,
  planFromPriceId,
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

/**
 * Extrai o priceId de um externalReference, que pode vir como
 * `priceId` (cobrança direta) ou `${userId}:${priceId}` (checkout).
 */
function parsePriceRef(ref?: string | null): { userId?: string; priceId?: string } {
  if (!ref) return {};
  const parts = ref.split(":");
  if (parts.length === 2) return { userId: parts[0], priceId: parts[1] };
  return { priceId: ref };
}

type LogResult = "new" | "duplicate";

async function logEvent(event: any, env: AsaasEnv, eventId: string): Promise<LogResult> {
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
    if ((error as { code?: string }).code === "23505") {
      const { data: existing, error: readError } = await getSupabase()
        .from("payment_events")
        .select("processed_at")
        .eq("event_id", eventId)
        .maybeSingle();
      if (readError) {
        console.error("Failed to inspect Asaas event:", eventId, readError.message);
        throw new Error(`event lookup failed: ${readError.message}`);
      }
      if (existing?.processed_at) {
        console.log("Processed Asaas event ignored:", eventId);
        return "duplicate";
      }
      console.log("Retrying unprocessed Asaas event:", eventId);
      return "new";
    }
    console.error("Failed to log Asaas event:", eventId, error.message);
    throw new Error(`log failed: ${error.message}`);
  }
  return "new";
}

async function markEventProcessed(eventId: string): Promise<void> {
  const { error } = await getSupabase()
    .from("payment_events")
    .update({ processed_at: new Date().toISOString() })
    .eq("event_id", eventId)
    .is("processed_at", null);
  if (error) {
    console.error("Failed to mark Asaas event processed:", eventId, error.message);
    throw new Error(`event completion failed: ${error.message}`);
  }
}

async function activateRecurringSubscription(
  subscriptionId: string,
  env: AsaasEnv,
  payment?: any,
) {
  const sub = await getSubscription(env, subscriptionId);
  const ref = parsePriceRef(sub.externalReference);
  const priceId = ref.priceId;
  const planId = planFromPriceId(priceId);

  // Localiza user_id pelo externalReference do checkout ou pelo customer
  const { data: rows } = await getSupabase()
    .from("subscriptions")
    .select("user_id")
    .eq("provider_customer_id", sub.customer)
    .eq("provider", "asaas")
    .eq("environment", env)
    .limit(1);
  const userId = ref.userId || (rows?.[0]?.user_id as string | undefined);
  if (!userId) {
    throw new Error(`No user_id found for Asaas customer ${sub.customer}`);
  }

  const start = new Date().toISOString();
  const end = sub.nextDueDate
    ? new Date(sub.nextDueDate + "T23:59:59").toISOString()
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await getSupabase().from("subscriptions").upsert({
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
  if (error) throw new Error(`recurring subscription update failed: ${error.message}`);
}

async function activateOneTimePayment(paymentId: string, env: AsaasEnv) {
  const payment = await getPayment(env, paymentId);
  const ref = parsePriceRef(payment.externalReference);
  const priceId = ref.priceId;
  const planId = planFromPriceId(priceId);

  const { data: rows } = await getSupabase()
    .from("subscriptions")
    .select("user_id")
    .eq("provider_customer_id", payment.customer)
    .eq("provider", "asaas")
    .eq("environment", env)
    .limit(1);
  const userId = ref.userId || (rows?.[0]?.user_id as string | undefined);
  if (!userId) {
    throw new Error(`No user_id found for Asaas customer ${payment.customer}`);
  }

  const start = new Date().toISOString();
  const end = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await getSupabase().from("subscriptions").upsert({
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
  if (error) throw new Error(`one-time subscription update failed: ${error.message}`);
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

async function handleWebhook(event: any, env: AsaasEnv) {
  const eventId = `asaas_${event.id}`;
  const result = await logEvent(event, env, eventId);
  if (result === "duplicate") return;

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

  await markEventProcessed(eventId);
}

const jsonResponse = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // O ambiente vem do token, nunca da URL.
  const token = req.headers.get("asaas-access-token") || "";
  const env = await matchWebhookEnv(token);
  if (!env) {
    return jsonResponse({ received: false, error: "unauthorized" }, 401);
  }

  const event = await req.json().catch(() => null);
  if (!event || typeof event !== "object") {
    return jsonResponse({ received: false, error: "invalid payload" }, 400);
  }
  if (!event.id || typeof event.id !== "string") {
    console.error("Asaas event without id:", JSON.stringify(event).slice(0, 300));
    return jsonResponse({ received: false, error: "missing event id" }, 500);
  }

  try {
    await handleWebhook(event, env);
    return jsonResponse({ received: true }, 200);
  } catch (e) {
    console.error("asaas-webhook error:", e);
    return jsonResponse({ received: false, error: "processing failed" }, 500);
  }
});
