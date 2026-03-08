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

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    const { petition_type, autor, reu, fatos, fundamentos, pedidos, comarca, vara } = await req.json();

    if (!petition_type || !autor || !reu || !fatos || !pedidos) {
      throw new Error("Campos obrigatórios não preenchidos");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `Você é um advogado brasileiro experiente especializado em redigir petições jurídicas.
Gere uma petição completa, formal e bem estruturada seguindo os padrões do direito brasileiro.

A petição DEVE conter:
- Endereçamento correto ao juízo competente
- Qualificação completa das partes
- Dos Fatos (narrativa organizada cronologicamente)
- Do Direito / Dos Fundamentos Jurídicos (com citação de artigos de lei, jurisprudência e doutrina quando pertinente)
- Dos Pedidos (numerados e específicos)
- Valor da causa (quando aplicável)
- Requerimentos finais
- Local, data e assinatura

Use linguagem jurídica formal e técnica. Cite legislação brasileira específica (CF/88, CC, CPC, CDC, CLT, CP, etc.).
Formate o texto com parágrafos claros e espaçamento adequado.
NÃO use markdown. Use texto plano com formatação por espaçamento e indentação.`;

    const userPrompt = `Gere uma ${petition_type} com os seguintes dados:

AUTOR/REQUERENTE: ${autor}

RÉU/REQUERIDO: ${reu}

COMARCA: ${comarca || "A definir"}
VARA: ${vara || "A definir"}

FATOS:
${fatos}

${fundamentos ? `FUNDAMENTOS JURÍDICOS:\n${fundamentos}` : ""}

PEDIDOS:
${pedidos}`;

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
          { role: "user", content: userPrompt },
        ],
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
    const generatedText = aiData.choices?.[0]?.message?.content;
    if (!generatedText) throw new Error("A IA não retornou um texto válido");

    const formData = { petition_type, autor, reu, fatos, fundamentos, pedidos, comarca, vara };

    const { error: insertError } = await supabase.from("petitions").insert({
      user_id: user.id,
      petition_type,
      form_data: formData,
      generated_text: generatedText,
    });

    if (insertError) console.error("Insert error:", insertError);

    return new Response(JSON.stringify({ generated_text: generatedText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-petition error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
