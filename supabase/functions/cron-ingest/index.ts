import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireInternalCall } from "../_shared/auth.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-sync-secret",
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

// Tempo máximo que um tribunal pode consumir. Sem isso, um scraper travado
// come o orçamento inteiro da execução.
const PER_TRIBUNAL_TIMEOUT_MS = 120_000;

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const _svcErr = requireInternalCall(req);
  if (_svcErr) return _svcErr;

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const phase = Number(body.phase ?? 1);
  const index = Number(body.index ?? 0);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const tribunais = phase === 1 ? DATAJUD_TRIBUNAIS : FIRECRAWL_TRIBUNAIS;

  // Uma invocação por tribunal. O runtime das funções tem teto de tempo: um
  // laço sobre 8 ou 19 tribunais na mesma chamada é interrompido no meio e o
  // progresso é perdido. Cada passo grava no log e só então chama o próximo.
  if (index >= tribunais.length) {
    return new Response(JSON.stringify({ phase, status: "done" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const tribunal = tribunais[index];
  const query = typeof body.query === "string" && body.query
    ? body.query
    : (phase === 1 ? QUERIES_PHASE1 : QUERIES_PHASE2)[
        Math.floor(Math.random() * (phase === 1 ? QUERIES_PHASE1 : QUERIES_PHASE2).length)
      ];

  // Linha única por execução: criada no primeiro passo, atualizada nos demais.
  let runId = typeof body.run_id === "string" ? body.run_id : null;
  if (!runId) {
    const { data, error } = await supabase
      .from("cron_ingest_log")
      .insert({ phase, total_ingested: 0, results: { _query: query }, executed_at: new Date().toISOString() })
      .select("id")
      .single();
    if (error) console.error("[cron-ingest] falha ao criar cron_ingest_log:", error.message);
    runId = data?.id ?? null;
  }

  const run = async () => {
    const functionName = phase === 1
      ? "scrape-tj-fallback"
      : (["TJSP", "TJCE", "TJAM"].includes(tribunal) ? "scrape-esaj" : "scrape-tj-proprio");
    const size = phase === 1 ? 10 : 5;

    let resultado: Record<string, number> = { ingested: 0, skipped: 0, errors: 1 };
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), PER_TRIBUNAL_TIMEOUT_MS);
      let res: Response;
      try {
        res = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
          method: "POST",
          signal: ctrl.signal,
          headers: {
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ tribunal, query, size }),
        });
      } finally {
        clearTimeout(t);
      }

      if (res.ok) {
        const data = await res.json();
        resultado = {
          ingested: data.ingested || 0,
          skipped: data.skipped || 0,
          errors: data.errors?.length || 0,
        };
        console.log(`[cron-ingest] ${tribunal} (${functionName}): +${resultado.ingested} inseridas`);
      } else {
        console.error(`[cron-ingest] ${tribunal} (${functionName}) HTTP ${res.status}`);
      }
    } catch (e) {
      console.error(`[cron-ingest] ${tribunal} error:`, e);
    }

    // Grava o progresso deste tribunal antes de seguir — um corte de tempo
    // depois daqui não apaga o que já foi feito.
    if (runId) {
      try {
        const { data: atual } = await supabase
          .from("cron_ingest_log")
          .select("total_ingested, results")
          .eq("id", runId)
          .single();
        await supabase
          .from("cron_ingest_log")
          .update({
            total_ingested: (atual?.total_ingested ?? 0) + resultado.ingested,
            results: { ...(atual?.results ?? {}), [tribunal]: resultado },
          })
          .eq("id", runId);
      } catch (e) {
        console.error("[cron-ingest] falha ao gravar progresso:", e);
      }
    }

    // Próximo tribunal, só se houver trabalho restante.
    const proximo = index + 1;
    if (proximo >= tribunais.length) {
      console.log(`[cron-ingest] Phase ${phase} concluída (${tribunais.length} tribunais).`);
      return;
    }

    await new Promise((r) => setTimeout(r, 1000));
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/cron-ingest`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phase, index: proximo, query, run_id: runId }),
      });
    } catch (e) {
      console.error(`[cron-ingest] falha ao encadear índice ${proximo}:`, e);
    }
  };

  const task = run();
  if (typeof EdgeRuntime !== "undefined") EdgeRuntime.waitUntil(task);

  return new Response(
    JSON.stringify({ phase, tribunal, index, run_id: runId, status: "started" }),
    { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
