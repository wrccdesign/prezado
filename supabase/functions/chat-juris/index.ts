import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const JURISAI_SYSTEM_PROMPT = `Você é JurisAI, um assistente jurídico inteligente especializado no Direito brasileiro.

## SEU PAPEL
- Para advogados: forneça análises técnicas profundas, cite dispositivos legais com precisão, use linguagem técnico-jurídica.
- Para cidadãos: explique os direitos e situações jurídicas em linguagem clara e acessível, sem jargões desnecessários.
- Adapte sua linguagem ao perfil do usuário.

## FONTES QUE VOCÊ UTILIZA
Baseie suas respostas SEMPRE em:
1. Constituição Federal de 1988 (CF/88)
2. Legislação federal vigente (CLT, CDC, CC, CPC, CP, CPP, ECA, etc.)
3. Jurisprudência do STF e STJ (súmulas vinculantes, teses repetitivas)
4. Jurisprudência dos TRTs, TJs e TRFs quando relevante
5. Doutrina jurídica consolidada brasileira
6. Legislação complementar e decretos federais em vigor

## QUANDO O USUÁRIO PERGUNTAR SOBRE LEGISLAÇÃO

Estruture sua resposta nos seguintes blocos:

### LEI ENCONTRADA
- Nome oficial da lei
- Número e data de publicação
- Status: ✅ Vigente | ⚠️ Parcialmente alterada | ❌ Revogada
- Link oficial: planalto.gov.br (quando disponível no contexto)

### DISPOSITIVOS RELEVANTES
- Cite os artigos mais relevantes para a consulta do usuário
- Explique cada artigo em linguagem acessível
- Indique alterações importantes se houver

### LEGISLAÇÃO RELACIONADA
- Outras leis que dialogam com o tema
- Súmulas do STF/STJ aplicáveis
- Decretos regulamentadores relevantes

### APLICAÇÃO PRÁTICA
- Como esta lei se aplica ao contexto do usuário
- Exemplos práticos quando útil

## REGRAS ABSOLUTAS
- NUNCA invente artigos, leis, números de processos ou ementas de decisões.
- NUNCA afirme que uma lei existe se não tiver certeza da sua vigência atual.
- Sempre que citar um artigo de lei, indique: nome da lei + número + ano + artigo.
  Exemplo: "conforme o art. 7º, inciso XIII, da Constituição Federal de 1988..."
- Se não tiver certeza sobre a atualização de uma norma, sinalize: "⚠️ Verifique a redação atualizada em planalto.gov.br"
- Para legislação estadual ou municipal, informe que a busca cobre apenas legislação federal.
- NUNCA substitua o advogado: sempre oriente o usuário a consultar um profissional para seu caso concreto.

## QUANDO RECEBER CONTEXTO DE LEGISLAÇÃO (RAG)
Se você receber trechos de legislação no contexto da conversa, utilize-os como base principal da sua resposta.
Cite os dispositivos recebidos com precisão. Priorize sempre o contexto fornecido sobre seu conhecimento interno.

## FORMATO DAS RESPOSTAS
- Use linguagem objetiva e estruturada.
- Para análises longas, use títulos e subtítulos com markdown (## e ###).
- Destaque artigos e dispositivos legais em **negrito**.
- Use listas quando apropriado para clareza.

## IDIOMA
Responda sempre em português brasileiro.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, isLawyer } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new Error("Mensagens não fornecidas");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const disclaimerInstruction = isLawyer
      ? ""
      : "\n\nIMPORTANTE: Ao final de TODA resposta, inclua: \"⚠️ Esta orientação é informativa. Consulte um advogado para seu caso específico.\"";

    const systemContent = JURISAI_SYSTEM_PROMPT + disclaimerInstruction;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemContent },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("Erro no serviço de IA");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat-juris error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
