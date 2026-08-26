import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireUser } from "../_shared/auth.ts";
import { searchLegislation, type NormaResumo } from "../_shared/legislation-search.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-payment-env, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export { searchLegislation, type NormaResumo };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;
  const _userId = auth.userId;

  try {
    const { termo, tipoNorma, ano } = await req.json();

    if (!termo || typeof termo !== "string" || termo.trim().length < 2) {
      throw new Error("Termo de busca muito curto (mínimo 2 caracteres)");
    }

    const normas = await searchLegislation(termo.trim(), tipoNorma, ano);

    return new Response(JSON.stringify({ normas, total: normas.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("search-legislation error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido", normas: [] }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
