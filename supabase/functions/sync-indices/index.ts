import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireServiceRole } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-payment-env",
};

interface Serie {
  codigo_indice: string;
  codigo_sgs: number;
  inicio: string; // dd/MM/yyyy
}

const SERIES: Serie[] = [
  { codigo_indice: "ipca", codigo_sgs: 433, inicio: "01/01/1994" },
  { codigo_indice: "ipca_e", codigo_sgs: 10764, inicio: "01/01/1994" },
  { codigo_indice: "inpc", codigo_sgs: 188, inicio: "01/01/1994" },
  { codigo_indice: "igpm", codigo_sgs: 189, inicio: "01/01/1994" },
  { codigo_indice: "selic_mensal", codigo_sgs: 4390, inicio: "01/01/1994" },
  { codigo_indice: "tr", codigo_sgs: 226, inicio: "01/01/1994" },
  { codigo_indice: "poupanca", codigo_sgs: 196, inicio: "01/01/2012" },
  // Taxa Legal (Lei 14.905/2024) — série só existe a partir de 30/08/2024
  { codigo_indice: "taxa_legal", codigo_sgs: 29543, inicio: "30/08/2024" },
];


function parseBR(d: string): Date {
  const [dd, mm, yyyy] = d.split("/").map(Number);
  return new Date(Date.UTC(yyyy, mm - 1, dd));
}

function fmtBR(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
}

/** Janelas de no máximo 10 anos — limite da API do SGS desde 26/03/2025. */
function janelas(inicio: Date, fim: Date): Array<[Date, Date]> {
  const out: Array<[Date, Date]> = [];
  let cursor = new Date(inicio);
  while (cursor <= fim) {
    const end = new Date(
      Date.UTC(cursor.getUTCFullYear() + 9, cursor.getUTCMonth(), cursor.getUTCDate()),
    );
    const janelaFim = end > fim ? fim : end;
    out.push([new Date(cursor), janelaFim]);
    cursor = new Date(janelaFim.getTime() + 86400000);
  }
  return out;
}

async function fetchJanela(
  codigo: number,
  ini: Date,
  fim: Date,
): Promise<Array<{ data: string; valor: string }>> {
  const url =
    `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${codigo}/dados?formato=json` +
    `&dataInicial=${fmtBR(ini)}&dataFinal=${fmtBR(fim)}`;

  let lastErr = "";
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 25000);
      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: { Accept: "application/json" },
      });
      clearTimeout(t);
      if (!res.ok) {
        lastErr = `HTTP ${res.status}`;
        throw new Error(lastErr);
      }
      const txt = await res.text();
      if (!txt.trim().startsWith("[")) {
        lastErr = `resposta inesperada: ${txt.slice(0, 120)}`;
        throw new Error(lastErr);
      }
      return JSON.parse(txt);
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
      console.error(`[sync-indices] série ${codigo} tentativa ${attempt} falhou: ${lastErr}`);
      if (attempt < 3) await new Promise((r) => setTimeout(r, attempt * 1500));
    }
  }
  throw new Error(lastErr || "falha desconhecida");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Chamada interna: service role OU segredo do cron
  const syncSecret = Deno.env.get("SYNC_INDICES_SECRET");
  const headerSecret = req.headers.get("x-sync-secret");
  if (!syncSecret || headerSecret !== syncSecret) {
    const svcErr = requireServiceRole(req);
    if (svcErr) return svcErr;
  }


  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;


  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const full = body?.full === true;
  const only = typeof body?.serie === "string" ? body.serie : null;
  const bodyInicio = typeof body?.inicio === "string" ? parseBR(body.inicio) : null;
  const bodyFim = typeof body?.fim === "string" ? parseBR(body.fim) : null;

  const hoje = new Date();
  const resumo: Record<string, { registros: number; erro?: string }> = {};

  for (const serie of SERIES) {
    if (only && serie.codigo_indice !== only) continue;
    try {
      let inicio = bodyInicio ?? parseBR(serie.inicio);
      let fim = bodyFim ?? hoje;
      if (!full && !bodyInicio) {
        // Modo incremental: só os últimos 18 meses (cron diário)
        const rec = new Date(
          Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() - 18, 1),
        );
        if (rec > inicio) inicio = rec;
      }

      const linhas: Array<{ data: string; valor: string }> = [];
      for (const [ini, jfim] of janelas(inicio, fim)) {
        const parte = await fetchJanela(serie.codigo_sgs, ini, jfim);
        linhas.push(...parte);
      }


      // Agrupa por mês de referência (data_ref = 1º dia do mês)
      const porMes = new Map<string, number>();
      for (const l of linhas) {
        const d = parseBR(l.data);
        const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
        const valor = Number(String(l.valor).replace(",", "."));
        if (!Number.isFinite(valor)) continue;
        porMes.set(key, valor);
      }

      const rows = [...porMes.entries()].map(([data_ref, valor_percentual]) => ({
        codigo_indice: serie.codigo_indice,
        data_ref,
        valor_percentual,
        fator: 1 + valor_percentual / 100,
        fonte: "BCB/SGS",
        codigo_sgs: serie.codigo_sgs,
        sincronizado_em: new Date().toISOString(),
      }));

      for (let i = 0; i < rows.length; i += 500) {
        const chunk = rows.slice(i, i + 500);
        const { error } = await supabase
          .from("indices_economicos")
          .upsert(chunk, { onConflict: "codigo_indice,data_ref" });
        if (error) throw new Error(error.message);
      }

      resumo[serie.codigo_indice] = { registros: rows.length };
      console.log(`[sync-indices] ${serie.codigo_indice}: ${rows.length} meses`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      resumo[serie.codigo_indice] = { registros: 0, erro: msg };
      console.error(`[sync-indices] ${serie.codigo_indice} falhou: ${msg}`);
    }
  }

  return new Response(JSON.stringify({ ok: true, modo: full ? "backfill" : "incremental", resumo }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
