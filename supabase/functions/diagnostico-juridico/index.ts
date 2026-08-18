import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { burstLimitMessage, checkRateLimit, extractEnv, monthlyLimitMessage } from "../_shared/rate-limit.ts";
import { fetchGroundingContext, buildGroundingBlock } from "../_shared/grounding.ts";
import { aiChatTool, AIError } from "../_shared/ai.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-payment-env, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    // Rate limit check
    const env = extractEnv(req);
    const { allowed, used, limit, plan, renewsAt, burstLimited } = await checkRateLimit(user.id, "diagnostico", supabaseUrl, supabaseKey, env);
    if (!allowed) {
      return new Response(JSON.stringify({
        error: burstLimited ? burstLimitMessage() : monthlyLimitMessage("diagnostico", limit, plan),
        limit_reached: !burstLimited, burst_limit: burstLimited === true, used, limit, plan, renews_at: renewsAt, upgrade_url: "/planos",
      }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { situacao } = await req.json();
    if (!situacao || typeof situacao !== "string" || situacao.trim().length < 20) {
      throw new Error("Descreva sua situação com mais detalhes (mínimo 20 caracteres)");
    }




    // Grounding: fetch relevant decisions
    const grounding = await fetchGroundingContext(situacao, supabaseUrl, supabaseKey, 4);
    const groundingBlock = buildGroundingBlock(grounding);

    const systemPrompt = `Você é um assistente jurídico brasileiro especializado em orientar cidadãos comuns que NÃO têm conhecimento jurídico.

## SUA MISSÃO
Receber uma descrição de situação em linguagem popular e retornar um diagnóstico jurídico completo, mas em linguagem 100% acessível. Imagine que está explicando para alguém que nunca teve contato com o sistema jurídico.

## REGRAS DE LINGUAGEM
- NUNCA use jargões jurídicos sem explicar o que significam
- Use comparações do dia a dia quando possível
- Seja empático e acolhedor
- Trate o usuário como "você"
- Explique artigos de lei como se estivesse conversando

## FONTES
Baseie-se SEMPRE em legislação brasileira vigente:
- Constituição Federal de 1988
- CLT, CDC, Código Civil, CPC, etc.
- Jurisprudência do STF e STJ
- NUNCA invente artigos, leis, números de processo ou súmulas. Se tiver dúvida sobre o número exato de um artigo, prefira dizer o tema ("o CDC protege contra cobrança indevida") em vez de arriscar um número errado.
- Você SÓ pode citar jurisprudência específica (número de processo, ementa) que esteja listada no CONTEXTO OBRIGATÓRIO abaixo. Se o contexto estiver vazio ou irrelevante, apenas mencione a lei em geral.

## FORMATO
Use a ferramenta diagnostico_juridico para estruturar a resposta.${groundingBlock}`;

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
          { role: "user", content: `Minha situação: ${situacao.trim().slice(0, 5000)}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "diagnostico_juridico",
              description: "Retorna diagnóstico jurídico estruturado em linguagem acessível",
              parameters: {
                type: "object",
                properties: {
                  o_que_esta_acontecendo: {
                    type: "string",
                    description: "Explicação clara e simples do que está acontecendo juridicamente, sem jargões. 3-5 frases."
                  },
                  qual_seu_direito: {
                    type: "string",
                    description: "Qual é o direito da pessoa, citando o artigo de lei mas explicando de forma simples. Ex: 'A lei (art. 477 da CLT) diz que quando você é demitido, a empresa tem 10 dias para pagar tudo que deve.'"
                  },
                  o_que_voce_pode_fazer: {
                    type: "array",
                    items: { type: "string" },
                    description: "Passo a passo prático do que a pessoa pode fazer. Cada item é uma ação clara e específica."
                  },
                  estimativa_custos_ganhos: {
                    type: "string",
                    description: "Estimativa de quanto pode custar o processo e/ou quanto pode ganhar. Seja honesto sobre incertezas."
                  },
                  onde_entrar: {
                    type: "string",
                    description: "Onde a pessoa deve ir: Juizado Especial, Vara Trabalhista, Vara Cível, Delegacia, PROCON, etc. Com explicação de como encontrar."
                  },
                  urgencia: {
                    type: "string",
                    enum: ["baixa", "media", "alta"],
                    description: "Nível de urgência do caso"
                  },
                  explicacao_urgencia: {
                    type: "string",
                    description: "Por que o caso tem esse nível de urgência. Mencione prazos se houver."
                  },
                  area_do_direito: {
                    type: "string",
                    description: "Área do direito (trabalhista, civil, consumidor, família, criminal, previdenciário, etc.)"
                  },
                  tipo_peticao_sugerida: {
                    type: "string",
                    description: "Tipo de petição que poderia ser gerada para este caso (trabalhista, civil, consumidor, etc.)"
                  }
                },
                required: [
                  "o_que_esta_acontecendo", "qual_seu_direito", "o_que_voce_pode_fazer",
                  "estimativa_custos_ganhos", "onde_entrar", "urgencia", "explicacao_urgencia",
                  "area_do_direito", "tipo_peticao_sugerida"
                ],
                additionalProperties: false
              }
            }
          }
      ],
      tool_choice: { type: "function", function: { name: "diagnostico_juridico" } },
    });

    if (!diagnostico) throw new Error("Não foi possível gerar o diagnóstico");

    return new Response(JSON.stringify({ diagnostico, citations: grounding }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("diagnostico-juridico error:", e);
    const status = e instanceof AIError ? e.status : 500;
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
