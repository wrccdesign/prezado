import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateEmbedding } from "../_shared/embeddings.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { batch_size = 3 } = await req.json().catch(() => ({}));

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get records without embeddings
    const { data: records, error: fetchError } = await supabase
      .from("decisions")
      .select("id, ementa, resumo_ia")
      .is("embedding", null)
      .limit(batch_size);

    if (fetchError) throw new Error(`Fetch error: ${fetchError.message}`);
    if (!records || records.length === 0) {
      return new Response(JSON.stringify({ processed: 0, errors: 0, message: "Nenhum registro pendente" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processed = 0;
    let errors = 0;
    const errorDetails: string[] = [];

    for (const record of records) {
      const text = [record.ementa, record.resumo_ia].filter(Boolean).join(" ");
      if (text.length < 20) {
        errors++;
        errorDetails.push(`${record.id}: texto muito curto`);
        continue;
      }

      try {
        const embedding = await generateEmbedding(text);
        const embeddingStr = `[${embedding.join(",")}]`;

        const { error: updateError } = await supabase
          .from("decisions")
          .update({ embedding: embeddingStr })
          .eq("id", record.id);

        if (updateError) {
          errors++;
          errorDetails.push(`${record.id}: ${updateError.message}`);
        } else {
          processed++;
        }
      } catch (e) {
        errors++;
        errorDetails.push(`${record.id}: ${e instanceof Error ? e.message : "unknown"}`);
      }
    }

    // Count remaining
    const { count } = await supabase
      .from("decisions")
      .select("id", { count: "exact", head: true })
      .is("embedding", null);

    return new Response(JSON.stringify({
      processed,
      errors,
      remaining: count || 0,
      error_details: errorDetails.slice(0, 10),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("backfill-embeddings error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
