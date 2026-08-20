/**
 * Consulta ao vivo no DataJud (CNJ) para a busca sob demanda.
 *
 * Princípios:
 * - ZERO chamada de IA no caminho da resposta: devolvemos o que o CNJ já
 *   entrega estruturado (número, classe, assuntos, órgão julgador, datas).
 * - Teto rígido de resultados novos por busca (custo e tempo).
 * - O enriquecimento (resumo/embedding) roda depois, em segundo plano.
 */

const UF_BY_TRIBUNAL: Record<string, string> = {
  TJSP: "SP", TJRJ: "RJ", TJMG: "MG", TJRS: "RS", TJPR: "PR", TJBA: "BA",
  TJSC: "SC", TJPE: "PE", TJCE: "CE", TJGO: "GO", TJDF: "DF", TJES: "ES",
  TJMA: "MA", TJPA: "PA", TJMT: "MT", TJMS: "MS", TJPB: "PB", TJRN: "RN",
  TJAL: "AL", TJPI: "PI", TJSE: "SE", TJTO: "TO", TJAC: "AC", TJAP: "AP",
  TJAM: "AM", TJRO: "RO", TJRR: "RR",
};

/** Tribunais consultados quando o usuário não filtra por tribunal. */
const DEFAULT_TRIBUNAIS = ["TJSP", "TJRJ", "TJMG"];

/** Teto de resultados NOVOS processados por busca (C4). */
export const MAX_LIVE_RESULTS = 10;

function endpointFor(tribunal: string): string {
  const sigla = tribunal.toLowerCase();
  if (sigla === "tjdf" || sigla === "tjdft") return "api_publica_tjdft";
  return `api_publica_${sigla}`;
}

export function normalizeTermKey(query: string, filters: Record<string, unknown> = {}): string {
  const base = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const trib = (filters?.tribunal as string) || "all";
  return `${trib}::${base}`;
}

export interface LiveDecision {
  external_id: string;
  source: string;
  tribunal: string | null;
  uf: string | null;
  instancia: string | null;
  numero_processo: string | null;
  orgao_julgador: string | null;
  data_decisao: string | null;
  tipo_decisao: string | null;
  temas_juridicos: string[];
  full_text: string;
  cached_at: string;
}

function parseDatajudDate(raw: unknown): string | null {
  if (!raw) return null;
  const str = String(raw);
  const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const compact = str.match(/^(\d{4})(\d{2})(\d{2})/);
  if (compact) return `${compact[1]}-${compact[2]}-${compact[3]}`;
  return null;
}

function mapHit(hit: any, tribunal: string): LiveDecision | null {
  const s = hit?._source || {};
  const numero = s.numeroProcesso || null;
  if (!numero) return null;

  const movimentos = (s.movimentos || []).map(
    (m: any) => `Movimento (${m.dataHora || ""}): ${m.nome || ""}`,
  );
  const assuntos: string[] = (s.assuntos || []).map((a: any) => a?.nome).filter(Boolean);

  // O DataJud devolve datas em ISO ("2024-01-16T18:00:00") ou compactas
  // ("20240116180000"). Normalizamos as duas para YYYY-MM-DD.
  const dataAjuizamento = parseDatajudDate(s.dataAjuizamento);

  return {
    external_id: `datajud_${hit._id || numero}`,
    source: "datajud_live",
    tribunal: s.tribunal || tribunal,
    uf: UF_BY_TRIBUNAL[(s.tribunal || tribunal).toUpperCase()] ?? null,
    instancia: s.grau || null,
    numero_processo: numero,
    orgao_julgador: s.orgaoJulgador?.nome || null,
    data_decisao: dataAjuizamento,
    tipo_decisao: s.classeProcessual?.nome || null,
    temas_juridicos: assuntos,
    full_text: [
      s.classeProcessual?.nome ? `Classe: ${s.classeProcessual.nome}` : "",
      `Processo: ${numero}`,
      `Tribunal: ${s.tribunal || tribunal}`,
      s.grau ? `Grau: ${s.grau}` : "",
      s.orgaoJulgador?.nome ? `Órgão Julgador: ${s.orgaoJulgador.nome}` : "",
      ...assuntos.map((a) => `Assunto: ${a}`),
      ...movimentos,
    ].filter(Boolean).join("\n"),
    cached_at: new Date().toISOString(),
  };
}

async function searchTribunal(tribunal: string, query: string, size: number): Promise<LiveDecision[]> {
  const apiKey = Deno.env.get("DATAJUD_API_KEY");
  if (!apiKey) throw new Error("DATAJUD_API_KEY not configured");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(`https://api-publica.datajud.cnj.jus.br/${endpointFor(tribunal)}/_search`, {
      method: "POST",
      headers: { "Authorization": `APIKey ${apiKey}`, "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        size,
        query: {
          bool: {
            should: [
              { match: { "assuntos.nome": query } },
              { match: { "classeProcessual.nome": query } },
            ],
            minimum_should_match: 1,
          },
        },
        sort: [{ "@timestamp": { order: "desc" } }],
      }),
    });
    if (!res.ok) {
      console.error(`[datajud-live] ${tribunal} HTTP ${res.status}`);
      return [];
    }
    const data = await res.json();
    return (data.hits?.hits || [])
      .map((h: any) => mapHit(h, tribunal))
      .filter(Boolean) as LiveDecision[];
  } catch (e) {
    console.error(`[datajud-live] ${tribunal} erro:`, e instanceof Error ? e.message : e);
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/** Busca ao vivo em paralelo nos tribunais alvo, com teto global de resultados. */
export async function searchDatajudLive(
  query: string,
  filters: { tribunal?: string | null } = {},
): Promise<LiveDecision[]> {
  const tribunais = filters.tribunal ? [filters.tribunal] : DEFAULT_TRIBUNAIS;
  const perTribunal = Math.max(1, Math.ceil(MAX_LIVE_RESULTS / tribunais.length));

  const batches = await Promise.all(
    tribunais.map((t) => searchTribunal(t, query, perTribunal)),
  );

  const seen = new Set<string>();
  const out: LiveDecision[] = [];
  for (const batch of batches) {
    for (const d of batch) {
      if (!d.numero_processo || seen.has(d.numero_processo)) continue;
      seen.add(d.numero_processo);
      out.push(d);
      if (out.length >= MAX_LIVE_RESULTS) return out;
    }
  }
  return out;
}
