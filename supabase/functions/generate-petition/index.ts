import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { burstLimitMessage, checkRateLimit, extractEnv, monthlyLimitMessage } from "../_shared/rate-limit.ts";
import { fetchGroundingContext, type GroundingDecision } from "../_shared/grounding.ts";
import { searchLegislation, type NormaResumo } from "../_shared/legislation-search.ts";
import { aiChatText, AIError } from "../_shared/ai.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-payment-env, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildLegislationContext(normas: NormaResumo[]): string {
  if (normas.length === 0) return "";
  const items = normas.map((n) => `- ${n.tipoNorma} nº ${n.numero}/${n.ano}: ${n.ementa} (${n.url})`).join("\n");
  return `\n\nLEGISLAÇÃO RELACIONADA:\n${items}\n\nCite estas normas adequadamente na petição quando pertinente.`;
}

function buildPrecedentsBlock(precedents: GroundingDecision[]): string {
  return precedents.length > 0
    ? `\n\nPRECEDENTES DISPONÍVEIS NO NOSSO BANCO (você SÓ pode citar estes; caso nenhum sirva, omita a seção "Precedentes"):
${precedents.map((p, i) => `[P${i + 1}] ${[p.tribunal, p.numero_processo, p.comarca, p.data_decisao].filter(Boolean).join(" · ")}\n"${(p.ementa || "").slice(0, 400)}"`).join("\n\n")}`
    : `\n\nATENÇÃO: Não foram encontrados precedentes específicos no nosso banco para este caso. NÃO invente números de processo, ementas ou súmulas. Baseie a fundamentação apenas na legislação.`;
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

    // Rate limit check
    const env = extractEnv(req);
    const body = await req.json();

    const stage: string = body.stage || "final";
    const approvedKeywords: string[] | undefined = Array.isArray(body.approved_keywords) ? body.approved_keywords : undefined;
    const approvedNormas: NormaResumo[] | undefined = Array.isArray(body.approved_normas) ? body.approved_normas : undefined;
    const approvedPrecedentIds: string[] | undefined = Array.isArray(body.approved_precedent_ids) ? body.approved_precedent_ids : undefined;
    const hasApproved = approvedKeywords !== undefined || approvedNormas !== undefined || approvedPrecedentIds !== undefined;

    // Etapas de preparação não consomem a cota mensal de petições — só a trava
    // de rajada. A geração final continua debitando `peticao`.
    const isPreview = stage === "enquadramento" || stage === "fundamentacao" || stage === "precedentes";
    const rateAction = isPreview ? "peticao_preview" : "peticao";
    {
      const { allowed, used, limit, plan, renewsAt, burstLimited } = await checkRateLimit(user.id, rateAction, supabaseUrl, supabaseKey, env);
      if (!allowed) {
        return new Response(JSON.stringify({
          error: burstLimited ? burstLimitMessage() : monthlyLimitMessage(rateAction, limit, plan),
          limit_reached: !burstLimited, burst_limit: burstLimited === true, used, limit, plan, renews_at: renewsAt, upgrade_url: "/planos",
        }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

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

    const extractKeywords = async (text: string): Promise<string[]> => {
      try {
        const kwText = await aiChatText({
          model: "light",
          functionName: "generate-petition",
          userId: user.id,
          environment: env,
          messages: [
            { role: "system", content: "Extraia de 2 a 5 termos jurídicos principais do texto para identificar a área do direito. Retorne APENAS os termos separados por vírgula." },
            { role: "user", content: text.slice(0, 3000) },
          ],
        });
        return kwText.split(",").map((k: string) => k.trim()).filter(Boolean);
      } catch (e) {
        console.error("Keyword extraction failed:", e);
        return [];
      }
    };

    // ---- Etapa 1: enquadramento (keywords) ----
    if (stage === "enquadramento") {
      const keywords = await extractKeywords(`${tipo_acao} ${fatos} ${pedidos}`);
      return new Response(JSON.stringify({ keywords }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Etapa 2: fundamentação (legislação) ----
    if (stage === "fundamentacao") {
      const kws: string[] = Array.isArray(body.keywords) ? body.keywords.filter(Boolean) : [];
      const termo = kws.join(" ").trim();
      const normas = termo.length >= 2 ? await searchLegislation(termo) : [];
      return new Response(JSON.stringify({ normas }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Etapa 3: precedentes ----
    if (stage === "precedentes") {
      const precedents = await fetchGroundingContext(`${tipo_acao} ${fatos}`.slice(0, 800), supabaseUrl, supabaseKey, 5);
      return new Response(JSON.stringify({ precedents }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!fatos || !pedidos) {
      throw new Error("Campos obrigatórios não preenchidos (fatos e pedidos)");
    }

    let normas: NormaResumo[];
    let precedents: GroundingDecision[];

    if (hasApproved) {
      // Fluxo em etapas: usa exatamente o que o usuário aprovou.
      normas = approvedNormas ?? [];
      if (approvedPrecedentIds && approvedPrecedentIds.length > 0) {
        const { data } = await supabase
          .from("decisions")
          .select("id, tribunal, numero_processo, comarca, data_decisao, ementa")
          .in("id", approvedPrecedentIds);
        precedents = (data ?? []) as GroundingDecision[];
      } else {
        precedents = [];
      }
    } else {
      // Modo rápido (comportamento histórico): dicionário estático + grounding.
      const keywords = await extractKeywords(`${tipo_acao} ${fatos} ${pedidos}`);
      normas = getLegislationByKeywords(keywords);
      precedents = await fetchGroundingContext(`${tipo_acao} ${fatos}`.slice(0, 800), supabaseUrl, supabaseKey, 3);
    }


    const legislationContext = buildLegislationContext(normas);
    const precedentsBlock = buildPrecedentsBlock(precedents);


    const systemPrompt = `Você é Honorífico, especialista em redação de peças processuais e documentos jurídicos brasileiros.

## IMPORTANTE: INFERIR FUNDAMENTOS JURÍDICOS
Seu papel é receber os FATOS e PEDIDOS do advogado e INFERIR toda a fundamentação jurídica adequada.
O advogado NÃO precisa fornecer os fundamentos — isso é trabalho da IA.

## REGRAS ABSOLUTAS
- NUNCA invente artigos, leis, números de processos, súmulas ou ementas de decisões.
- Sempre que citar um artigo de lei, use o formato: "nos termos do art. X da Lei nº Y/ANO...". Se tiver QUALQUER dúvida sobre o número exato do artigo, prefira redação genérica ("com base nos princípios do CDC sobre cobrança indevida").
- Precedentes jurisprudenciais: você SÓ pode citar decisões listadas em "PRECEDENTES DISPONÍVEIS" abaixo. Se nenhum se aplicar, NÃO inclua seção de precedentes.
- Súmulas: só cite súmulas do STF ou STJ se tiver CERTEZA absoluta do número e teor.
- Se não tiver certeza sobre a atualização de uma norma, sinalize: "verifique a redação vigente no Planalto (planalto.gov.br)".

## ESTRUTURA OBRIGATÓRIA DA PETIÇÃO

### 1. CABEÇALHO
- Endereçamento ao juízo competente
- Se os dados das partes forem fornecidos, qualifique-as. Caso contrário, deixe campos em branco para preenchimento: [NOME], [CPF/CNPJ], [ENDEREÇO], etc.

### 2. DOS FATOS
- Narrativa clara, objetiva e cronológica

### 3. DO DIREITO
- Fundamentação legal INFERIDA com base nos fatos apresentados
- Cite com precisão artigos de lei relevantes (dentro das regras absolutas acima)
- Integre a legislação do contexto RAG
- Cite precedentes SOMENTE se listados abaixo

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
⚠️ IMPORTANTE: Esta peça foi gerada por inteligência artificial como modelo de referência. Deve ser revisada, adaptada e assinada por advogado habilitado perante a OAB antes do protocolo."${legislationContext}${precedentsBlock}`;

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

    const generatedText = await aiChatText({
      model: "main",
      functionName: "generate-petition",
      userId: user.id,
      environment: env,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });
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
    const status = e instanceof AIError ? e.status : 500;
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
