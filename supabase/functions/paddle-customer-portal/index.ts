import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getPaddleClient, type PaddleEnv } from "../_shared/paddle.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    const body = await req.json().catch(() => ({}));
    const environment: PaddleEnv = body.environment === "live" ? "live" : "sandbox";

    // Find the user's most recent subscription for this environment
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("paddle_customer_id, paddle_subscription_id")
      .eq("user_id", user.id)
      .eq("environment", environment)
      .not("paddle_subscription_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub?.paddle_customer_id) {
      return new Response(
        JSON.stringify({ error: "Nenhuma assinatura ativa encontrada." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const paddle = getPaddleClient(environment);
    const subscriptionIds = sub.paddle_subscription_id ? [sub.paddle_subscription_id] : [];
    const session = await paddle.customerPortalSessions.create(sub.paddle_customer_id, subscriptionIds);

    // Prefer general overview; fallback to the first subscription URL
    const url =
      (session as any)?.urls?.general?.overview ||
      (session as any)?.urls?.subscriptions?.[0]?.updatePaymentMethod ||
      (session as any)?.urls?.subscriptions?.[0]?.cancel ||
      null;

    if (!url) {
      throw new Error("Portal URL não retornada pelo provedor.");
    }

    return new Response(JSON.stringify({ url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("paddle-customer-portal error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
