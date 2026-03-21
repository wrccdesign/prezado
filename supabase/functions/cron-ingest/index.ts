import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DATAJUD_TRIBUNAIS = [
  "TJRJ", "TJRS", "TJBA", "TJPE", "TJMA", "TJPA", "TJAL", "TJSE",
  "TJPB", "TJPI", "TJES", "TJTO", "TJAC", "TJAP", "TJDF", "TJMT",
  "TJMS", "TJRN", "TJGO",
];

const FIRECRAWL_TRIBUNAIS = [
  "TJSP", "TJCE", "TJAM", "TJMG", "TJPR", "TJSC", "TJRO", "TJRR",
];

const QUERIES_PHASE1 = [
  "dano moral",
  "responsabilidade civil",
  "direito consumidor",
  "contrato bancário",
  "rescisão contratual",
  "usucapião posse",
  "acidente trânsito",
  "plano saúde",
  "servidor público",
  "aposentadoria INSS",
];

const QUERIES_PHASE2 = [
  "dano moral consumidor",
  "responsabilidade civil",
  "contrato bancário rescisão",
  "usucapião posse",
  "acidente trânsito indenização",
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const phase = body.phase ?? 1;

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const results: Record<string, { ingested: number; skipped: number; errors: number }> = {};
    let totalIngested = 0;

    if (phase === 1) {
      // DataJud — 19 TJs, 1 query aleatória, size 10
      const query = QUERIES_PHASE1[Math.floor(Math.random() * QUERIES_PHASE1.length)];
      console.log(`[cron-ingest] Phase 1 — query: "${query}"`);

      for (const tribunal of DATAJUD_TRIBUNAIS) {
        try {
          const res = await fetch(`${SUPABASE_URL}/functions/v1/scrape-tj-fallback`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ tribunal, query, size: 10 }),
          });

          if (!res.ok) {
            console.error(`[cron-ingest] ${tribunal} HTTP ${res.status}`);
            results[tribunal] = { ingested: 0, skipped: 0, errors: 1 };
            continue;
          }

          const data = await res.json();
          results[tribunal] = {
            ingested: data.ingested || 0,
            skipped: data.skipped || 0,
            errors: data.errors?.length || 0,
          };
          totalIngested += data.ingested || 0;
          console.log(`[cron-ingest] ${tribunal}: +${data.ingested} inseridas`);
        } catch (e) {
          console.error(`[cron-ingest] ${tribunal} error:`, e);
          results[tribunal] = { ingested: 0, skipped: 0, errors: 1 };
        }

        // Pequena pausa entre tribunais para não sobrecarregar
        await new Promise((r) => setTimeout(r, 500));
      }
    } else if (phase === 2) {
      // Firecrawl — 8 TJs, 1 query aleatória, size 5
      const query = QUERIES_PHASE2[Math.floor(Math.random() * QUERIES_PHASE2.length)];
      console.log(`[cron-ingest] Phase 2 — query: "${query}"`);

      for (const tribunal of FIRECRAWL_TRIBUNAIS) {
        // Determinar qual scraper usar baseado no tribunal
        const isEsaj = ["TJSP", "TJCE", "TJAM"].includes(tribunal);
        const functionName = isEsaj ? "scrape-esaj" : "scrape-tj-proprio";

        try {
          const res = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ tribunal, query, size: 5 }),
          });

          if (!res.ok) {
            console.error(`[cron-ingest] ${tribunal} (${functionName}) HTTP ${res.status}`);
            results[tribunal] = { ingested: 0, skipped: 0, errors: 1 };
            continue;
          }

          const data = await res.json();
          results[tribunal] = {
            ingested: data.ingested || 0,
            skipped: data.skipped || 0,
            errors: data.errors?.length || 0,
          };
          totalIngested += data.ingested || 0;
          console.log(`[cron-ingest] ${tribunal} (${functionName}): +${data.ingested} inseridas`);
        } catch (e) {
          console.error(`[cron-ingest] ${tribunal} error:`, e);
          results[tribunal] = { ingested: 0, skipped: 0, errors: 1 };
        }

        await new Promise((r) => setTimeout(r, 500));
      }
    }

    // Log na tabela de auditoria (opcional — não falha se não existir)
    try {
      await supabase.from("cron_ingest_log").insert({
        phase,
        total_ingested: totalIngested,
        results,
        executed_at: new Date().toISOString(),
      });
    } catch (_) {
      // Silently ignore if table doesn't exist
    }

    console.log(`[cron-ingest] Phase ${phase} done. Total: ${totalIngested}`);

    return new Response(JSON.stringify({
      phase,
      total_ingested: totalIngested,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[cron-ingest] error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
