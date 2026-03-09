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
      { tipoNorma: "Decreto-Lei", numero: "3.689", ano: "1941", ementa: "Código de Processo Penal", url: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del3689compilado.htm" },
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
      { tipoNorma: "Lei", numero: "9.784", ano: "1999", ementa: "Lei do Processo Administrativo Federal", url: "https://www.planalto.gov.br/ccivil_03/leis/l9784.htm" },
    ],
    licitacao: [
      { tipoNorma: "Lei", numero: "14.133", ano: "2021", ementa: "Nova Lei de Licitações", url: "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14133.htm" },
    ],
    constituicao: [
      { tipoNorma: "Constituição", numero: "", ano: "1988", ementa: "Constituição da República Federativa do Brasil", url: "https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm" },
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
      { tipoNorma: "Lei", numero: "12.651", ano: "2012", ementa: "Código Florestal", url: "https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12651.htm" },
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
  return `\n\nLEGISLAÇÃO RELACIONADA (referência para consulta):\n${items}\n\nConsidere estas normas como referência quando pertinente na análise.`;
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

    const { text, file_name } = await req.json();
    if (!text || typeof text !== "string" || text.trim().length < 20) {
      throw new Error("Texto muito curto para análise");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Step 1: Extract keywords using AI
    let keywords: string[] = [];
    try {
      const keywordResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
              content: "Extraia de 2 a 5 termos jurídicos principais do texto para identificar a área do direito. Retorne APENAS os termos separados por vírgula, sem explicação. Ex: trabalho, rescisão, CLT, indenização",
            },
            { role: "user", content: text.trim().slice(0, 3000) },
          ],
        }),
      });

      if (keywordResponse.ok) {
        const kwData = await keywordResponse.json();
        keywords = kwData.choices?.[0]?.message?.content?.split(",").map((k: string) => k.trim()).filter(Boolean) || [];
        console.log("Extracted keywords:", keywords);
      }
    } catch (e) {
      console.error("Keyword extraction failed:", e);
    }

    // Step 2: Get relevant legislation based on keywords
    const normas = getLegislationByKeywords(keywords);
    const legislationContext = buildLegislationContext(normas);
    console.log(`Found ${normas.length} relevant legislation items`);

    // Step 3: Main analysis with legislation context
    const systemPrompt = `Você é JurisAI, especialista em análise de documentos jurídicos brasileiros.

## SUA TAREFA
Analise o texto jurídico fornecido pelo usuário com profundidade técnica e clareza, retornando uma análise estruturada.

## ESTRUTURA OBRIGATÓRIA DA ANÁLISE
Organize sua análise mental nos seguintes blocos antes de preencher o resultado:

1. **TIPO DE DOCUMENTO** - Identifique: petição inicial, contrato, sentença, acórdão, recurso, notificação, etc.
2. **PARTES ENVOLVIDAS** - Liste: autor/réu, contratante/contratado, recorrente/recorrido, etc.
3. **OBJETO PRINCIPAL** - Resuma em 2-3 linhas o que o documento trata.
4. **FUNDAMENTOS LEGAIS IDENTIFICADOS** - Liste todos os artigos, leis, súmulas e jurisprudências mencionadas. Verifique se as citações estão corretas e atuais.
5. **PONTOS CRÍTICOS / RISCOS** - Aponte: cláusulas abusivas (se contrato), vícios processuais (se peça processual), prazos importantes, inconsistências jurídicas.
6. **LEGISLAÇÃO COMPLEMENTAR SUGERIDA** - Indique legislação adicional relevante não citada no texto.
7. **RECOMENDAÇÕES** - Sugira ações ou melhorias objetivas.

## FONTES OBRIGATÓRIAS
Baseie suas respostas SEMPRE em:
1. Constituição Federal de 1988 (CF/88)
2. Legislação federal vigente (CLT, CDC, CC, CPC, CP, CPP, ECA, etc.)
3. Jurisprudência do STF e STJ (súmulas vinculantes, teses repetitivas)
4. Doutrina jurídica consolidada brasileira

## REGRAS ABSOLUTAS
- NUNCA invente artigos, leis, números de processos ou ementas de decisões.
- NUNCA afirme que uma lei existe se não tiver certeza da sua vigência atual.
- Cite sempre: Lei nº X/ANO, art. Y, inciso Z
  Exemplo: "conforme o art. 7º, inciso XIII, da Constituição Federal de 1988..."
- Se não tiver certeza sobre a atualização de uma norma, sinalize: "verifique a redação vigente no Planalto (planalto.gov.br)"
- Se receber contexto de legislação via RAG, priorize essas informações.

## FORMATO DE SAÍDA
- Use linguagem técnica para advogados, simplificada para cidadãos.
- Ao fornecer portais_relevantes, inclua links reais:
  - https://www.planalto.gov.br (Legislação Federal)
  - https://www.stf.jus.br (STF)
  - https://www.stj.jus.br (STJ)
  - https://www.tst.jus.br (TST)
  - https://www.cnj.jus.br (CNJ)
- Para prazo_estimado, considere prazos processuais brasileiros e duração média de processos similares.

Responda sempre em português brasileiro.${legislationContext}`;

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
