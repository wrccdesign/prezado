import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Using the Senado SCON search which is more reliable
const SCON_API = "https://legis.senado.leg.br/scon/api";

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
  // Try multiple API endpoints
  const results: NormaResumo[] = [];

  // Approach 1: Try the SCON API
  try {
    const sconUrl = `${SCON_API}/busca?q=${encodeURIComponent(termo)}&tipoDocumento=LEG&qtd=10&origem=JSON`;
    console.log("Trying SCON API:", sconUrl);

    const sconResponse = await fetch(sconUrl, {
      headers: { Accept: "application/json" },
    });

    if (sconResponse.ok) {
      const sconData = await sconResponse.json();
      const docs = sconData?.documentos || sconData?.Documentos || [];
      for (const doc of docs.slice(0, 5)) {
        results.push({
          codigo: doc.codigo || doc.id || "",
          tipoNorma: doc.tipoDocumento || doc.tipo || "Lei",
          numero: doc.numero || "",
          ano: doc.ano || "",
          ementa: doc.ementa || doc.descricao || doc.titulo || "",
          dataPublicacao: doc.dataPublicacao || doc.data || "",
          url: doc.url || doc.link || `https://legis.senado.leg.br/norma/${doc.codigo || doc.id || ""}`,
        });
      }
    }
  } catch (e) {
    console.log("SCON API failed:", e);
  }

  // Approach 2: Try dadosabertos with explicit JSON
  if (results.length === 0) {
    try {
      const dadosUrl = `https://legis.senado.leg.br/dadosabertos/legislacao/lista?termos=${encodeURIComponent(termo)}&p=1`;
      console.log("Trying dadosabertos API:", dadosUrl);

      const response = await fetch(dadosUrl, {
        headers: { 
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("json")) {
          const data = await response.json();
          const documentos =
            data?.PesquisaLegislacao?.Documentos?.Documento ||
            data?.ListaDocumentos?.Documentos?.Documento ||
            data?.documentos ||
            [];
          const docs = Array.isArray(documentos) ? documentos : documentos ? [documentos] : [];

          for (const doc of docs.slice(0, 5)) {
            results.push({
              codigo: doc.Codigo || doc.CodigoDocumento || doc.codigo || "",
              tipoNorma: doc.TipoNorma || doc.DescricaoTipoNorma || doc.tipo || "Lei",
              numero: doc.Numero || doc.NumeroDocumento || doc.numero || "",
              ano: doc.Ano || doc.AnoDocumento || doc.ano || "",
              ementa: doc.Ementa || doc.DescricaoEmenta || doc.ementa || "",
              dataPublicacao: doc.DataPublicacao || doc.data || "",
              url: doc.UrlDocumento || doc.Url || doc.url || `https://legis.senado.leg.br/norma/${doc.Codigo || ""}`,
            });
          }
        }
      }
    } catch (e) {
      console.log("dadosabertos API failed:", e);
    }
  }

  // Approach 3: Fallback to Planalto URLs (static but reliable)
  if (results.length === 0) {
    console.log("Using static legislation references");
    const staticLaws: Record<string, NormaResumo[]> = {
      trabalho: [
        { codigo: "clt", tipoNorma: "Decreto-Lei", numero: "5.452", ano: "1943", ementa: "Consolidação das Leis do Trabalho - CLT", dataPublicacao: "01/05/1943", url: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm" },
        { codigo: "13467", tipoNorma: "Lei", numero: "13.467", ano: "2017", ementa: "Reforma Trabalhista - Altera a CLT", dataPublicacao: "13/07/2017", url: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2017/lei/l13467.htm" },
      ],
      consumidor: [
        { codigo: "cdc", tipoNorma: "Lei", numero: "8.078", ano: "1990", ementa: "Código de Defesa do Consumidor", dataPublicacao: "11/09/1990", url: "https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm" },
      ],
      civil: [
        { codigo: "cc", tipoNorma: "Lei", numero: "10.406", ano: "2002", ementa: "Código Civil", dataPublicacao: "10/01/2002", url: "https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm" },
      ],
      processo: [
        { codigo: "cpc", tipoNorma: "Lei", numero: "13.105", ano: "2015", ementa: "Código de Processo Civil", dataPublicacao: "16/03/2015", url: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm" },
      ],
      penal: [
        { codigo: "cp", tipoNorma: "Decreto-Lei", numero: "2.848", ano: "1940", ementa: "Código Penal", dataPublicacao: "07/12/1940", url: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm" },
        { codigo: "cpp", tipoNorma: "Decreto-Lei", numero: "3.689", ano: "1941", ementa: "Código de Processo Penal", dataPublicacao: "03/10/1941", url: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del3689compilado.htm" },
      ],
      familia: [
        { codigo: "cc", tipoNorma: "Lei", numero: "10.406", ano: "2002", ementa: "Código Civil - Livro IV (Direito de Família)", dataPublicacao: "10/01/2002", url: "https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm" },
        { codigo: "eca", tipoNorma: "Lei", numero: "8.069", ano: "1990", ementa: "Estatuto da Criança e do Adolescente", dataPublicacao: "13/07/1990", url: "https://www.planalto.gov.br/ccivil_03/leis/l8069.htm" },
      ],
      tributario: [
        { codigo: "ctn", tipoNorma: "Lei", numero: "5.172", ano: "1966", ementa: "Código Tributário Nacional", dataPublicacao: "25/10/1966", url: "https://www.planalto.gov.br/ccivil_03/leis/l5172compilado.htm" },
      ],
      administrativo: [
        { codigo: "8666", tipoNorma: "Lei", numero: "8.666", ano: "1993", ementa: "Lei de Licitações e Contratos", dataPublicacao: "21/06/1993", url: "https://www.planalto.gov.br/ccivil_03/leis/l8666cons.htm" },
        { codigo: "14133", tipoNorma: "Lei", numero: "14.133", ano: "2021", ementa: "Nova Lei de Licitações", dataPublicacao: "01/04/2021", url: "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14133.htm" },
      ],
      constituicao: [
        { codigo: "cf88", tipoNorma: "Constituição", numero: "", ano: "1988", ementa: "Constituição da República Federativa do Brasil", dataPublicacao: "05/10/1988", url: "https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm" },
      ],
    };

    const termoLower = termo.toLowerCase();
    for (const [key, laws] of Object.entries(staticLaws)) {
      if (termoLower.includes(key) || key.includes(termoLower)) {
        results.push(...laws);
        break;
      }
    }

    // Always add Constitution if nothing else matched
    if (results.length === 0) {
      results.push(...staticLaws.constituicao);
    }
  }

  return results.slice(0, 10);
}

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
