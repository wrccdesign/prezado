import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NormaResumo {
  tipoNorma: string;
  numero: string;
  ano: string;
  ementa: string;
  url: string;
}

function getLegislationByKeywords(keywords: string[]): NormaResumo[] {
  const staticLaws: Record<string, NormaResumo[]> = {
    trabalho: [
      { tipoNorma: "Decreto-Lei", numero: "5.452", ano: "1943", ementa: "Consolidação das Leis do Trabalho - CLT", url: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm" },
      { tipoNorma: "Lei", numero: "13.467", ano: "2017", ementa: "Reforma Trabalhista", url: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2017/lei/l13467.htm" },
    ],
    clt: [{ tipoNorma: "Decreto-Lei", numero: "5.452", ano: "1943", ementa: "CLT", url: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm" }],
    consumidor: [{ tipoNorma: "Lei", numero: "8.078", ano: "1990", ementa: "Código de Defesa do Consumidor", url: "https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm" }],
    cdc: [{ tipoNorma: "Lei", numero: "8.078", ano: "1990", ementa: "CDC", url: "https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm" }],
    civil: [{ tipoNorma: "Lei", numero: "10.406", ano: "2002", ementa: "Código Civil", url: "https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm" }],
    contrato: [{ tipoNorma: "Lei", numero: "10.406", ano: "2002", ementa: "Código Civil - Contratos", url: "https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm" }],
    processo: [{ tipoNorma: "Lei", numero: "13.105", ano: "2015", ementa: "Código de Processo Civil", url: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm" }],
    indenizacao: [{ tipoNorma: "Lei", numero: "10.406", ano: "2002", ementa: "Código Civil - Responsabilidade Civil", url: "https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm" }],
    dano: [{ tipoNorma: "Lei", numero: "10.406", ano: "2002", ementa: "Código Civil - Responsabilidade Civil", url: "https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm" }],
    locacao: [{ tipoNorma: "Lei", numero: "8.245", ano: "1991", ementa: "Lei do Inquilinato", url: "https://www.planalto.gov.br/ccivil_03/leis/l8245.htm" }],
    familia: [{ tipoNorma: "Lei", numero: "10.406", ano: "2002", ementa: "Código Civil - Família", url: "https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm" }],
    alimentos: [{ tipoNorma: "Lei", numero: "5.478", ano: "1968", ementa: "Lei de Alimentos", url: "https://www.planalto.gov.br/ccivil_03/leis/l5478.htm" }],
    despejo: [{ tipoNorma: "Lei", numero: "8.245", ano: "1991", ementa: "Lei do Inquilinato", url: "https://www.planalto.gov.br/ccivil_03/leis/l8245.htm" }],
    cobranca: [{ tipoNorma: "Lei", numero: "13.105", ano: "2015", ementa: "CPC - Ação de Cobrança", url: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm" }],
    rescisao: [{ tipoNorma: "Decreto-Lei", numero: "5.452", ano: "1943", ementa: "CLT - Rescisão", url: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm" }],
  };

  const results: NormaResumo[] = [];
  const seen = new Set<string>();
  for (const keyword of keywords) {
    const kw = keyword.toLowerCase().trim();
    for (const [key, laws] of Object.entries(staticLaws)) {
      if (kw.includes(key) || key.includes(kw)) {
        for (const law of laws) {
          const lawKey = `${law.tipoNorma}-${law.numero}-${law.ano}`;
          if (!seen.has(lawKey)) { seen.add(lawKey); results.push(law); }
        }
      }
    }
  }
  return results.slice(0, 5);
}

function buildLegislationContext(normas: NormaResumo[]): string {
  if (normas.length === 0) return "";
  const items = normas.map((n) => `- ${n.tipoNorma} nº ${n.numero}/${n.ano}: ${n.ementa} (${n.url})`).join("\n");
  return `\n\nLEGISLAÇÃO RELACIONADA:\n${items}\n\nCite estas normas adequadamente na petição quando pertinente.`;
}

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

    const body = await req.json();
    
    // Support both new simplified form and legacy form
    const tipo_acao = body.tipo_acao || body.petition_type || "";
    const vara_juizo = body.vara_juizo || body.vara || "";
    const fatos = body.fatos || "";
    const pedidos = body.pedidos || "";
    // Legacy fields (optional)
    const autor = body.autor || "";
    const reu = body.reu || "";
    const fundamentos = body.fundamentos || "";
    const comarca = body.comarca || "";

    if (!fatos || !pedidos) {
      throw new Error("Campos obrigatórios não preenchidos (fatos e pedidos)");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Extract keywords
    const combinedText = `${tipo_acao} ${fatos} ${pedidos}`;
    let keywords: string[] = [];
    try {
      const kwResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: "Extraia de 2 a 5 termos jurídicos principais do texto para identificar a área do direito. Retorne APENAS os termos separados por vírgula." },
            { role: "user", content: combinedText.slice(0, 3000) },
          ],
        }),
      });
      if (kwResponse.ok) {
        const kwData = await kwResponse.json();
        keywords = kwData.choices?.[0]?.message?.content?.split(",").map((k: string) => k.trim()).filter(Boolean) || [];
      }
    } catch (e) { console.error("Keyword extraction failed:", e); }

    const normas = getLegislationByKeywords(keywords);
    const legislationContext = buildLegislationContext(normas);

    const systemPrompt = `Você é Prezado.ai, especialista em redação de peças processuais e documentos jurídicos brasileiros.

## IMPORTANTE: INFERIR FUNDAMENTOS JURÍDICOS
Seu papel é receber os FATOS e PEDIDOS do advogado e INFERIR toda a fundamentação jurídica adequada.
O advogado NÃO precisa fornecer os fundamentos — isso é trabalho da IA.

## REGRAS ABSOLUTAS
- NUNCA invente artigos, leis, números de processos ou ementas de decisões.
- Sempre que citar um artigo de lei, use o formato: "nos termos do art. X da Lei nº Y/ANO..."
- Se não tiver certeza sobre a atualização de uma norma, sinalize: "verifique a redação vigente no Planalto (planalto.gov.br)"

## ESTRUTURA OBRIGATÓRIA DA PETIÇÃO

### 1. CABEÇALHO
- Endereçamento ao juízo competente
- Se os dados das partes forem fornecidos, qualifique-as. Caso contrário, deixe campos em branco para preenchimento: [NOME], [CPF/CNPJ], [ENDEREÇO], etc.

### 2. DOS FATOS
- Narrativa clara, objetiva e cronológica

### 3. DO DIREITO
- Fundamentação legal INFERIDA com base nos fatos apresentados
- Cite com precisão artigos de lei relevantes
- Integre a legislação do contexto RAG
- Jurisprudência relevante quando disponível

### 4. DOS PEDIDOS
- Numerados e específicos
- Incluir tutela de urgência quando os fatos justificarem
- Valor da causa fundamentado

### 5. DO FECHO
- Local e data (deixar em branco para preenchimento)
- Espaço para assinatura do advogado

## QUALIDADE DA PEÇA
- Linguagem formal e técnica
- NÃO use markdown. Use texto plano com formatação por espaçamento e indentação.

## AVISO FINAL OBRIGATÓRIO
"---
⚠️ IMPORTANTE: Esta peça foi gerada por inteligência artificial como modelo de referência. Deve ser revisada, adaptada e assinada por advogado habilitado perante a OAB antes do protocolo."${legislationContext}`;

    const userPrompt = `Gere uma petição inicial para o seguinte caso:

TIPO DE AÇÃO: ${tipo_acao || "A definir com base nos fatos"}
VARA/JUÍZO: ${vara_juizo || "A definir"}
${comarca ? `COMARCA: ${comarca}` : ""}
${autor ? `\nAUTOR/REQUERENTE: ${autor}` : ""}
${reu ? `\nRÉU/REQUERIDO: ${reu}` : ""}

FATOS (o que aconteceu):
${fatos}

${fundamentos ? `FUNDAMENTOS ADICIONAIS DO ADVOGADO:\n${fundamentos}\n` : ""}
PEDIDO PRINCIPAL (o que o cliente quer):
${pedidos}

INSTRUÇÕES: Com base nos fatos acima, INFIRA e SUGIRA toda a fundamentação jurídica adequada. O advogado NÃO forneceu os fundamentos — isso é seu trabalho.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
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
      if (status === 429) return new Response(JSON.stringify({ error: "Limite de requisições excedido." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Créditos insuficientes." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const errText = await response.text();
      console.error("AI gateway error:", status, errText);
      throw new Error("Erro no serviço de IA");
    }

    const aiData = await response.json();
    const generatedText = aiData.choices?.[0]?.message?.content;
    if (!generatedText) throw new Error("A IA não retornou um texto válido");

    const formData = { tipo_acao, vara_juizo, fatos, pedidos, autor, reu, fundamentos, comarca };

    const { error: insertError } = await supabase.from("petitions").insert({
      user_id: user.id,
      petition_type: tipo_acao || "Petição Inicial",
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
