import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-payment-env, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export function unauthorized(msg = "Unauthorized"): Response {
  return new Response(JSON.stringify({ error: msg }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Require an authenticated end-user JWT. Returns the user id or a Response to return.
 */
export async function requireUser(
  req: Request,
): Promise<{ userId: string; token: string } | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return unauthorized();
  const token = authHeader.slice("Bearer ".length);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user) return unauthorized();
  // Reject the anon key itself (unauthenticated) — must be a real user session
  if (!data.user.id || data.user.aud !== "authenticated") return unauthorized();
  return { userId: data.user.id, token };
}

/**
 * Require a service-role JWT (internal calls only). Used to lock down
 * ingestion/scraping endpoints so only cron/orchestrator can trigger them.
 */
export function requireServiceRole(req: Request): Response | null {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return unauthorized();
  const token = authHeader.slice("Bearer ".length);
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceKey || token !== serviceKey) return unauthorized();
  return null;
}
