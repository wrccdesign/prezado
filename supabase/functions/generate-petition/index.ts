import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    clt: [
      { tipoNorma: "Decreto-Lei", numero: "5.452", ano: "1943", ementa: "Consolidação das Leis do Trabalho - CLT", url: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm" },
    ],
    consumidor: [
      { tipoNorma: "Lei", numero: "8.078", ano: "1990", ementa: "Código de Defesa do Consumidor", url: "https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm" },
    ],
    cdc: [
      { tipoNorma: "Lei", numero: "8.078", ano: "1990", ementa: "Código de Defesa do Consumidor", url: "https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm" },
    ],
    civil: [
      { tipoNorma: "Lei", numero: "10.406", ano: "2002", ementa: "Código Civil", url: "https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm" },
    ],
    contrato: [
      { tipoNorma: "Lei", numero: "10.406", ano: "2002", ementa: "Código Civil - Parte Especial: Contratos", url: "https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm" },
    ],
    processo: [
      { tipoNorma: "Lei", numero: "13.105", ano: "2015", ementa: "Código de Processo Civil", url: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm" },
    ],
    cpc: [
      { tipoNorma: "Lei", numero: "13.105", ano: "2015", ementa: "Código de Processo Civil", url: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm" },
    ],
    penal: [
      { tipoNorma: "Decreto-Lei", numero: "2.848", ano: "1940", ementa: "Código Penal", url: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm" },
    ],
    crime: [
      { tipoNorma: "Decreto-Lei", numero: "2.848", ano: "1940", ementa: "Código Penal", url: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm" },
    ],
    familia: [
      { tipoNorma: "Lei", numero: "10.406", ano: "2002", ementa: "Código Civil - Livro IV (Direito de Família)", url: "https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm" },
      { tipoNorma: "Lei", numero: "8.069", ano: "1990", ementa: "Estatuto da Criança e do Adolescente", url: "https://www.planalto.gov.br/ccivil_03/leis/l8069.htm" },
    ],
    divorcio: [
      { tipoNorma: "Lei", numero: "10.406", ano: "2002", ementa: "Código Civil - Livro IV (Direito de Família)", url: "https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm" },
    ],
    alimentos: [
      { tipoNorma: "Lei", numero: "5.478", ano: "1968", ementa: "Lei de Alimentos", url: "https://www.planalto.gov.br/ccivil_03/leis/l5478.htm" },
    ],
    tributario: [
      { tipoNorma: "Lei", numero: "5.172", ano: "1966", ementa: "Código Tributário Nacional", url: "https://www.planalto.gov.br/ccivil_03/leis/l5172compilado.htm" },
    ],
    imposto: [
      { tipoNorma: "Lei", numero: "5.172", ano: "1966", ementa: "Código Tributário Nacional", url: "https://www.planalto.gov.br/ccivil_03/leis/l5172compilado.htm" },
    ],
    administrativo: [
      { tipoNorma: "Lei", numero: "14.133", ano: "2021", ementa: "Nova Lei de Licitações", url: "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14133.htm" },
    ],
    licitacao: [
      { tipoNorma: "Lei", numero: "14.133", ano: "2021", ementa: "Nova Lei de Licitações", url: "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14133.htm" },
    ],
    indenizacao: [
      { tipoNorma: "Lei", numero: "10.406", ano: "2002", ementa: "Código Civil - Responsabilidade Civil", url: "https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm" },
    ],
    dano: [
      { tipoNorma: "Lei", numero: "10.406", ano: "2002", ementa: "Código Civil - Responsabilidade Civil", url: "https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm" },
    ],
    locacao: [
      { tipoNorma: "Lei", numero: "8.245", ano: "1991", ementa: "Lei do Inquilinato", url: "https://www.planalto.gov.br/ccivil_03/leis/l8245.htm" },
    ],
    inquilinato: [
      { tipoNorma: "Lei", numero: "8.245", ano: "1991", ementa: "Lei do Inquilinato", url: "https://www.planalto.gov.br/ccivil_03/leis/l8245.htm" },
    ],
    previdencia: [
      { tipoNorma: "Lei", numero: "8.213", ano: "1991", ementa: "Lei de Benefícios da Previdência Social", url: "https://www.planalto.gov.br/ccivil_03/leis/l8213cons.htm" },
    ],
    aposentadoria: [
      { tipoNorma: "Lei", numero: "8.213", ano: "1991", ementa: "Lei de Benefícios da Previdência Social", url: "https://www.planalto.gov.br/ccivil_03/leis/l8213cons.htm" },
    ],
    falencia: [
      { tipoNorma: "Lei", numero: "11.101", ano: "2005", ementa: "Lei de Recuperação Judicial e Falência", url: "https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2005/lei/l11101.htm" },
    ],
    recuperacao: [
      { tipoNorma: "Lei", numero: "11.101", ano: "2005", ementa: "Lei de Recuperação Judicial e Falência", url: "https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2005/lei/l11101.htm" },
    ],
    execucao: [
      { tipoNorma: "Lei", numero: "13.105", ano: "2015", ementa: "Código de Processo Civil - Livro II: Execução", url: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm" },
    ],
    ambiental: [
      { tipoNorma: "Lei", numero: "9.605", ano: "1998", ementa: "Lei de Crimes Ambientais", url: "https://www.planalto.gov.br/ccivil_03/leis/l9605.htm" },
    ],
    rescisao: [
      { tipoNorma: "Decreto-Lei", numero: "5.452", ano: "1943", ementa: "CLT - Rescisão de Contrato de Trabalho", url: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm" },
    ],
    despejo: [
      { tipoNorma: "Lei", numero: "8.245", ano: "1991", ementa: "Lei do Inquilinato - Ação de Despejo", url: "https://www.planalto.gov.br/ccivil_03/leis/l8245.htm" },
    ],
    cobranca: [
      { tipoNorma: "Lei", numero: "13.105", ano: "2015", ementa: "Código de Processo Civil - Ação de Cobrança", url: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm" },
    ],
  };

  const results: NormaResumo[] = [];
  const seen = new Set<string>();

  for (const keyword of keywords) {
    const kw = keyword.toLowerCase().trim();
    for (const [key, laws] of Object.entries(staticLaws)) {
      if (kw.includes(key) || key.includes(kw)) {
        for (const law of laws) {
          const lawKey = `${law.tipoNorma}-${law.numero}-${law.ano}`;
          if (!seen.has(lawKey)) {
            seen.add(lawKey);
            results.push(law);
          }
        }
      }
    }
  }

  return results.slice(0, 5);
}

function buildLegislationContext(normas: NormaResumo[]): string {
  if (normas.length === 0) return "";
  const items = normas.map(
    (n) => `- ${n.tipoNorma} nº ${n.numero}/${n.ano}: ${n.ementa} (${n.url})`
  ).join("\n");
  return `\n\nLEGISLAÇÃO RELACIONADA (referência para consulta):\n${items}\n\nCite estas normas adequadamente na petição quando pertinente.`;
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

    const { petition_type, autor, reu, fatos, fundamentos, pedidos, comarca, vara } = await req.json();

    if (!petition_type || !autor || !reu || !fatos || !pedidos) {
      throw new Error("Campos obrigatórios não preenchidos");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Extract keywords from case details
    const combinedText = `${petition_type} ${fatos} ${fundamentos || ""} ${pedidos}`;
    let keywords: string[] = [];

    try {
      const kwResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content: "Extraia de 2 a 5 termos jurídicos principais do texto para identificar a área do direito. Retorne APENAS os termos separados por vírgula, sem explicação.",
            },
            { role: "user", content: combinedText.slice(0, 3000) },
          ],
        }),
      });

      if (kwResponse.ok) {
        const kwData = await kwResponse.json();
        keywords = kwData.choices?.[0]?.message?.content?.split(",").map((k: string) => k.trim()).filter(Boolean) || [];
        console.log("Extracted keywords for petition:", keywords);
      }
    } catch (e) {
      console.error("Keyword extraction failed:", e);
    }

    // Get relevant legislation
    const normas = getLegislationByKeywords(keywords);
    const legislationContext = buildLegislationContext(normas);
    console.log(`Found ${normas.length} relevant legislation items for petition`);

    const systemPrompt = `Você é JurisAI, especialista em redação de peças processuais e documentos jurídicos brasileiros.

## REGRAS ABSOLUTAS
- NUNCA invente artigos, leis, números de processos ou ementas de decisões.
- NUNCA afirme que uma lei existe se não tiver certeza da sua vigência atual.
- Sempre que citar um artigo de lei, use o formato: "nos termos do art. X da Lei nº Y/ANO..."
- Se não tiver certeza sobre a atualização de uma norma, sinalize: "verifique a redação vigente no Planalto (planalto.gov.br)"

## ESTRUTURA OBRIGATÓRIA DA PETIÇÃO

### 1. CABEÇALHO
- Endereçamento ao juízo competente (Ex: "EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA ___ VARA...")
- Qualificação completa das partes (nome, nacionalidade, estado civil, profissão, CPF/CNPJ, endereço)

### 2. DOS FATOS
- Narrativa clara, objetiva e cronológica dos acontecimentos
- Linguagem formal sem redundâncias

### 3. DO DIREITO
- Fundamentação legal com citação precisa de artigos de lei
- Integre naturalmente a legislação fornecida no contexto RAG
- Jurisprudência relevante quando disponível
- Doutrina quando aplicável
- Argumentação lógica e progressiva

### 4. DOS PEDIDOS
- Numerados e específicos
- Incluir pedido de tutela de urgência quando os fatos justificarem
- Valor da causa fundamentado
- Pedidos coerentes com os fatos narrados e o direito invocado

### 5. DO FECHO
- Local e data
- Espaço para assinatura do advogado
- Nome e número da OAB

## USO DO CONTEXTO RAG
Quando receber trechos de legislação no contexto:
- Integre-os naturalmente na seção "Do Direito"
- Cite com precisão: "nos termos do art. X da Lei nº Y/ANO..."
- Construa argumentação sólida baseada nesses dispositivos

## QUALIDADE DA PEÇA
- Linguagem formal e técnica
- Sem redundâncias
- Paragrafação clara
- Argumentação lógica e progressiva
- NÃO use markdown. Use texto plano com formatação por espaçamento e indentação.

## AVISO FINAL OBRIGATÓRIO
Ao final de toda peça, adicione:
"---
⚠️ IMPORTANTE: Esta peça foi gerada por inteligência artificial como modelo de referência. Deve ser revisada, adaptada e assinada por advogado habilitado perante a OAB antes do protocolo."${legislationContext}`;

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
