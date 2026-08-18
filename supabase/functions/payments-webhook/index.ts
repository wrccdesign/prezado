import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, verifyWebhook, planFromPriceId } from "../_shared/stripe.ts";

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

async function logEvent(event: { type: string; data: { object: any } }, env: StripeEnv, eventId: string) {
  try {
    await getSupabase().from("payment_events").insert({
      event_id: eventId,
      event_type: event.type,
      environment: env,
      occurred_at: new Date().toISOString(),
      payload: event as unknown as Record<string, unknown>,
    });
  } catch (e) {
    console.error("Failed to log payment event", e);
  }
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env) as any;
  await logEvent(event, env, event.id ?? crypto.randomUUID());

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await upsertSubscription(event.data.object, env);
      break;
    case "customer.subscription.deleted":
      await markCanceled(event.data.object, env);
      break;
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
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
