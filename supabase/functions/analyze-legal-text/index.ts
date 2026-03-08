import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    const { text, file_name } = await req.json();
    if (!text || typeof text !== "string" || text.trim().length < 20) {
      throw new Error("Texto muito curto para análise");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `Você é um assistente jurídico especializado em direito brasileiro. 
Analise o texto jurídico fornecido pelo usuário e retorne uma análise estruturada.

Você DEVE citar artigos específicos da legislação brasileira (Código Civil, CPC, CDC, CLT, CF/88, Código Penal, ECA, etc.).
Use linguagem clara para leigos mas precisa para advogados.
Considere a jurisprudência consolidada quando relevante.

Ao fornecer portais_relevantes, inclua links reais de sites úteis como:
- https://www.planalto.gov.br (Legislação Federal)
- https://www.stf.jus.br (STF)
- https://www.stj.jus.br (STJ)
- https://www.tst.jus.br (TST)
- https://www.cnj.jus.br (CNJ)
- Tribunais estaduais quando pertinente

Para prazo_estimado, considere os prazos processuais brasileiros e a duração média de processos similares.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text.trim().slice(0, 15000) },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "legal_analysis",
              description: "Retorna a análise jurídica estruturada do texto fornecido",
              parameters: {
                type: "object",
                properties: {
                  tipo_de_causa: { type: "string", description: "Tipo/categoria da causa jurídica" },
                  resumo: { type: "string", description: "Resumo claro e conciso da situação jurídica" },
                  legislacao_aplicavel: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        lei: { type: "string", description: "Nome da lei (ex: Código Civil)" },
                        artigos: { type: "array", items: { type: "string" }, description: "Artigos específicos aplicáveis" },
                      },
                      required: ["lei", "artigos"],
                      additionalProperties: false,
                    },
                  },
                  jurisdicao_competente: { type: "string", description: "Jurisdição competente para julgar" },
                  direcionamentos: {
                    type: "array",
                    items: { type: "string" },
                    description: "Passos recomendados para o caso",
                  },
                  portais_relevantes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        nome: { type: "string" },
                        url: { type: "string" },
                      },
                      required: ["nome", "url"],
                      additionalProperties: false,
                    },
                  },
                  complexidade: { type: "string", enum: ["simples", "moderado", "complexo"] },
                  urgencia: { type: "boolean", description: "Se o caso requer atenção urgente" },
                  prazo_estimado: { type: "string", description: "Prazo estimado para resolução" },
                },
                required: [
                  "tipo_de_causa", "resumo", "legislacao_aplicavel", "jurisdicao_competente",
                  "direcionamentos", "portais_relevantes", "complexidade", "urgencia", "prazo_estimado",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "legal_analysis" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", status, errText);
      throw new Error("Erro no serviço de IA");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("A IA não retornou uma análise válida");

    const result = JSON.parse(toolCall.function.arguments);

    // Save to database
    const { error: insertError } = await supabase.from("analyses").insert({
      user_id: user.id,
      input_text: text.trim().slice(0, 50000),
      file_name: file_name || null,
      result,
    });

    if (insertError) console.error("Insert error:", insertError);

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-legal-text error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
