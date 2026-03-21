import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é Prezado.ai, um assistente jurídico inteligente especializado no Direito brasileiro.

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

## FONTES DE CONSULTA FIXAS
Ao recomendar fontes, use APENAS estes portais verificados:
- STJ Jurisprudência: https://scon.stj.jus.br/SCON/
- STF Jurisprudência: https://jurisprudencia.stf.jus.br/
- JusBrasil: https://www.jusbrasil.com.br/jurisprudencia
- Planalto (Legislação): https://www.planalto.gov.br
- CNJ: https://www.cnj.jus.br
NUNCA gere URLs dinâmicas ou invente links.

## CITAÇÃO DE ARTIGOS DE LEI
Sempre que citar um artigo, use o formato:
- **Art. X da Lei nº Y/ANO**
Destaque artigos citados em **negrito** para fácil identificação visual.

## INDICADOR DE CONFIABILIDADE
Ao final de TODA resposta, inclua um indicador de confiabilidade:

📊 **Confiabilidade da resposta:**
- 🟢 **Alta** — Baseada em legislação vigente consolidada e jurisprudência pacificada
- 🟡 **Média** — Tema com interpretações divergentes ou legislação recente
- 🔴 **Baixa** — Tema sem legislação específica ou com posicionamentos conflitantes

Escolha o nível adequado e justifique brevemente.

## METADADOS (OBRIGATÓRIO)
Ao final absoluto de TODA resposta, após o indicador de confiabilidade, adicione um comentário HTML invisível com metadados:
<!-- META: {"area": "área do direito detectada", "leis": ["Lei nº X/ANO", "Lei nº Y/ANO"]} -->

## REGRAS ABSOLUTAS
- NUNCA invente artigos, leis, números de processos ou ementas de decisões.
- NUNCA afirme que uma lei existe se não tiver certeza da sua vigência atual.
- NUNCA gere URLs dinâmicas. Use apenas os portais fixos listados acima.
- Sempre que citar um artigo de lei, indique: nome da lei + número + ano + artigo.
- Se não tiver certeza sobre a atualização de uma norma, sinalize: "⚠️ Verifique a redação atualizada em planalto.gov.br"
- Para legislação estadual ou municipal, informe que a busca cobre apenas legislação federal.
- NUNCA substitua o advogado: sempre oriente o usuário a consultar um profissional para seu caso concreto.

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

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Optional auth — rate limit only if user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const supa = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supa.auth.getUser(token);
      if (user) {
        const { allowed, used, limit } = await checkRateLimit(user.id, "chat", SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        if (!allowed) {
          return new Response(JSON.stringify({
            error: `Limite diário de ${limit} mensagens atingido. Faça upgrade para continuar.`,
            limit_reached: true, used, limit,
          }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const disclaimerInstruction = isLawyer
      ? ""
      : "\n\nIMPORTANTE: Ao final de TODA resposta, inclua: \"⚠️ Esta orientação é informativa. Consulte um advogado para seu caso específico.\"";

    const systemContent = SYSTEM_PROMPT + disclaimerInstruction;

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
