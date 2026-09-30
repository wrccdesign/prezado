import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireUser } from "../_shared/auth.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-payment-env, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Tribunais atendidos por cada coletor de ementa. Fora dessas listas, a coleta
// cai no fallback, que usa o portal configurado em tj_scraping_config.
const ESAJ = ["TJSP", "TJCE", "TJAM"];
const PROPRIO = ["TJMG", "TJPR", "TJSC", "TJRO", "TJRR"];

const PER_CALL_TIMEOUT_MS = 120_000;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: roleRow } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", auth.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!roleRow) {
    return new Response(JSON.stringify({ error: "Acesso restrito a administradores" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const tribunal = typeof body.tribunal === "string" ? body.tribunal.toUpperCase() : "";
  const query = typeof body.query === "string" ? body.query.trim() : "";
  const size = Math.min(Math.max(Number(body.size ?? 5) || 5, 1), 10);

  if (!tribunal || !query) {
    return new Response(JSON.stringify({ error: "tribunal e query são obrigatórios" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const target = ESAJ.includes(tribunal)
    ? "scrape-esaj"
    : PROPRIO.includes(tribunal)
      ? "scrape-tj-proprio"
      : "scrape-tj-fallback";

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), PER_CALL_TIMEOUT_MS);
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/${target}`, {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tribunal, query, size }),
    });
    const text = await res.text();
    let data: unknown;
    try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 500) }; }
    return new Response(JSON.stringify({ coletor: target, ...(data as object) }), {
      status: res.ok ? 200 : 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Falha na coleta", coletor: target }),
      { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } finally {
    clearTimeout(timer);
  }
});
