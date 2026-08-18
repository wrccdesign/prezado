import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createStripeClient } from "../_shared/stripe.ts";
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token ?? "");
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const env = resolvePaymentEnv(req);
    const stripe = createStripeClient(env);

    if (!/^[a-zA-Z0-9_-]+$/.test(user.id)) return json({ error: "Invalid user" }, 400);
    let customerId: string | null = null;
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${user.id}'`,
      limit: 1,
    });
    if (found.data.length) customerId = found.data[0].id;
    if (!customerId && user.email) {
      const byEmail = await stripe.customers.list({ email: user.email, limit: 1 });
      if (byEmail.data.length) customerId = byEmail.data[0].id;
    }
    if (!customerId) {
      const { data: row } = await supabase
        .from("subscriptions")
        .select("stripe_customer_id")
        .eq("user_id", user.id)
        .eq("environment", env)
        .not("stripe_customer_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      customerId = (row as { stripe_customer_id?: string } | null)?.stripe_customer_id ?? null;
    }
    if (!customerId) return json({ error: "Nenhuma assinatura encontrada." }, 400);

    const body = await req.json().catch(() => ({}));
    const origin = req.headers.get("origin") || "https://honorifico.com.br";
    const returnUrl = typeof body?.returnUrl === "string" && body.returnUrl.startsWith(origin)
      ? body.returnUrl
      : `${origin}/conta`;

    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return json({ url: portal.url });
  } catch (error) {
    console.error("create-portal-session error:", error);
    return json({ error: error instanceof Error ? error.message : "Erro ao abrir portal" }, 400);
  }
});
