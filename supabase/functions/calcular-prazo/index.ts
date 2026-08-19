import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireQuotaOrGuest } from "../_shared/calculo-guard.ts";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-payment-env, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};


type Materia = "civel" | "penal" | "trabalhista";
type TipoData = "disponibilizacao" | "publicacao";

interface Body {
  data_referencia: string;
  tipo_data?: TipoData;
  materia?: Materia;
  dias: number;
  contagem?: "uteis" | "corridos";
  uf?: string | null;
  codigo_ibge?: string | null;
  tribunal?: string | null;
}

interface DiaExcluido {
  data: string;
  motivo: string;
}

function bad(msg: string, status = 400) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function parseISO(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s || "")) return null;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return isNaN(dt.getTime()) ? null : dt;
}

const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);

/** Recesso forense: 20/12 a 20/01 (art. 220 do CPC) — não se aplica ao penal. */
function noRecesso(d: Date): boolean {
  const m = d.getUTCMonth() + 1;
  const dia = d.getUTCDate();
  return (m === 12 && dia >= 20) || (m === 1 && dia <= 20);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const quota = await requireQuotaOrGuest(req, "calculo", corsHeaders);
  if (quota instanceof Response) return quota;



  let body: Body;
  try {
    body = await req.json();
  } catch {
    return bad("Corpo da requisição inválido");
  }

  const dataRef = parseISO(body.data_referencia);
  if (!dataRef) return bad("Data de referência inválida (use AAAA-MM-DD)");

  const dias = Number(body.dias);
  if (!Number.isInteger(dias) || dias <= 0 || dias > 3650) return bad("Prazo em dias inválido");

  const materia: Materia = body.materia ?? "civel";
  const tipoData: TipoData = body.tipo_data ?? "publicacao";
  const contagem = body.contagem ?? (materia === "penal" ? "corridos" : "uteis");
  const uf = body.uf || null;
  const codigoIbge = body.codigo_ibge || null;
  const tribunal = body.tribunal || null;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const inicioBusca = iso(addDays(dataRef, -5));
  const fimBusca = iso(addDays(dataRef, Math.max(400, dias * 3)));

  const { data: feriadosRows, error } = await supabase
    .from("feriados")
    .select("data, tipo, uf, codigo_ibge, tribunal, descricao")
    .gte("data", inicioBusca)
    .lte("data", fimBusca);

  if (error) return bad(`Falha ao ler feriados: ${error.message}`, 500);

  const aplicaveis = (feriadosRows ?? []).filter((f) => {
    if (f.tipo === "nacional") return true;
    if (f.tipo === "estadual") return !!uf && f.uf === uf;
    if (f.tipo === "municipal") return !!codigoIbge && f.codigo_ibge === codigoIbge;
    if (f.tipo === "forense") return !!tribunal && f.tribunal === tribunal;
    return false;
  });

  const feriadoMap = new Map<string, { tipo: string; descricao: string }>();
  for (const f of aplicaveis) {
    const key = String(f.data).slice(0, 10);
    if (!feriadoMap.has(key)) feriadoMap.set(key, { tipo: f.tipo, descricao: f.descricao });
  }

  const rotuloTipo: Record<string, string> = {
    nacional: "Feriado nacional",
    estadual: "Feriado estadual",
    municipal: "Feriado municipal",
    forense: "Suspensão forense",
  };

  function motivoNaoUtil(d: Date): string | null {
    const dow = d.getUTCDay();
    if (dow === 0) return "Domingo";
    if (dow === 6) return "Sábado";
    const f = feriadoMap.get(iso(d));
    if (f) return `${rotuloTipo[f.tipo] ?? "Feriado"} — ${f.descricao}`;
    if (materia !== "penal" && noRecesso(d)) {
      return "Recesso forense (art. 220 do CPC)";
    }
    return null;
  }

  const isUtil = (d: Date) => motivoNaoUtil(d) === null;

  const diasExcluidos: DiaExcluido[] = [];
  const registrar = (d: Date, motivo: string) => {
    diasExcluidos.push({ data: iso(d), motivo });
  };

  // 1) Disponibilização no DJe → publicação no primeiro dia útil seguinte
  //    (art. 224, §§2º e 3º, do CPC; art. 4º, §§3º e 4º, da Lei 11.419/2006)
  let dataPublicacao = new Date(dataRef);
  if (tipoData === "disponibilizacao") {
    dataPublicacao = addDays(dataRef, 1);
    while (!isUtil(dataPublicacao)) {
      registrar(dataPublicacao, `${motivoNaoUtil(dataPublicacao)} (antes da publicação)`);
      dataPublicacao = addDays(dataPublicacao, 1);
    }
  }

  // 2) Exclui-se o dia do começo (art. 224, caput/§1º)
  let cursor = addDays(dataPublicacao, 1);
  if (contagem === "uteis") {
    while (!isUtil(cursor)) {
      registrar(cursor, motivoNaoUtil(cursor)!);
      cursor = addDays(cursor, 1);
    }
  }

  const dataInicioContagem = new Date(cursor);
  let contados = 0;

  if (contagem === "uteis") {
    while (contados < dias) {
      const motivo = motivoNaoUtil(cursor);
      if (motivo === null) contados++;
      else registrar(cursor, motivo);
      if (contados < dias) cursor = addDays(cursor, 1);
    }
  } else {
    // Dias corridos: o recesso do art. 220 do CPC SUSPENDE a contagem — não é
    // apenas um "dia não útil" a ser pulado. Os dias entre 20/12 e 20/01
    // empurram o vencimento para frente (não se aplica ao processo penal).
    while (contados < dias) {
      if (materia !== "penal" && noRecesso(cursor)) {
        registrar(cursor, "Recesso forense — contagem suspensa (art. 220 do CPC)");
      } else {
        contados++;
      }
      if (contados < dias) cursor = addDays(cursor, 1);
    }
  }


  // 3) Prorrogação quando o vencimento cai em dia sem expediente (art. 224, §1º)
  while (motivoNaoUtil(cursor) !== null) {
    registrar(cursor, `${motivoNaoUtil(cursor)} (vencimento prorrogado)`);
    cursor = addDays(cursor, 1);
  }

  const hoje = new Date();
  const hojeUTC = Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate());
  const diasRestantes = Math.round((cursor.getTime() - hojeUTC) / 86400000);

  diasExcluidos.sort((a, b) => a.data.localeCompare(b.data));

  return new Response(
    JSON.stringify({
      data_referencia: iso(dataRef),
      tipo_data: tipoData,
      data_publicacao: iso(dataPublicacao),
      data_inicio_contagem: iso(dataInicioContagem),
      data_vencimento: iso(cursor),
      dias_restantes: diasRestantes,
      materia,
      contagem,
      dias_excluidos: diasExcluidos,
      base_legal: [
        "CPC, art. 219 — contagem em dias úteis (matéria cível); CLT, art. 775 (trabalhista).",
        "CPC, art. 224, §1º — exclui-se o dia do começo e inclui-se o do vencimento; prorrogação para o primeiro dia útil.",
        "CPC, art. 224, §§2º e 3º, e Lei 11.419/2006, art. 4º, §§3º e 4º — publicação no primeiro dia útil seguinte à disponibilização.",
        "CPC, art. 220 — suspensão dos prazos entre 20/12 e 20/01 (não aplicável ao processo penal).",
      ],
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
