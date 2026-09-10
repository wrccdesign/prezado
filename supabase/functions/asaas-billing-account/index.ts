import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  type AsaasEnv,
  cancelSubscription,
  getPayment,
  getSubscription,
  listCustomerPayments,
  listCustomerSubscriptions,
  planFromPriceId,
  resolveAsaasEnv,
  updateSubscriptionValue,
  type PriceId,
  PLAN_CONFIG,
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

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface SubscriptionSummary {
  id: string;
  planId: string;
  status: string;
  environment: string;
  provider: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  accessType: string;
  accessExpiresAt: string | null;
  priceId: string | null;
  nextPaymentUrl?: string;
}

async function getSummary(userId: string, env: AsaasEnv): Promise<SubscriptionSummary[]> {
  const { data } = await getSupabase()
    .from("subscriptions")
    .select("id, plan_id, status, environment, provider, current_period_end, cancel_at_period_end, access_type, access_expires_at, price_id, provider_subscription_id, payment_provider_ref, provider_customer_id")
    .eq("user_id", userId)
    .eq("environment", env)
    .order("created_at", { ascending: false });

  if (!data) return [];

  const summaries: SubscriptionSummary[] = [];
  for (const row of data) {
    let nextPaymentUrl: string | undefined;
    if (row.provider === "asaas") {
      try {
        if (row.provider_subscription_id) {
          const sub = await getSubscription(env, row.provider_subscription_id);
          nextPaymentUrl = sub.nextDueDate
            ? `https://${env === "sandbox" ? "sandbox." : ""}asaas.com/i/${row.provider_subscription_id}`
            : undefined;
        } else if (row.payment_provider_ref) {
          const payment = await getPayment(env, row.payment_provider_ref);
          nextPaymentUrl = payment.invoiceUrl || undefined;
        }
      } catch {
        // ignore
      }
    }

    summaries.push({
      id: row.id as string,
      planId: row.plan_id as string,
      status: row.status as string,
      environment: row.environment as string,
      provider: row.provider as string,
      currentPeriodEnd: row.current_period_end as string | null,
      cancelAtPeriodEnd: row.cancel_at_period_end as boolean,
      accessType: row.access_type as string,
      accessExpiresAt: row.access_expires_at as string | null,
      priceId: row.price_id as string | null,
      nextPaymentUrl,
    });
  }

  return summaries;
}

async function getPaymentMethods(userId: string, env: AsaasEnv) {
  const { data } = await getSupabase()
    .from("subscriptions")
    .select("provider_customer_id")
    .eq("user_id", userId)
    .eq("environment", env)
    .eq("provider", "asaas")
    .limit(1)
    .single();

  const customerId = data?.provider_customer_id as string | undefined;
  if (!customerId) return [];

  try {
    const payments = await listCustomerPayments(env, customerId);
    return payments
      .filter((p) => p.status === "RECEIVED" || p.status === "CONFIRMED")
      .map((p) => ({
        id: p.id,
        value: p.value,
        date: p.dueDate,
        url: p.invoiceUrl,
        billingType: p.billingType,
      }));
  } catch {
    return [];
  }
}

async function getInvoices(userId: string, env: AsaasEnv) {
  const { data } = await getSupabase()
    .from("subscriptions")
    .select("provider_customer_id")
    .eq("user_id", userId)
    .eq("environment", env)
    .eq("provider", "asaas")
    .limit(1)
    .single();

  const customerId = data?.provider_customer_id as string | undefined;
  if (!customerId) return [];

  try {
    const payments = await listCustomerPayments(env, customerId);
    return payments.map((p) => ({
      id: p.id,
      value: p.value,
      status: p.status,
      date: p.dueDate,
      url: p.invoiceUrl,
      billingType: p.billingType,
    }));
  } catch {
    return [];
  }
}

async function cancelLocalSubscription(userId: string, env: AsaasEnv, subscriptionId?: string) {
  const query = getSupabase()
    .from("subscriptions")
    .select("provider_subscription_id, status, plan_id, id")
    .eq("user_id", userId)
    .eq("environment", env);

  const { data } = subscriptionId
    ? await query.eq("provider_subscription_id", subscriptionId)
    : await query.in("status", ["active", "trialing", "past_due"]);

  for (const row of data ?? []) {
    if (row.provider_subscription_id) {
      try {
        await cancelSubscription(env, row.provider_subscription_id);
      } catch {
        // continue local update
      }
    }
    await getSupabase()
      .from("subscriptions")
      .update({ status: "canceled", cancel_at_period_end: true, updated_at: new Date().toISOString() })
      .eq("id", row.id);
  }

  return { ok: true };
}

async function userOwnsSubscription(userId: string, env: AsaasEnv, subscriptionId: string) {
  const { data } = await getSupabase()
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .eq("environment", env)
    .eq("provider", "asaas")
    .eq("provider_subscription_id", subscriptionId)
    .limit(1)
    .maybeSingle();
  return Boolean(data?.id);
}

async function estimateCredit(subscriptionId: string, env: AsaasEnv, newPriceId: PriceId) {
  const sub = await getSubscription(env, subscriptionId);
  const newValue = PLAN_CONFIG[newPriceId].valueCents / 100;
  const currentValue = sub.value || 0;
  const remainingRatio = 0.5; // simplificação; idealmente calcular dias restantes
  const credit = Math.max(0, currentValue * remainingRatio);
  const chargeNow = Math.max(0, newValue - credit);
  return { credit: Math.round(credit * 100) / 100, chargeNow: Math.round(chargeNow * 100) / 100 };
}

async function changePlan(
  userId: string,
  env: AsaasEnv,
  newPriceId: PriceId,
) {
  const { data } = await getSupabase()
    .from("subscriptions")
    .select("provider_subscription_id, provider_customer_id, id")
    .eq("user_id", userId)
    .eq("environment", env)
    .eq("provider", "asaas")
    .in("status", ["active", "trialing", "past_due"])
    .limit(1)
    .single();

  if (!data?.provider_subscription_id) {
    return { error: "Nenhuma assinatura ativa para alterar" };
  }

  const newValue = PLAN_CONFIG[newPriceId].valueCents;
  await updateSubscriptionValue(env, data.provider_subscription_id, newValue);

  await getSupabase()
    .from("subscriptions")
    .update({
      plan_id: planFromPriceId(newPriceId),
      price_id: newPriceId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.id);

  return { ok: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await getSupabase().auth.getUser(token ?? "");
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const env: AsaasEnv = resolveAsaasEnv(req);
    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    switch (action) {
      case "summary": {
        const subscriptions = await getSummary(user.id, env);
        const paymentMethods = await getPaymentMethods(user.id, env);
        const invoices = await getInvoices(user.id, env);
        return json({ subscriptions, paymentMethods, invoices });
      }
      case "cancel": {
        const result = await cancelLocalSubscription(user.id, env, body?.subscriptionId);
        return json(result);
      }
      case "estimate-credit": {
        if (!body?.subscriptionId || !body?.newPriceId) {
          return json({ error: "subscriptionId e newPriceId são obrigatórios" }, 400);
        }
        if (!PLAN_CONFIG[body.newPriceId as PriceId]) {
          return json({ error: "newPriceId inválido" }, 400);
        }
        if (!(await userOwnsSubscription(user.id, env, body.subscriptionId))) {
          return json({ error: "Assinatura não pertence a este usuário" }, 403);
        }
        const result = await estimateCredit(body.subscriptionId, env, body.newPriceId);
        return json(result);
      }
      case "change-plan": {
        if (!body?.newPriceId || !PLAN_CONFIG[body.newPriceId as PriceId]) {
          return json({ error: "newPriceId inválido" }, 400);
        }
        const result = await changePlan(user.id, env, body.newPriceId);
        return json(result);
      }
      default:
        return json({ error: "Ação desconhecida" }, 400);
    }
  } catch (error) {
    console.error("asaas-billing-account error:", error);
    return json({ error: error instanceof Error ? error.message : "Erro na conta" }, 400);
  }
});
