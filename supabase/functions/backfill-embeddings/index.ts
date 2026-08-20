import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireInternalCall } from "../_shared/auth.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateEmbeddings, toVectorLiteral, VOYAGE_BATCH_SIZE } from "../_shared/embeddings.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-payment-env, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-sync-secret",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const _svcErr = requireInternalCall(req);
  if (_svcErr) return _svcErr;

  try {
    // batch_size = total processado nesta invocação; enviado à Voyage em
    // sub-lotes de VOYAGE_BATCH_SIZE. Teto de 256 para caber no tempo da função.
    const body = await req.json().catch(() => ({}));
    const requested = Number(body.batch_size ?? 128);
    const batchSize = Math.min(Math.max(Number.isFinite(requested) ? requested : 128, 1), 256);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Retomada: sempre pega o próximo bloco ainda sem embedding.
    const { data: records, error: fetchError } = await supabase
      .from("decisions")
      .select("id, ementa, resumo_ia")
      .is("embedding", null)
      .limit(batchSize);

    if (fetchError) throw new Error(`Fetch error: ${fetchError.message}`);
    if (!records || records.length === 0) {
      // Backfill concluído: o cron temporário se autodesativa para não ficar
      // disparando a cada 5 minutos para sempre.
      const { data: unscheduled, error: cronError } = await supabase.rpc(
        "unschedule_backfill_embeddings",
      );
      if (cronError) console.error("falha ao desagendar cron:", cronError.message);
      else if (unscheduled) console.log("cron backfill-embeddings-5min desagendado (fila vazia)");

      return new Response(
        JSON.stringify({
          processed: 0,
          errors: 0,
          message: "Nenhum registro pendente",
          cron_unscheduled: unscheduled === true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }


    let processed = 0;
    let errors = 0;
    const errorDetails: string[] = [];

    const eligible: { id: string; text: string }[] = [];
    for (const record of records) {
      const text = [record.ementa, record.resumo_ia].filter(Boolean).join(" ");
      if (text.length < 20) {
        errors++;
        errorDetails.push(`${record.id}: texto muito curto`);
        continue;
      }
      eligible.push({ id: record.id as string, text });
    }

    for (let i = 0; i < eligible.length; i += VOYAGE_BATCH_SIZE) {
      const chunk = eligible.slice(i, i + VOYAGE_BATCH_SIZE);
      try {
        const vectors = await generateEmbeddings(chunk.map((c) => c.text), {
          functionName: "backfill-embeddings",
        });

        for (let j = 0; j < chunk.length; j++) {
          const { error: updateError } = await supabase
            .from("decisions")
            .update({ embedding: toVectorLiteral(vectors[j]) })
            .eq("id", chunk[j].id);

          if (updateError) {
            errors++;
            errorDetails.push(`${chunk[j].id}: ${updateError.message}`);
          } else {
            processed++;
          }
        }
      } catch (e) {
        errors += chunk.length;
        errorDetails.push(`lote ${i / VOYAGE_BATCH_SIZE}: ${e instanceof Error ? e.message : "unknown"}`);
      }
    }

    const { count: remaining } = await supabase
      .from("decisions")
      .select("id", { count: "exact", head: true })
      .is("embedding", null);

    const { count: withEmbedding } = await supabase
      .from("decisions")
      .select("id", { count: "exact", head: true })
      .not("embedding", "is", null);

    return new Response(JSON.stringify({
      processed,
      errors,
      remaining: remaining || 0,
      with_embedding: withEmbedding || 0,
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
