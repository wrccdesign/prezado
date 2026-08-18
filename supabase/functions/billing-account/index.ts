import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient, planFromPriceId } from "../_shared/stripe.ts";
import { resolvePaymentEnv } from "../_shared/payment-env.ts";

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

function isoFromUnix(seconds: number | null | undefined): string | null {
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

async function findCustomerIds(
  stripe: ReturnType<typeof createStripeClient>,
  userId: string,
  email?: string,
): Promise<string[]> {
  if (!/^[a-zA-Z0-9_-]+$/.test(userId)) throw new Error("Invalid userId");
  const ids = new Set<string>();
  const customers = await stripe.customers.search({
    query: `metadata['userId']:'${userId}'`,
    limit: 100,
  });
  for (const c of customers.data) ids.add(c.id);
  if (ids.size === 0 && email) {
    const byEmail = await stripe.customers.list({ email, limit: 100 });
    for (const c of byEmail.data) ids.add(c.id);
  }
  return [...ids];
}

async function activeStripeSubscription(
  stripe: ReturnType<typeof createStripeClient>,
  customerIds: string[],
) {
  for (const customerId of customerIds) {
    const list = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 20 });
    const relevant = list.data
      .filter((s) => !["incomplete_expired", "canceled"].includes(s.status))
      .sort((a, b) => (b.created ?? 0) - (a.created ?? 0));
    if (relevant.length) return relevant[0];
  }
  return null;
}

async function buildSummary(userId: string, email: string | undefined, env: StripeEnv) {
  // Local fallback (also covers manual/admin grants).
  const { data: localRows } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("environment", env)
    .order("created_at", { ascending: false });

  const rows = (localRows ?? []) as any[];
  const localPaid = rows.find((r) =>
    r.plan_id && r.plan_id !== "free" && (r.access_type ?? "recurring") === "recurring"
  ) ?? null;

  // Annual access paid upfront (Pix/card), still valid.
  const oneTime = rows.find((r) =>
    (r.access_type ?? "recurring") === "one_time" &&
    r.plan_id && r.plan_id !== "free" &&
    r.access_expires_at && new Date(r.access_expires_at) > new Date()
  ) ?? null;

  let stripeSub: any = null;
  let invoices: any[] = [];
  try {
    const stripe = createStripeClient(env);
    const customerIds = await findCustomerIds(stripe, userId, email);
    stripeSub = await activeStripeSubscription(stripe, customerIds);
    for (const customerId of customerIds) {
      const list = await stripe.invoices.list({ customer: customerId, limit: 10 });
      invoices.push(...list.data);
    }
  } catch (e) {
    console.error("Stripe read failed, falling back to local data:", e);
  }

  const item = stripeSub?.items?.data?.[0];
  const priceId = item?.price?.lookup_key || item?.price?.metadata?.lovable_external_id;
  const periodStart = item?.current_period_start ?? stripeSub?.current_period_start;
  const periodEnd = item?.current_period_end ?? stripeSub?.current_period_end;

  const recurring = stripeSub
    ? {
      id: stripeSub.id,
      status: stripeSub.status,
      plan_id: planFromPriceId(priceId),
      access_type: "recurring" as const,
      access_expires_at: null as string | null,
      current_period_start: isoFromUnix(periodStart),
      current_period_end: isoFromUnix(periodEnd),
      next_billed_at: isoFromUnix(periodEnd),
      cancel_at_period_end: stripeSub.cancel_at_period_end ?? false,
    }
    : localPaid
    ? {
      id: localPaid.stripe_subscription_id ?? localPaid.id,
      status: localPaid.status,
      plan_id: localPaid.plan_id,
      access_type: "recurring" as const,
      access_expires_at: null as string | null,
      current_period_start: localPaid.current_period_start,
      current_period_end: localPaid.current_period_end,
      next_billed_at: localPaid.current_period_end,
      cancel_at_period_end: localPaid.cancel_at_period_end ?? false,
    }
    : null;

  const annual = oneTime
    ? {
      id: oneTime.payment_provider_ref ?? oneTime.id,
      status: "active",
      plan_id: oneTime.plan_id,
      access_type: "one_time" as const,
      access_expires_at: oneTime.access_expires_at as string,
      current_period_start: oneTime.current_period_start,
      current_period_end: oneTime.access_expires_at,
      next_billed_at: null,
      cancel_at_period_end: false,
    }
    : null;

  const rank = (p?: string) => (p === "escritorio" ? 2 : p === "profissional" ? 1 : 0);
  // Highest active tier wins; ties prefer the annual (no further charges).
  const subscription = annual && recurring
    ? (rank(annual.plan_id) >= rank(recurring.plan_id) ? annual : recurring)
    : annual ?? recurring;

  return {
    environment: env,
    plan_id: subscription?.plan_id ?? "free",
    subscription,
    recurring_subscription: recurring,

    invoices: invoices
      .sort((a, b) => (b.created ?? 0) - (a.created ?? 0))
      .slice(0, 10)
      .map((inv) => ({
        id: inv.id,
        invoice_number: inv.number ?? null,
        status: inv.status ?? "unknown",
        billed_at: isoFromUnix(inv.created),
        currency: (inv.currency ?? "brl").toUpperCase(),
        total: String(inv.amount_paid ?? inv.total ?? 0),
        pdf_url: inv.invoice_pdf ?? null,
      })),
  };
}

async function requireStripeSubscription(userId: string, email: string | undefined, env: StripeEnv) {
  const stripe = createStripeClient(env);
  const customerIds = await findCustomerIds(stripe, userId, email);
  const sub = await activeStripeSubscription(stripe, customerIds);
  if (!sub) throw new Error("Nenhuma assinatura ativa encontrada.");
  return { stripe, sub };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token ?? "");
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const env = resolvePaymentEnv(req);
    const body = await req.json().catch(() => ({}));
    const action = typeof body?.action === "string" ? body.action : "summary";
    const email = user.email ?? undefined;

    if (action === "summary") {
      return json(await buildSummary(user.id, email, env));
    }

    if (action === "cancel") {
      const { stripe, sub } = await requireStripeSubscription(user.id, email, env);
      await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true });
      await supabase.from("subscriptions")
        .update({ cancel_at_period_end: true, updated_at: new Date().toISOString() })
        .eq("stripe_subscription_id", sub.id).eq("environment", env);
      return json({ message: "Assinatura cancelada. Você mantém o acesso até o fim do período." });
    }

    if (action === "resume") {
      const { stripe, sub } = await requireStripeSubscription(user.id, email, env);
      await stripe.subscriptions.update(sub.id, { cancel_at_period_end: false });
      await supabase.from("subscriptions")
        .update({ cancel_at_period_end: false, updated_at: new Date().toISOString() })
        .eq("stripe_subscription_id", sub.id).eq("environment", env);
      return json({ message: "Assinatura reativada." });
    }

    if (action === "change-plan") {
      const priceId = typeof body?.priceId === "string" ? body.priceId : "";
      if (!/^[a-zA-Z0-9_-]+$/.test(priceId)) return json({ error: "priceId inválido" }, 400);
      const { stripe, sub } = await requireStripeSubscription(user.id, email, env);
      const prices = await stripe.prices.list({ lookup_keys: [priceId] });
      if (!prices.data.length) return json({ error: "Plano não encontrado" }, 400);
      const item = sub.items.data[0];
      await stripe.subscriptions.update(sub.id, {
        items: [{ id: item.id, price: prices.data[0].id }],
        proration_behavior: "create_prorations",
      });
      await supabase.from("subscriptions")
        .update({
          price_id: priceId,
          plan_id: planFromPriceId(priceId),
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", sub.id).eq("environment", env);
      return json({ message: "Plano atualizado com sucesso." });
    }

    return json({ error: "Ação desconhecida" }, 400);
  } catch (error) {
    console.error("billing-account error:", error);
    return json({ error: error instanceof Error ? error.message : "Erro inesperado" }, 400);
  }
});
