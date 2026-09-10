# Migração de pagamentos: Stripe → Asaas

## Contexto e decisões

- A integração Stripe atual usa o connector-gateway da Lovable (`STRIPE_LIVE_API_KEY`, `STRIPE_SANDBOX_API_KEY`, `PAYMENTS_*_WEBHOOK_SECRET`).
- O projeto **nunca processou pagamento real** em produção: `payment_events` live está vazio; a única assinatura "paga" live é concessão administrativa sem `stripe_subscription_id`.
- Portanto a migração pode ser **total**, sem precisar manter dois provedores em paralelo por longo tempo.
- Os secrets `ASAAS_LIVE_API_KEY`, `ASAAS_SANDBOX_API_KEY` e `ASAAS_WEBHOOK_TOKEN` já foram salvos.

## Objetivo

Substituir completamente a integração Stripe pela Asaas:

1. Checkout recorrente (mensal) via Asaas.
2. Checkout anual à vista via Asaas (boleto, Pix, cartão).
3. Webhook Asaas para ativar/renovar/cancelar assinaturas.
4. Portal de gerenciamento simplificado (cancelar, trocar de plano, ver faturas).
5. Remover todo o código, secrets e dependências Stripe.

## Escopo do plano

- Backend: 4 edge functions e 1 utilitário compartilhado.
- Banco: renomear colunas Stripe para nomes neutros e ajustar índices/RLS/funções.
- Frontend: 4 arquivos principais + remoção de dependências npm.
- Config: remover `.env.*` de pagamento e secrets Stripe.

---

## Fase 1 — Preparação do banco (neutro, sem perder histórico)

### 1.1 Renomear colunas Stripe para provedor genérico

Motivo: a tabela `subscriptions` nasceu como `paddle_subscription_id`, foi renomeada para `stripe_subscription_id` e agora deve ser neutra para não precisar renomear de novo no futuro.

Nova estrutura das colunas de identificação:

- `provider text NOT NULL DEFAULT 'stripe'` — provedor que originou a linha.
- `provider_subscription_id text` — id da assinatura no provedor (antigo `stripe_subscription_id`).
- `provider_customer_id text` — id do cliente no provedor (antigo `stripe_customer_id`).

Ações:

1. Criar migration `20260910_migrate_subscriptions_to_provider.sql`:
   - Adicionar `provider text NOT NULL DEFAULT 'stripe'`.
   - Renomear `stripe_subscription_id` → `provider_subscription_id`.
   - Renomear `stripe_customer_id` → `provider_customer_id`.
   - Dropar índice/constraint antiga em `stripe_subscription_id`.
   - Criar índice único composto: `(provider_subscription_id, provider, environment)` onde `provider_subscription_id IS NOT NULL`.
   - Atualizar `idx_subscriptions_user_env_expires` se necessário.
   - Atualizar `get_user_plan`, `has_active_subscription` e `handle_new_user` para usar os novos nomes.
2. Ajustar RLS/policies: nenhuma muda semanticamente, apenas garantir que `service_role` continue com ALL.
3. Atualizar `src/integrations/supabase/types.ts` manualmente ou via regeneração automática do Lovable.

### 1.2 Ajustar `payment_events`

A tabela já tem `paddle_subscription_id` como legado. Adicionar coluna neutra:

- `provider_subscription_id text` (preencher nos novos eventos Asaas).
- Manter `paddle_subscription_id` preenchido para histórico Stripe/Paddle antigo.

---

## Fase 2 — Backend Asaas

### 2.1 Criar utilitário compartilhado

Novo arquivo: `supabase/functions/_shared/asaas.ts`

Responsabilidades:

- Resolver ambiente (`sandbox` vs `live`) a partir de `origin`/`referer` (reaproveitar `resolvePaymentEnv`).
- Criar cliente fetch para a API Asaas (`https://sandbox.asaas.com/api/v3` ou `https://api.asaas.com/api/v3`).
- Ler secrets `ASAAS_LIVE_API_KEY` e `ASAAS_SANDBOX_API_KEY`.
- Mapear `priceId` interno (`profissional_mensal`, `escritorio_mensal`, `profissional_anual`, `escritorio_anual`) para:
  - `plan_id`: `profissional` | `escritorio`.
  - `cycle`: `MONTHLY` | `YEARLY`.
  - Valor em centavos (hard-coded no código, espelhando a tabela de planos do frontend).
- Criar/achar `customer` no Asaas vinculado ao `user_id` do app (usar `externalReference` ou metadata).

### 2.2 Edge function `asaas-create-checkout`

Substitui `create-checkout`.

Contrato de entrada (mesmo do frontend):

```json
{ "priceId": "profissional_mensal|escritorio_mensal|profissional_anual|escritorio_anual", "returnUrl": "..." }
```

Contrato de saída:

```json
{ "checkoutUrl": "https://..." }
```

Comportamento:

1. Autenticar JWT.
2. Validar `priceId`.
3. Resolver ambiente.
4. Criar/achar customer Asaas com `email` do usuário e `externalReference = user_id`.
5. Se for mensal: criar assinatura Asaas (`/subscriptions`) com `externalReference = priceId` e retornar `paymentLink` ou `invoiceUrl` para o primeiro pagamento.
6. Se for anual: criar cobrança avulsa (`/payments`) do tipo `PAYMENT_LINK` ou `CHARGE` com vencimento e retornar `invoiceUrl`.
7. Registrar na tabela `subscriptions` uma linha provisória `status = 'incomplete'`, `access_type = 'recurring'` ou `'one_time'`, com `provider = 'asaas'`, `provider_customer_id` e `payment_provider_ref` (id da cobrança/assinatura Asaas).

### 2.3 Edge function `asaas-webhook`

Substitui `payments-webhook`.

Contrato:

- Recebe POST no endpoint `/functions/v1/asaas-webhook`.
- Valida token `ASAAS_WEBHOOK_TOKEN` no header configurado pelo usuário (ex: `X-Asaas-Token` ou query param `token`).
- Processa eventos:
  - `PAYMENT_RECEIVED` / `PAYMENT_CONFIRMED`: ativar assinatura (`status = 'active'`, preencher `current_period_start/end`).
  - `PAYMENT_OVERDUE`: marcar `status = 'past_due'`.
  - `PAYMENT_DELETED` / `PAYMENT_REFUNDED` / `SUBSCRIPTION_CANCELLED`: marcar `status = 'canceled'` e `plan_id = 'free'`.
  - `SUBSCRIPTION_RENEWED`: atualizar `current_period_end`.
- Gravar evento em `payment_events` com `provider = 'asaas'`.
- Sempre responder 200 rapidamente.

### 2.4 Edge function `asaas-billing-account`

Substitui `billing-account`.

Ações suportadas (`action`):

- `summary`: retorna plano atual, próxima cobrança, status e faturas (lendo da tabela `subscriptions` e, se necessário, consultando Asaas).
- `cancel`: marcar `cancel_at_period_end = true` e chamar Asaas para cancelar ao fim do ciclo.
- `resume`: reverter cancelamento.
- `change-plan`: trocar de plano mensal no Asaas (upgrade/downgrade) e atualizar `subscriptions`.
- `credit-estimate`: manter compatibilidade, retornar 0 para anual (não implementar crédito proporcional na primeira versão; se necessário, calcular no Asaas posteriormente).

### 2.5 Edge function `asaas-portal-session` (opcional)

O Asaas não tem portal de cliente estilo Stripe Billing Portal. Opções:

- **Opção A (recomendada)**: não ter portal externo. O gerenciamento (cancelar, trocar plano, atualizar cartão) fica todo em `/conta` via `asaas-billing-account`.
- **Opção B**: gerar um link de fatura/cobrança específica do Asaas quando necessário.

Decisão: usar **Opção A**. Remover `create-portal-session` e o botão "Portal de pagamento" do frontend.

---

## Fase 3 — Frontend

### 3.1 Substituir checkout Stripe

- Remover `src/lib/stripe.ts`.
- Remover `src/hooks/useStripeCheckout.tsx`.
- Remover `src/components/StripeEmbeddedCheckout.tsx`.
- Remover dependências `@stripe/stripe-js` e `@stripe/react-stripe-js` do `package.json`.
- Em `src/pages/Planos.tsx`:
  - Substituir o modal de checkout Stripe por redirecionamento para `checkoutUrl` retornado por `asaas-create-checkout`.
  - Manter lógica de troca de plano mensal via `asaas-billing-account`.
  - Ajustar textos: remover menção a "processamento internacional" e IOF; adicionar nota sobre Asaas/BRL.
  - Anual: redirecionar para URL de pagamento Asaas.

### 3.2 Atualizar `/conta`

- Substituir chamadas `billing-account` → `asaas-billing-account`.
- Substituir `create-portal-session` por ações inline (cancelar, reativar, trocar plano).
- Ajustar interface `Summary` e tipos de fatura para o formato Asaas.
- Remover badge de "Ambiente de teste" baseado em token Stripe; manter derivado do `environment` retornado.

### 3.3 Ajustar hooks

- `src/hooks/useSubscription.ts`: não depende de Stripe; apenas garantir que a query continue filtrando por `environment` e lendo `plan_id`, `status`, `access_type`, `access_expires_at`, `current_period_end`. Nenhuma mudança estrutural, apenas confirmar que não lê colunas Stripe.

### 3.4 Componentes de gate

- `PlanGate.tsx`, `PaywallBlur.tsx`, `TrialBanner.tsx`, `useUsage.ts`, `usageLimit.ts`: nenhum usa Stripe diretamente. Apenas revisar para garantir.

---

## Fase 4 — Remoção Stripe

### 4.1 Deletar arquivos Stripe

- `supabase/functions/_shared/stripe.ts`
- `supabase/functions/create-checkout/index.ts`
- `supabase/functions/create-portal-session/index.ts`
- `supabase/functions/billing-account/index.ts`
- `supabase/functions/payments-webhook/index.ts`
- `src/lib/stripe.ts`
- `src/hooks/useStripeCheckout.tsx`
- `src/components/StripeEmbeddedCheckout.tsx`

### 4.2 Remover secrets Stripe

- `STRIPE_LIVE_API_KEY`
- `STRIPE_SANDBOX_API_KEY`
- `PAYMENTS_LIVE_WEBHOOK_SECRET`
- `PAYMENTS_SANDBOX_WEBHOOK_SECRET`

(O usuário deve remover manualmente em Cloud → Secrets ou solicitar.)

### 4.3 Remover variáveis de ambiente frontend

- `VITE_PAYMENTS_CLIENT_TOKEN` de `.env.development` e `.env.production`.
- Atualizar `src/vite-env.d.ts` se houver referência.

### 4.4 Atualizar `PaymentTestModeBanner.tsx`

Hoje ele lê `getPaymentEnvironmentSafe()` de `src/lib/stripe.ts`. Mudar para inferir ambiente a partir do hostname (`id-preview--*.lovable.app` = sandbox, `honorifico.com.br` = live).

---

## Fase 5 — Configuração do webhook no Asaas

1. O usuário cadastra o endpoint no painel Asaas:
   - Produção: `https://hfhzkvuoywgxjklpiydq.supabase.co/functions/v1/asaas-webhook?env=live&token=<ASAAS_WEBHOOK_TOKEN>`
   - Sandbox: `https://hfhzkvuoywgxjklpiydq.supabase.co/functions/v1/asaas-webhook?env=sandbox&token=<ASAAS_WEBHOOK_TOKEN>`
2. Selecionar eventos: `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`, `PAYMENT_OVERDUE`, `PAYMENT_DELETED`, `PAYMENT_REFUNDED`, `SUBSCRIPTION_CANCELLED`, `SUBSCRIPTION_RENEWED`.

> Não expor o project ref ao usuário nas instruções; fornecer os URLs prontos para copiar e colar.

---

## Fase 6 — Testes e publicação

### 6.1 Testes locais/preview

1. Criar assinatura mensal no preview (sandbox Asaas) e verificar:
   - Linha `incomplete` criada em `subscriptions`.
   - Após pagamento simulado, webhook atualiza para `active`.
   - `useSubscription` reflete plano ativo.
2. Criar cobrança anual e verificar fluxo similar.
3. Cancelar plano em `/conta` e verificar `status`/`cancel_at_period_end`.
4. Verificar que visitantes e usuários free não quebram.

### 6.2 Validações de segurança

- Validar token do webhook para evitar spoofing.
- Validar `priceId` e `userId` em todas as chamadas.
- Nunca confiar em dados do cliente para definir plano; plano só muda via webhook assinado.

### 6.3 Build e publicação

- Rodar `bun run build`.
- Rodar typecheck.
- Publicar edge functions `asaas-create-checkout`, `asaas-webhook`, `asaas-billing-account`.
- Publicar app.
- Configurar webhook no painel Asaas de produção.

---

## Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| Renomear colunas quebra `types.ts` | Atualizar `types.ts` na mesma rodada; typecheck antes de publicar. |
| Asaas não tem portal de cliente | Implementar gerenciamento inline em `/conta`. |
| Webhook Asaas usa autenticação diferente | Validar `ASAAS_WEBHOOK_TOKEN` via query param ou header configurado. |
| Perda do histórico Stripe/Paddle | Manter colunas legado em `payment_events`; não deletar dados antigos. |
| Anual à vista no Asaas exige configuração de Pix/boleto | Usar cobrança avulsa com `billingType` configurável; na v1 oferecer cartão e Pix se habilitado na conta. |

---

## Ordem de execução recomendada

1. Fase 1: migration do banco + `types.ts`.
2. Fase 2: criar `_shared/asaas.ts`, `asaas-create-checkout`, `asaas-webhook`, `asaas-billing-account`.
3. Fase 3: atualizar frontend (`Planos.tsx`, `Conta.tsx`, `PaymentTestModeBanner.tsx`).
4. Fase 4: deletar código Stripe e secrets.
5. Fase 5: configurar webhook no painel Asaas.
6. Fase 6: testar e publicar.

---

## Perguntas pendentes para o usuário

1. **Anual à vista**: deseja oferecer apenas cartão ou também Pix/boleto na primeira versão? (Isso afeta o payload da cobrança Asaas.)
2. **Portal de cliente**: prefere gerenciar tudo em `/conta` sem link externo, ou quer um link para faturas do Asaas?
3. **Crédito proporcional**: ao fazer upgrade anual vindo do mensal, deseja manter o cálculo de crédito ou pode começar sem essa funcionalidade?
4. **Tabela de preços**: confirma os valores atuais (Profissional R$ 49/mês, R$ 409/ano; Escritório R$ 149/mês, R$ 1.249/ano) para hard-code no backend Asaas?
