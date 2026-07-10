
# Prezados.AI — Pronto para pagamento + revisão de fluxo

Três frentes em paralelo: **(A)** liberar pagamento real, **(B)** eliminar alucinações da IA com grounding + citação obrigatória, **(C)** justificar o plano Escritório (R$149) com gates reais + recursos exclusivos.

---

## A. Pronto para receber pagamento (Paddle → Live)

O checkout de teste já funciona (produtos `profissional_mensal` R$49 e `escritorio_mensal` R$149 criados em sandbox). Faltam três coisas para o live liberar:

**A1. Páginas legais públicas** (exigência do Paddle — sem elas o Readiness Check reprova)
Criar 3 rotas públicas usando **"Prezados.AI"** como nome comercial:
- `/termos` — Termos & Condições (identifica Prezados.AI, disclosure de Paddle como MoR, uso aceitável, IP, suspensão, cláusulas específicas para IA generativa: prompts do usuário, precisão não substitui advogado, moderação)
- `/reembolso` — Política de Reembolso (garantia de 30 dias, direciona a paddle.net; sem "no refunds")
- `/privacidade` — Aviso de Privacidade (Prezados.AI como controlador, LGPD, dados coletados: e‑mail/OAB/CPF/conteúdo, Paddle como recipient, retenção, direitos do titular)

Adicionar links no `AppFooter` e `LandingPage` (rodapé).

**A2. Portal do assinante + cancelamento**
- Nova edge function `paddle-customer-portal` (usa `getPaddleClient(env).customerPortalSessions.create`)
- Botão "Gerenciar assinatura" em `/planos` (quando `isCurrent && plan.id !== 'free'`) que abre o portal em nova aba

**A3. Comunicação clara test vs live**
- `PaymentTestModeBanner` já existe — garantir que aparece em `/planos` (já está) e adicionar em `/peticao`, `/chat`, `/diagnostico` (contexto de paywall)
- Mensagem de erro específica quando o checkout live falha (conta ainda não aprovada) — hoje mostra erro genérico

**A4. Publicar** para o Paddle detectar as páginas legais e liberar Verification → Domain Review → Business ID → Identity → Final Review. Após publish, aciono `get_go_live_status` para acompanhar.

---

## B. Anti-alucinação: grounding + citação obrigatória

Hoje o `chat-juris` e o `diagnostico-juridico` chamam a IA sem grounding — podem inventar artigo, súmula, número de processo.

**B1. Search-first para o Chat Jurídico** (`chat-juris/index.ts`)
- Antes de chamar o LLM, rodar `search_decisions_vector` + `search_decisions` (RRF híbrido) com a última pergunta do usuário
- Injetar os top‑5 resultados no system prompt como **"Contexto obrigatório"**
- System prompt endurecido:
  - "Você SÓ pode citar decisões que estejam no Contexto abaixo. Se a resposta exigir jurisprudência ausente do contexto, diga: 'Não encontrei decisões específicas no nosso banco sobre isso'"
  - "NUNCA invente números de processo, súmulas ou artigos. Se não souber o número exato, diga apenas o nome da lei (ex: 'CDC art. 42' apenas se tiver certeza; caso contrário 'proteção do CDC contra cobrança indevida')"
- Retornar `citations: [{id, tribunal, numero}]` junto da resposta para renderizar cards clicáveis

**B2. Diagnóstico** (`diagnostico-juridico/index.ts`)
- Mesma injeção de contexto (search antes do LLM)
- No JSON de resposta, campo `fundamentos` só é preenchido se houver match no banco; senão volta vazio com aviso

**B3. Geração de Petição** (`generate-petition/index.ts`)
- Buscar 3 decisões relacionadas ao tipo/tema e injetar como precedentes disponíveis
- Instruir a IA a citar SOMENTE esses precedentes; se nenhum servir, gera a petição sem seção "Precedentes"
- Legislação (CLT, CC, CDC, CPC, CF, CP) é conhecimento estável — pode citar artigo, mas o prompt reforça: "se tiver dúvida sobre o número exato do artigo, cite genericamente"

**B4. UI de transparência**
- Componente `<Citations>` que renderiza os cards das decisões usadas (link para `/decisao/:id`)
- Badge "🔒 Fundamentado em N decisões do nosso banco" quando houver contexto
- Badge "⚠️ Resposta sem lastro em jurisprudência indexada" quando o search não retornou nada

---

## C. Diferenciação real do plano Escritório

Hoje `/planos` mostra Escritório como "só limites maiores" — não justifica 3× o preço. Landing promete mais do que entrega.

**C1. Gates no Painel do Advogado** (`LawyerDashboard.tsx` + tabs)
Adicionar `useSubscription` e bloquear por `planId`:

| Aba              | Free      | Profissional | Escritório |
|------------------|-----------|--------------|------------|
| Dashboard        | ✅        | ✅           | ✅         |
| Petições (própria) | ✅ (histórico) | ✅ | ✅ |
| **Clientes**     | 🔒 Pro    | ✅ (até 20)  | ✅ ilimitado |
| **Modelos**      | 🔒        | ✅ (usar)    | ✅ criar + editar |
| **Configurações escritório** (logo, CNPJ, endereço) | 🔒 | 🔒 Escritório | ✅ |

Componente `<PlanGate requiredPlan="escritorio">` reutilizável (blur + CTA "Fazer upgrade").

**C2. Recursos exclusivos do Escritório**

- **Logo personalizado nas petições exportadas**
  - Coluna `office_logo_url` já existe no bucket `office-logos`; garantir upload na aba Configurações
  - `PetitionResult.tsx` (export PDF) insere logo do usuário Escritório no cabeçalho
  - Free/Profissional exportam com marca sutil "Gerado por Prezados.AI"

- **Modelos de petição customizados**
  - Escritório pode criar/salvar modelos próprios (tabela `petition_templates` já existe); Profissional só usa os padrão

- **Cliente-centric: petições vinculadas a clientes**
  - Escritório vê petições agrupadas por cliente; Profissional vê lista flat

- **Suporte prioritário** (visual):
  - Badge "Suporte prioritário" na aba Configurações + e‑mail dedicado `escritorio@prezados.ai` (mailto)

**C3. Consistência /planos ↔ landing ↔ realidade**
Reescrever a tabela de features em `Planos.tsx` para refletir os gates acima (não só números, mas ✅/🔒 por feature) e alinhar `LandingPage.tsx` para não prometer o que não existe.

---

## Detalhes técnicos

**Estrutura de arquivos**
```text
src/
  pages/
    Termos.tsx           (novo)
    Reembolso.tsx        (novo)
    Privacidade.tsx      (novo)
    Planos.tsx           (reescrita da tabela + botão gerenciar)
    LawyerDashboard.tsx  (gates por tab)
  components/
    PlanGate.tsx         (novo — wrapper de bloqueio por plano)
    Citations.tsx        (novo — cards de jurisprudência citada)
    lawyer-dashboard/
      ClientsTab.tsx     (limite 20 no Profissional)
      TemplatesTab.tsx   (create bloqueado fora do Escritório)
      SettingsTab.tsx    (logo upload + gate)
  hooks/
    usePlanGate.ts       (helper: requiresPlan('escritorio'))
supabase/functions/
  paddle-customer-portal/index.ts (novo)
  chat-juris/index.ts             (add grounding)
  diagnostico-juridico/index.ts   (add grounding)
  generate-petition/index.ts      (add grounding + logo)
```

**Migração DB**: nenhuma nova tabela — reuso `subscriptions.plan_id`, `profiles.office_logo_url`, `clients`, `petition_templates`.

**Ordem de implementação (uma resposta de build)**
1. Páginas legais + rotas + footer
2. Grounding nas 3 edge functions + componente Citations
3. Gates do Painel do Advogado + PlanGate + logo no PDF
4. Reescrita Planos.tsx + Landing consistente
5. Edge function customer-portal + botão "Gerenciar"

**Fora de escopo desta rodada** (posso fazer depois se quiser):
- Publicação e submissão real ao Paddle (você aciona após revisar as páginas)
- Anúncios / SEO adicional
- Testes E2E do checkout (Playwright não interage com iframe do Paddle)
