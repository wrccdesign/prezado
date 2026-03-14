import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT_BUSCA = `Você é um especialista em pesquisa jurídica brasileira.
Interprete a consulta do advogado e gere uma query expandida para busca semântica.
Retorne APENAS JSON válido, sem markdown, sem explicações.

Schema:
{
  "query_expandida": string,
  "keywords": string[],
  "filtros_sugeridos": {
    "tribunal": string | null,
    "ramos_direito": string | null,
    "instancia": string | null
  },
  "consultas_alternativas": string[],
  "intencao_detectada": string
}

Regras:
- query_expandida: enriqueça com termos técnicos que juízes usam em suas decisões, sinônimos jurídicos e artigos de lei relacionados (máx. 300 caracteres)
- keywords: 5-10 termos exatos para full-text search no PostgreSQL (use termos que aparecem em ementas e acórdãos)
- consultas_alternativas: 3 variações para ampliar resultados

Exemplos de enriquecimento:
"acidente de carro com culpa dos dois lados" → inclua: culpa concorrente, art. 945 CC, compensação de culpas
"plano de saúde negando cirurgia" → inclua: negativa de cobertura, rol ANS, Lei 9656/98, tutela de urgência`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query, filters } = await req.json();
    if (!query || typeof query !== "string") {
      throw new Error("Query é obrigatória");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Step 1: Use AI to expand the query
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT_BUSCA },
          { role: "user", content: `Consulta: "${query}"\nFiltros ativos: ${JSON.stringify(filters || {})}` },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI error:", aiResponse.status);
      // Fall back to direct search without AI expansion
    }

    let searchQuery = query;
    let aiData: any = null;

    if (aiResponse.ok) {
      try {
        const aiResult = await aiResponse.json();
        const content = aiResult.choices?.[0]?.message?.content || "";
        // Try to parse JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiData = JSON.parse(jsonMatch[0]);
          // Use keywords for full-text search (PostgreSQL websearch format)
          if (aiData.keywords && aiData.keywords.length > 0) {
            searchQuery = aiData.keywords.join(" OR ");
          }
        }
      } catch (e) {
        console.error("Failed to parse AI response, using original query:", e);
      }
    }

    // Step 2: Search using the database function
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data: results, error: dbError } = await supabase.rpc("search_decisions", {
      search_query: searchQuery,
      filter_tribunal: filters?.tribunal || null,
      filter_uf: filters?.uf || null,
      filter_ramo: filters?.ramo || null,
      filter_instancia: filters?.instancia || null,
      filter_comarca_pequena: filters?.comarca_pequena ?? null,
      result_limit: filters?.limit || 20,
      result_offset: filters?.offset || 0,
    });

    if (dbError) {
      console.error("DB search error:", dbError);
      throw new Error("Erro na busca no banco de dados");
    }

    return new Response(JSON.stringify({
      results: results || [],
      ai_expansion: aiData,
      query_used: searchQuery,
      total: results?.length || 0,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("search-jurisprudencia error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
