import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, decisionId } = await req.json();
    if (!decisionId) throw new Error("decisionId is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch the decision from DB
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: decision, error: dbError } = await supabase
      .from("decisions")
      .select("*")
      .eq("id", decisionId)
      .single();

    if (dbError || !decision) {
      return new Response(JSON.stringify({ error: "Decisão não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const decisionContext = `
DECISÃO JUDICIAL EM ANÁLISE:
- Tribunal: ${decision.tribunal || "N/I"}
- Instância: ${decision.instancia || "N/I"}
- UF: ${decision.uf || "N/I"}
- Comarca: ${decision.comarca || "N/I"}
- Nº Processo: ${decision.numero_processo || "N/I"}
- Data: ${decision.data_decisao || "N/I"}
- Relator: ${decision.relator || "N/I"}
- Tipo: ${decision.tipo_decisao || "N/I"}
- Resultado: ${decision.resultado || "N/I"} — ${decision.resultado_descricao || ""}
- Temas: ${(decision.temas_juridicos || []).join(", ") || "N/I"}
- Ramos do Direito: ${(decision.ramos_direito || []).join(", ") || "N/I"}
- Legislação Citada: ${(decision.legislacao_citada || []).join(", ") || "N/I"}

EMENTA:
${decision.ementa || "Não disponível"}

RESUMO IA:
${decision.resumo_ia || "Não disponível"}

TEXTO COMPLETO:
${decision.full_text || "Não disponível"}
`.trim();

    const systemPrompt = `Você é um assistente jurídico especializado em análise de jurisprudência brasileira. Você tem acesso à decisão judicial abaixo e deve ajudar o advogado a entendê-la e utilizá-la.

${decisionContext}

SUAS CAPACIDADES:
1. **Explicar** a decisão em linguagem clara, destacando ratio decidendi e obiter dicta
2. **Analisar** os fundamentos jurídicos, identificando teses e argumentos-chave
3. **Redigir parágrafos** prontos para uso em petições, citando corretamente a decisão
4. **Comparar** com situações fáticas descritas pelo advogado, apontando semelhanças e diferenças
5. **Identificar** legislação aplicável e precedentes relacionados
6. **Sugerir** estratégias processuais baseadas no entendimento da decisão

REGRAS:
- Sempre cite o número do processo, tribunal e data ao referenciar a decisão
- Use linguagem técnica jurídica precisa mas acessível
- Quando redigir para petição, use formatação adequada (citações em itálico, referências completas)
- Se não souber algo, diga explicitamente — nunca invente informações
- Responda em português brasileiro`;

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
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat-decisao error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
