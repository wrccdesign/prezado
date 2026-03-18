import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TribunalResult {
  tribunal: string;
  function_called: string;
  ingested: number;
  skipped: number;
  errors: string[];
  total_found: number;
  duration_ms: number;
}

function determineFunctionForConfig(
  config: { sistema: string; status: string | null },
  mode: string
): string | null {
  const sistema = config.sistema?.toLowerCase();
  const status = config.status?.toLowerCase() || "pending";

  if (mode === "datajud_only") {
    return "scrape-tj-fallback";
  }

  if (mode === "firecrawl_only") {
    if (sistema === "esaj") return "scrape-esaj";
    if (sistema === "proprio" && ["active", "pending"].includes(status)) return "scrape-tj-proprio";
    return null; // skip tribunals that need datajud
  }

  // mode "all": route based on config
  if (sistema === "esaj") return "scrape-esaj";
  if (["no_index", "active_datajud"].includes(status)) return "scrape-tj-fallback";
  if (sistema === "proprio") return "scrape-tj-proprio";

  return "scrape-tj-fallback";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { tribunal, query, size = 20, mode = "all" } = await req.json();

    if (!query) {
      return new Response(JSON.stringify({ error: "query é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["all", "firecrawl_only", "datajud_only"].includes(mode)) {
      return new Response(JSON.stringify({ error: "mode deve ser 'all', 'firecrawl_only' ou 'datajud_only'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get tribunal configs
    let configQuery = supabase.from("tj_scraping_config").select("*");

    // Filter by tribunal if provided
    const tribunalFilter: string[] | null = tribunal
      ? Array.isArray(tribunal) ? tribunal.map((t: string) => t.toUpperCase()) : [tribunal.toUpperCase()]
      : null;

    if (tribunalFilter) {
      configQuery = configQuery.in("tribunal", tribunalFilter);
    }

    const { data: configs, error: configError } = await configQuery;

    if (configError) {
      throw new Error(`Erro ao consultar tj_scraping_config: ${configError.message}`);
    }

    if (!configs || configs.length === 0) {
      return new Response(JSON.stringify({
        error: "Nenhum tribunal encontrado na configuração",
        total_ingested: 0,
        total_skipped: 0,
        total_errors: 0,
        results: [],
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Orchestrator: processing ${configs.length} tribunals, mode=${mode}, size=${size}, query="${query}"`);

    const results: TribunalResult[] = [];
    let totalIngested = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    // Process sequentially to avoid rate limits
    for (const config of configs) {
      const targetFunction = determineFunctionForConfig(config, mode);

      if (!targetFunction) {
        console.log(`Skipping ${config.tribunal}: no suitable function for mode=${mode}`);
        results.push({
          tribunal: config.tribunal,
          function_called: "skipped",
          ingested: 0,
          skipped: 0,
          errors: [`Tribunal ignorado no modo ${mode}`],
          total_found: 0,
          duration_ms: 0,
        });
        continue;
      }

      console.log(`Processing ${config.tribunal} via ${targetFunction}...`);
      const start = Date.now();

      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/${targetFunction}`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tribunal: config.tribunal,
            query,
            size,
          }),
        });

        const duration = Date.now() - start;

        if (!response.ok) {
          const errText = await response.text();
          console.error(`${config.tribunal} error (${response.status}): ${errText}`);
          const result: TribunalResult = {
            tribunal: config.tribunal,
            function_called: targetFunction,
            ingested: 0,
            skipped: 0,
            errors: [`HTTP ${response.status}: ${errText.substring(0, 200)}`],
            total_found: 0,
            duration_ms: duration,
          };
          results.push(result);
          totalErrors++;
          continue;
        }

        const data = await response.json();
        const result: TribunalResult = {
          tribunal: config.tribunal,
          function_called: targetFunction,
          ingested: data.ingested || 0,
          skipped: data.skipped || 0,
          errors: data.errors || [],
          total_found: data.total_found || 0,
          duration_ms: duration,
        };

        results.push(result);
        totalIngested += result.ingested;
        totalSkipped += result.skipped;
        totalErrors += result.errors.length;

        console.log(`${config.tribunal}: ingested=${result.ingested}, total_found=${result.total_found}, ${duration}ms`);
      } catch (e) {
        const duration = Date.now() - start;
        const errMsg = e instanceof Error ? e.message : "Erro desconhecido";
        console.error(`${config.tribunal} exception: ${errMsg}`);
        results.push({
          tribunal: config.tribunal,
          function_called: targetFunction,
          ingested: 0,
          skipped: 0,
          errors: [errMsg],
          total_found: 0,
          duration_ms: duration,
        });
        totalErrors++;
      }
    }

    return new Response(JSON.stringify({
      total_ingested: totalIngested,
      total_skipped: totalSkipped,
      total_errors: totalErrors,
      tribunals_processed: results.length,
      mode,
      query,
      size,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("orchestrate-scraping error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
