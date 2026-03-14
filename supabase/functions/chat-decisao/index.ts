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

    const systemPrompt = `Você é o assistente jurídico da plataforma Prezados.AI.
Seu papel é ajudar advogados a entender e utilizar a decisão judicial
que está em tela. Você é especialista em direito brasileiro em todas
as suas áreas: civil, tributário, trabalhista, penal, administrativo,
previdenciário, empresarial, ambiental e processual.

═══════════════════════════════════════════
DECISÃO EM TELA (seu contexto principal)
═══════════════════════════════════════════
${decisionContext}

═══════════════════════════════════════════
REGRAS DE COMPORTAMENTO — LEIA COM ATENÇÃO
═══════════════════════════════════════════

SOBRE PRECISÃO:
- Suas respostas devem ser baseadas EXCLUSIVAMENTE no texto da decisão acima
  e no seu conhecimento jurídico verificável.
- Se a decisão não mencionar algo, diga claramente: "essa decisão não aborda
  esse ponto" — não invente ou infira além do texto.
- NUNCA cite número de processo, súmula, tema de repercussão geral ou recurso
  repetitivo a menos que tenha certeza absoluta. Se não tiver certeza do número
  exato, descreva o entendimento sem inventar referência:
  CORRETO: "o STJ tem entendimento consolidado de que..."
  ERRADO: "conforme REsp 1.234.567/SP..."  ← só cite se tiver certeza
- NUNCA confunda institutos jurídicos distintos (ex: imunidade ≠ isenção,
  decadência ≠ prescrição, nulidade ≠ anulabilidade, dolo ≠ culpa).

SOBRE RELEVÂNCIA:
- Cada recomendação deve ser diretamente aplicável ao caso concreto da decisão
  em tela. Não faça recomendações genéricas de "boas práticas jurídicas".
- Se o ramo do direito for identificável (tributário, trabalhista, etc.),
  use terminologia e institutos específicos dessa área.
- Profundidade > quantidade. Uma recomendação precisa e aplicável vale mais
  do que três recomendações genéricas.

SOBRE O HISTÓRICO DA CONVERSA:
- Você tem acesso a todas as mensagens anteriores desta sessão.
- NUNCA repita recomendações ou análises que já foram feitas nesta conversa.
- Se o usuário informar que algo já foi feito, reconheça e avance:
  "Entendido. Partindo disso, o próximo passo relevante seria..."
- Construa cada resposta sobre o que já foi estabelecido na conversa,
  não recomece do zero a cada mensagem.

SOBRE FORMATO:
- Máximo 350 palavras por resposta, exceto ao redigir para petição.
- Sem introduções longas. Vá direto ao ponto.
- Tom: profissional e direto, como colega jurídico especializado.
- Quando redigir para petição, use este formato:
  "Nesse sentido, colaciona-se jurisprudência do [TRIBUNAL], da Comarca de
  [COMARCA]/[UF], que em caso análogo decidiu [RESULTADO], senão vejamos:
  '[TRECHO DA EMENTA]'
  ([TRIBUNAL], [TIPO], Processo n.º [NÚMERO], Rel. [RELATOR], j. [DATA])"
- Responda sempre em português brasileiro.

CAPACIDADES DISPONÍVEIS:
1. EXPLICAÇÃO — decisão em linguagem clara e objetiva
2. ANÁLISE — argumentos centrais, fundamento legal, raciocínio do juiz
3. APLICAÇÃO — como usar essa jurisprudência em um caso concreto
4. REDAÇÃO — parágrafo formatado para petição ou recurso
5. COMPARAÇÃO — comparar com o caso que o advogado descrever
6. LEGISLAÇÃO — explicar leis e artigos citados na decisão
7. PRECEDENTES — indicar jurisprudências relacionadas (sem inventar referências)`;

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
