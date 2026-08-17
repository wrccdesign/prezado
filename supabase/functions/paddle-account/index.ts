import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getPaddleClient, gatewayFetch } from "../_shared/paddle.ts";
import { resolvePaymentEnv, type PaddleEnv } from "../_shared/payment-env.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-payment-env, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLAN_BY_PRODUCT: Record<string, string> = {
  profissional: "profissional",
  escritorio: "escritorio",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function resolvePaddlePriceId(priceExternalId: string, env: PaddleEnv): Promise<string> {
  const res = await gatewayFetch(env, `/prices?external_id=${encodeURIComponent(priceExternalId)}`);
  const data = await res.json();
  if (!data.data?.length) throw new Error(`Preço não encontrado: ${priceExternalId}`);
  return data.data[0].id;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Não autenticado" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const token = authHeader.slice("Bearer ".length);
    const { data: { user }, error: userError } = await admin.auth.getUser(token);
    if (userError || !user) return json({ error: "Não autenticado" }, 401);

    const env = resolvePaymentEnv(req);
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const action: string = body.action || "summary";

    const { data: sub } = await admin
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("environment", env)
      .not("paddle_subscription_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const paddle = getPaddleClient(env);

    if (action === "summary") {
      if (!sub?.paddle_subscription_id) {
        // No Paddle-backed subscription: fall back to whatever plan is stored
        // locally for this environment (e.g. admin-granted access).
        const { data: localSub } = await admin
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .eq("environment", env)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (localSub && localSub.plan_id !== "free") {
          return json({
            environment: env,
            plan_id: localSub.plan_id,
            subscription: {
              id: localSub.id,
              status: localSub.status,
              plan_id: localSub.plan_id,
              current_period_start: localSub.current_period_start,
              current_period_end: localSub.current_period_end,
              next_billed_at: null,
              cancel_at_period_end: localSub.cancel_at_period_end ?? false,
              scheduled_change: null,
            },
            invoices: [],
          });
        }

        return json({ environment: env, plan_id: "free", subscription: null, invoices: [] });
      }


      let remote: any = null;
      try {
        remote = await paddle.subscriptions.get(sub.paddle_subscription_id);
      } catch (e) {
        console.error("subscription fetch failed:", e instanceof Error ? e.message : e);
      }

      let invoices: unknown[] = [];
      if (sub.paddle_customer_id) {
        try {
          const res = await gatewayFetch(
            env,
            `/transactions?customer_id=${encodeURIComponent(sub.paddle_customer_id)}&per_page=20&order_by=created_at[DESC]`,
          );
          const data = await res.json();
          invoices = (data.data || [])
            .filter((t: any) => ["completed", "billed", "past_due"].includes(t.status))
            .map((t: any) => ({
              id: t.id,
              invoice_number: t.invoice_number,
              status: t.status,
              billed_at: t.billed_at || t.created_at,
              currency: t.details?.totals?.currency_code || t.currency_code,
              total: t.details?.totals?.total,
            }));
        } catch (e) {
          console.error("transactions fetch failed:", e instanceof Error ? e.message : e);
        }
      }

      return json({
        environment: env,
        plan_id: sub.plan_id,
        subscription: {
          id: sub.paddle_subscription_id,
          status: remote?.status ?? sub.status,
          plan_id: sub.plan_id,
          current_period_start: remote?.currentBillingPeriod?.startsAt ?? sub.current_period_start,
          current_period_end: remote?.currentBillingPeriod?.endsAt ?? sub.current_period_end,
          next_billed_at: remote?.nextBilledAt ?? null,
          cancel_at_period_end:
            remote?.scheduledChange?.action === "cancel" || sub.cancel_at_period_end,
          scheduled_change: remote?.scheduledChange ?? null,
        },
        invoices,
      });
    }

    if (!sub?.paddle_subscription_id) {
      return json({ error: "Nenhuma assinatura ativa encontrada." }, 404);
    }

    if (action === "cancel") {
      // Cancellation always takes effect at the end of the paid period.
      await paddle.subscriptions.cancel(sub.paddle_subscription_id, {
        effectiveFrom: "next_billing_period",
      } as any);
      await admin.from("subscriptions")
        .update({ cancel_at_period_end: true, updated_at: new Date().toISOString() })
        .eq("paddle_subscription_id", sub.paddle_subscription_id);
      return json({ ok: true, message: "Cancelamento agendado para o fim do período." });
    }

    if (action === "resume") {
      // Remove the scheduled cancellation.
      await paddle.subscriptions.update(sub.paddle_subscription_id, {
        scheduledChange: null,
      } as any);
      await admin.from("subscriptions")
        .update({ cancel_at_period_end: false, updated_at: new Date().toISOString() })
        .eq("paddle_subscription_id", sub.paddle_subscription_id);
      return json({ ok: true, message: "Assinatura reativada." });
    }

    if (action === "change-plan") {
      const priceExternalId: string = body.priceId;
      if (!priceExternalId) return json({ error: "priceId obrigatório" }, 400);

      const productExternalId = priceExternalId.replace(/_mensal$/, "");
      const targetPlan = PLAN_BY_PRODUCT[productExternalId];
      if (!targetPlan) return json({ error: "Plano inválido" }, 400);
      if (targetPlan === sub.plan_id) return json({ error: "Você já está neste plano." }, 400);

      const paddlePriceId = await resolvePaddlePriceId(priceExternalId, env);
      const isUpgrade = targetPlan === "escritorio" && sub.plan_id === "profissional";

      const updated: any = await paddle.subscriptions.update(sub.paddle_subscription_id, {
        items: [{ priceId: paddlePriceId, quantity: 1 }],
        // Upgrade bills the prorated difference immediately; downgrade applies
        // at the next renewal so the user keeps what they paid for.
        prorationBillingMode: isUpgrade ? "prorated_immediately" : "do_not_bill",
      } as any);

      if (isUpgrade) {
        await admin.from("subscriptions").update({
          plan_id: targetPlan,
          product_id: productExternalId,
          price_id: priceExternalId,
          status: updated?.status ?? sub.status,
          current_period_start: updated?.currentBillingPeriod?.startsAt ?? sub.current_period_start,
          current_period_end: updated?.currentBillingPeriod?.endsAt ?? sub.current_period_end,
          updated_at: new Date().toISOString(),
        }).eq("paddle_subscription_id", sub.paddle_subscription_id);
      }

      return json({
        ok: true,
        immediate: isUpgrade,
        message: isUpgrade
          ? "Upgrade aplicado. A diferença proporcional foi cobrada."
          : "Mudança agendada para a próxima renovação.",
      });
    }

    return json({ error: "Ação desconhecida" }, 400);
  } catch (e) {
    console.error("paddle-account error:", e);
    return json({ error: e instanceof Error ? e.message : "Erro desconhecido" }, 500);
  }
});
