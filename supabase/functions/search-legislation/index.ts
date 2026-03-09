import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SENADO_API_BASE = "https://legis.senado.leg.br/dadosabertos";

interface NormaResumo {
  codigo: string;
  tipoNorma: string;
  numero: string;
  ano: string;
  ementa: string;
  dataPublicacao: string;
  url: string;
}

async function searchLegislation(termo: string, tipoNorma?: string, ano?: number): Promise<NormaResumo[]> {
  const params = new URLSearchParams();
  if (termo) params.set("termos", termo);
  if (tipoNorma) params.set("tipoNorma", tipoNorma);
  if (ano) params.set("ano", String(ano));
  params.set("p", "1");

  const url = `${SENADO_API_BASE}/legislacao/lista?${params.toString()}`;
  console.log("Searching Senado API:", url);

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    console.error("Senado API error:", response.status, await response.text());
    return [];
  }

  const data = await response.json();

  // The Senado API returns data in a nested structure
  const documentos =
    data?.PesquisaLegislacao?.Documentos?.Documento ||
    data?.ListaDocumentos?.Documentos?.Documento ||
    [];

  const docs = Array.isArray(documentos) ? documentos : documentos ? [documentos] : [];

  return docs.slice(0, 10).map((doc: any) => ({
    codigo: doc.Codigo || doc.CodigoDocumento || "",
    tipoNorma: doc.TipoNorma || doc.DescricaoTipoNorma || "",
    numero: doc.Numero || doc.NumeroDocumento || "",
    ano: doc.Ano || doc.AnoDocumento || "",
    ementa: doc.Ementa || doc.DescricaoEmenta || "",
    dataPublicacao: doc.DataPublicacao || "",
    url: doc.UrlDocumento || doc.Url || `https://legis.senado.leg.br/norma/${doc.Codigo || doc.CodigoDocumento || ""}`,
  }));
}

// Exported helper for other edge functions to import
export { searchLegislation, type NormaResumo };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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
