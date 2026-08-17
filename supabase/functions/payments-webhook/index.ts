import { createClient } from 'npm:@supabase/supabase-js@2';
import { verifyWebhook, EventName, type PaddleEnv } from '../_shared/paddle.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Map Paddle product external_id to our plan_id
const PRODUCT_TO_PLAN: Record<string, string> = {
  profissional: 'profissional',
  escritorio: 'escritorio',
};

function resolvePlanId(productExternalId: string | undefined): string {
  if (!productExternalId) return 'free';
  return PRODUCT_TO_PLAN[productExternalId] || 'free';
}

/** Store the event and tell the caller whether it was already processed. */
async function recordEvent(
  eventId: string | undefined,
  eventType: string,
  env: PaddleEnv,
  subscriptionId: string | undefined,
  occurredAt: string | undefined,
): Promise<boolean> {
  if (!eventId) return false;
  const { error } = await supabase.from('payment_events').insert({
    event_id: eventId,
    event_type: eventType,
    environment: env,
    paddle_subscription_id: subscriptionId ?? null,
    occurred_at: occurredAt ?? new Date().toISOString(),
  });
  // 23505 = duplicate key -> already handled
  if (error && (error as { code?: string }).code === '23505') return true;
  if (error) console.error('payment_events insert failed:', error.message);
  return false;
}

/**
 * Resolve the app user for a subscription. Prefers customData.userId; falls
 * back to matching the Paddle customer email against auth.users, and finally
 * to an existing row for the same Paddle customer.
 */
async function resolveUserId(data: any, env: PaddleEnv): Promise<string | null> {
  const fromCustomData = data?.customData?.userId;
  if (fromCustomData) return fromCustomData as string;

  // Fallback 1: a previous row already links this Paddle customer to a user.
  if (data?.customerId) {
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('paddle_customer_id', data.customerId)
      .eq('environment', env)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing?.user_id) return existing.user_id as string;
  }

  // Fallback 2: look up the customer email in Paddle and match an app user.
  if (data?.customerId) {
    try {
      const { getPaddleClient } = await import('../_shared/paddle.ts');
      const paddle = getPaddleClient(env);
      const customer = await paddle.customers.get(data.customerId);
      const email = (customer as any)?.email?.toLowerCase();
      if (email) {
        const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const match = list?.users?.find((u) => u.email?.toLowerCase() === email);
        if (match) return match.id;
      }
    } catch (e) {
      console.error('Customer email fallback failed:', e instanceof Error ? e.message : e);
    }
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const url = new URL(req.url);
  const env = (url.searchParams.get('env') || 'sandbox') as PaddleEnv;

  try {
    const event = await verifyWebhook(req, env);
    const anyEvent = event as any;
    console.log('Received event:', event.eventType, 'env:', env);

    const already = await recordEvent(
      anyEvent.eventId,
      event.eventType,
      env,
      anyEvent.data?.id,
      anyEvent.occurredAt,
    );
    if (already) {
      console.log('Duplicate event ignored:', anyEvent.eventId);
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    switch (event.eventType) {
      case EventName.SubscriptionCreated:
      case EventName.SubscriptionActivated:
      case EventName.SubscriptionTrialing:
        await upsertSubscription(event.data, env);
        break;
      case EventName.SubscriptionUpdated:
      case EventName.SubscriptionPastDue:
      case EventName.SubscriptionPaused:
      case EventName.SubscriptionResumed:
        await handleSubscriptionUpdated(event.data, env);
        break;
      case EventName.SubscriptionCanceled:
        await handleSubscriptionCanceled(event.data, env);
        break;
      case EventName.TransactionCompleted:
        console.log('Transaction completed:', event.data.id, 'env:', env);
        break;
      case EventName.TransactionPaymentFailed:
        console.log('Payment failed:', event.data.id, 'env:', env);
        break;
      default:
        console.log('Unhandled event:', event.eventType);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('Webhook error:', message);
    return new Response('Webhook error', { status: 400 });
  }
});

async function upsertSubscription(data: any, env: PaddleEnv) {
  const { id, customerId, items, status, currentBillingPeriod, scheduledChange } = data;

  const userId = await resolveUserId(data, env);
  if (!userId) {
    console.error('Could not resolve app user for subscription', id);
    return;
  }

  const item = items?.[0];
  const priceExternalId = item?.price?.importMeta?.externalId;
  const productExternalId = item?.product?.importMeta?.externalId;

  if (!productExternalId) {
    console.warn('Skipping subscription: missing product importMeta.externalId', id);
    return;
  }

  const planId = resolvePlanId(productExternalId);

  const { error } = await supabase.from('subscriptions').upsert({
    user_id: userId,
    plan_id: planId,
    paddle_subscription_id: id,
    paddle_customer_id: customerId,
    product_id: productExternalId,
    price_id: priceExternalId ?? null,
    status: status,
    current_period_start: currentBillingPeriod?.startsAt,
    current_period_end: currentBillingPeriod?.endsAt,
    cancel_at_period_end: scheduledChange?.action === 'cancel',
    environment: env,
    updated_at: new Date().toISOString(),
  }, {
    onConflict: 'paddle_subscription_id',
  });

  if (error) console.error('Subscription upsert failed:', error.message);
}

async function handleSubscriptionUpdated(data: any, env: PaddleEnv) {
  const { id, status, currentBillingPeriod, scheduledChange, items } = data;

  const item = items?.[0];
  const productExternalId = item?.product?.importMeta?.externalId;

  // If we have never seen this subscription, create the row instead of
  // silently dropping the update (e.g. the created event was missed).
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('paddle_subscription_id', id)
    .maybeSingle();

  if (!existing) {
    await upsertSubscription(data, env);
    return;
  }

  const patch: Record<string, unknown> = {
    status: status,
    current_period_start: currentBillingPeriod?.startsAt,
    current_period_end: currentBillingPeriod?.endsAt,
    cancel_at_period_end: scheduledChange?.action === 'cancel',
    updated_at: new Date().toISOString(),
  };

  // Only rewrite the plan when the payload actually carries a known product.
  if (productExternalId) {
    patch.plan_id = resolvePlanId(productExternalId);
    patch.product_id = productExternalId;
    patch.price_id = item?.price?.importMeta?.externalId ?? null;
  }

  const { error } = await supabase.from('subscriptions')
    .update(patch)
    .eq('paddle_subscription_id', id)
    .eq('environment', env);

  if (error) console.error('Subscription update failed:', error.message);
}

async function handleSubscriptionCanceled(data: any, env: PaddleEnv) {
  // Keep plan_id so the user retains access until current_period_end.
  // get_user_plan() gives grace period access for status='canceled' rows.
  await supabase.from('subscriptions')
    .update({
      status: 'canceled',
      cancel_at_period_end: true,
      current_period_end: data?.currentBillingPeriod?.endsAt ?? data?.canceledAt ?? undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', data.id)
    .eq('environment', env);
}
