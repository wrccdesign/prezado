# Auditoria de acoplamento a Stripe (pré-migração para Asaas)

Somente mapa. Nenhum arquivo do projeto foi alterado. Itens não confirmados por leitura estão marcados como "não verificado".

## 1. Inventário de referências

### (a) Acoplamento real ao SDK / API
- `supabase/functions/_shared/stripe.ts:1-41` — SDK `stripe@22.0.2`, `apiVersion 2026-03-25.dahlia`, proxy para `connector-gateway.lovable.dev/stripe` (linha 12), secrets `STRIPE_SANDBOX_API_KEY` / `STRIPE_LIVE_API_KEY` (14-18) e `LOVABLE_API_KEY` (22).
- `supabase/functions/_shared/stripe.ts:43-93` — `verifyWebhook`: assinatura `stripe-signature`, esquema `t=`/`v1=`, HMAC-SHA256, janela de 300s.
- `supabase/functions/_shared/stripe.ts:96-116` — `PLAN_BY_PRICE`, `ONE_TIME_ACCESS_DAYS`, `planFromPriceId` (neutro em conteúdo, acoplado por convenção de `lookup_key`).
- `supabase/functions/create-checkout/index.ts:17-216` — `customers.search/list/create/update`, `prices.list({lookup_keys})`, `products.retrieve`, `subscriptions.list`, `coupons.create/retrieve`, `checkout.sessions.create` com `ui_mode: "embedded_page"` e `client_secret`.
- `supabase/functions/create-portal-session/index.ts:28-64` — `customers.search/list`, `billingPortal.sessions.create`.
- `supabase/functions/billing-account/index.ts:22-254` — `customers.search/list`, `subscriptions.list/update`, `invoices.list`, `prices.list`.
- `supabase/functions/payments-webhook/index.ts:20-258` — eventos `customer.subscription.*`, `checkout.session.completed|async_payment_succeeded|async_payment_failed|expired`, `invoice.paid`; campos unix (`current_period_*`), `subscription.metadata.userId`, `price.lookup_key` / `price.metadata.lovable_external_id`, `subscriptions.cancel`.
- `src/lib/stripe.ts:1-32` — `loadStripe`, `VITE_PAYMENTS_CLIENT_TOKEN` com prefixos `pk_test_` / `pk_live_` como fonte do ambiente.
- `src/components/StripeEmbeddedCheckout.tsx:1-35` — `EmbeddedCheckoutProvider` / `EmbeddedCheckout` (`@stripe/react-stripe-js`), consome `clientSecret`.
- `src/hooks/useStripeCheckout.tsx:1-26` — wrapper do componente acima.
- `package.json:47-48` — `@stripe/react-stripe-js@6.2.0`, `@stripe/stripe-js@9.2.0`.
- `.env.development:1` e `.env.production:1` — `VITE_PAYMENTS_CLIENT_TOKEN` (chave publicável Stripe).

### (b) Apenas nomenclatura (sem chamada ao provedor)
- Colunas `subscriptions.stripe_subscription_id`, `subscriptions.stripe_customer_id` e `payment_events.paddle_subscription_id` (nome legado da Paddle, ainda em banco).
- `src/integrations/supabase/types.ts:473-712` — tipos gerados com esses nomes de coluna.
- `src/hooks/useSubscription.ts:5,39` — importa `getPaymentEnvironmentSafe` de `@/lib/stripe`, mas só usa `"sandbox" | "live"`.
- `src/components/PaymentTestModeBanner.tsx:1-3` e usos em `Planos.tsx:242`, `Conta.tsx:156`, `Petition.tsx:145,157`, `Chat.tsx:212`, `MeuCaso.tsx:42`, `Diagnostico.tsx:314` — leem só o prefixo do token.
- Header `x-payment-env` enviado pelo frontend (`Petition.tsx:98`, `Diagnostico.tsx:152`, `Chat.tsx:125`, `Jurisprudencia.tsx:152`, `PeticaoStepperFlow.tsx:59-60`) e liberado no CORS de várias functions — hoje **ignorado** pelo servidor: `supabase/functions/_shared/payment-env.ts:11-26` deriva o ambiente do Origin/Referer.
- `supabase/config.toml:48,63,66,69` — `payments-webhook`, `create-checkout`, `create-portal-session`, `billing-account` com `verify_jwt = false`.
- Migrações históricas: `20260415033110_*.sql:8-22`, `20260817003835_*.sql:3-21`, `20260818141210_*.sql:1-2`, `20260818161605_*.sql:1-13`.

### (c) Comentário / documentação / copy pública
- `src/pages/Termos.tsx:54`, `src/pages/Reembolso.tsx:38`, `src/pages/Privacidade.tsx:33,71`, `src/components/AppFooter.tsx:95` — texto legal citando Stripe como processador.
- Comentários sobre Pix e conta irlandesa: `create-checkout/index.ts:186-188`, `payments-webhook/index.ts:163-168`, `billing-account/index.ts:69-70`.
- `public/llms*.txt` e `.lovable/plan/*` — não verificado item a item; são documentos, não código.

## 2. Superfície de contrato das 4 functions

**create-checkout** (`POST`, JWT no header Authorization)
- Entrada: `{ priceId: string, returnUrl?: string, environment? }` (`index.ts:239-252`; `environment` enviado pelo cliente é ignorado, vale `resolvePaymentEnv`).
- Saída: `{ clientSecret, environment }` ou `{ error }` com 400/401/405.
- Chamador: `src/components/StripeEmbeddedCheckout.tsx:12-18`.
- Consumido pela UI: **apenas `clientSecret`** (e `error`). O `clientSecret` só serve porque o checkout é embutido da Stripe. Um provedor sem checkout embutido precisaria devolver uma URL e a UI mudaria para redirect.

**create-portal-session** (`POST`, JWT)
- Entrada: `{ returnUrl? }` (`index.ts:55-59`).
- Saída: `{ url }` ou `{ error }`.
- Chamador: `src/pages/Conta.tsx:128-131`; consome só `data.url` (abre em nova aba) e `data.error`.

**billing-account** (`POST`, JWT, roteador por `action`)
- `action: "summary"` → objeto de `buildSummary` (`index.ts:143-161`): `environment`, `plan_id`, `subscription`, `recurring_subscription`, `invoices[{id, invoice_number, status, billed_at, currency, total, pdf_url}]`. `subscription` = `{id, status, plan_id, access_type, access_expires_at, current_period_start, current_period_end, next_billed_at, cancel_at_period_end}`.
- `action: "cancel" | "resume" | "change-plan"` → `{ message }`; `change-plan` exige `priceId`.
- `action: "credit-estimate"` → `{ credit_cents }`.
- Chamadores: `src/pages/Conta.tsx:99-113` (summary, cancel, resume) e `src/pages/Planos.tsx:136,160` (credit-estimate, change-plan).
- Consumido pela UI: `Conta.tsx:138-145` usa `data.subscription`, `data.plan_id`, `data.environment`, `sub.access_type`, `sub.status`, `sub.access_expires_at`; a lista de faturas usa os campos acima; `Planos.tsx` usa `credit_cents` e `message`.

**payments-webhook** (`POST`, sem JWT, `?env=sandbox|live`)
- Entrada: corpo bruto Stripe + header `stripe-signature`; env inválido responde 200 ignorando (`index.ts:265-272`).
- Saída: `{ received: true }` / 400.
- Sem chamador no frontend.

**Contrato mínimo para um provedor novo não quebrar a UI**: (1) checkout que devolva `clientSecret` ou (com pequena mudança de UI) `url`; (2) `create-portal-session` devolvendo `url` — ou substituir por telas próprias; (3) `billing-account` mantendo exatamente as chaves de `summary`, `message` e `credit_cents`; (4) webhook próprio que escreva as mesmas colunas descritas na seção 3.

## 3. Escritas em `subscriptions` e `payment_events`

`subscriptions`
- `payments-webhook/index.ts:38-70` `upsertSubscription` (eventos `customer.subscription.created|updated`): `stripe_subscription_id`, `stripe_customer_id`, `product_id`, `price_id`, `plan_id`, `status`, `access_type='recurring'`, `current_period_start/end`, `cancel_at_period_end`, `environment`, `updated_at`, `user_id` (no insert, vindo de `metadata.userId`).
- `payments-webhook/index.ts:73-83` `markCanceled` (`customer.subscription.deleted`): `status='canceled'`, `plan_id='free'`, `updated_at`; filtro por `stripe_subscription_id` + `environment`.
- `payments-webhook/index.ts:103-159` `grantOneTimeAccess` (`checkout.session.completed` pago e `async_payment_succeeded`): `user_id`, `stripe_customer_id`, `price_id`, `plan_id`, `status='active'`, `access_type='one_time'`, `access_expires_at`, `payment_provider_ref` (= session id), períodos, `cancel_at_period_end`, `environment`, `updated_at`; e cancelamento da assinatura substituída (154-158).
- `payments-webhook/index.ts:170-193` `recordPendingOneTime`: insere linha `status='incomplete'`, `plan_id='free'`, `payment_provider_ref`.
- `payments-webhook/index.ts:195-204` `failOneTime`: `status='canceled'`, `plan_id='free'`.
- `billing-account/index.ts:193-195, 202-204, 219-225`: `cancel_at_period_end`, `price_id`, `plan_id`, `updated_at`, filtrando por `stripe_subscription_id` + `environment`.
- `public.handle_new_user()` (trigger em `auth.users`): insere linhas `free` e `trial` nos dois ambientes. Nenhum campo de provedor.

`payment_events`
- `create-checkout/index.ts:116-122` — upsert de cupom de crédito com `event_id='credit_<env>_<subId>'`, `event_type='credit_coupon'`, `environment`, `occurred_at`, `payload`.
- `payments-webhook/index.ts:96-99` `consumeCreditCoupon` — update em `payload.consumed`.
- `payments-webhook/index.ts:208-214` `logEvent` — insert com `event_id` (id do evento Stripe, PK, base da idempotência), `event_type`, `environment`, `occurred_at`, `payload`.

Colunas específicas de provedor: `stripe_subscription_id`, `stripe_customer_id`, `product_id`, `price_id` (guarda `lookup_key`), `payment_events.event_id` (id do evento Stripe) e `payment_events.paddle_subscription_id` (legado, **nunca escrita** pelo código atual — verificado por busca).
Colunas já neutras: `plan_id`, `status`, `environment`, `access_type`, `access_expires_at`, `current_period_start/end`, `cancel_at_period_end`, `payment_provider_ref` (usada hoje para session id, mas o nome é genérico).

## 4. Leituras de plano e acesso

- `public.get_user_plan(user, env)` — decide tudo no servidor a partir de `plan_id`, `environment`, `access_type`, `access_expires_at`, `status`, `current_period_end`. **Nenhum campo Stripe.**
- `public.has_active_subscription()` — só chama `get_user_plan`.
- `supabase/functions/_shared/rate-limit.ts:122-179` `checkRateLimit` — `rpc("get_user_plan")` + `PLAN_LIMITS` (13-40) + burst de 30/h (63) + `UNMETERED_ACTIONS` (56). Usada por `search-jurisprudencia`, `chat-juris`, `chat-decisao`, `diagnostico-juridico`, `analyze-legal-text`, `generate-petition`, `parse-document`, `calcular-*` (via `_shared/calculo-guard.ts`).
- `supabase/functions/usage-summary/index.ts:52-56` — mesma RPC; alimenta `src/hooks/useUsage.ts:37`.
- `src/hooks/useSubscription.ts:42-105` — lê `subscriptions` direto pelo cliente, selecionando apenas `plan_id, status, current_period_end, cancel_at_period_end, access_type, access_expires_at`, filtrando por `user_id` + `environment`. **Nenhum campo Stripe.**
- Gates: `src/components/PlanGate.tsx:22-26` (`usePlanAccess` sobre `planId`), `src/components/TrialBanner.tsx:29-34` (`isTrial`, `trialDaysLeft`), `src/components/PaywallBlur.tsx` (recebe `locked` de fora, sem lógica de plano), `src/components/UsageSummary.tsx` (não verificado em detalhe, consome `useUsage`).
- RLS verificada em `pg_policies`: `subscriptions` — "Users can view own subscription" (`auth.uid() = user_id`) e "Service role can manage subscriptions"; `payment_events` — só service_role; `usage_tracking` — select/insert próprios; `anon_usage` — só service_role. Nenhuma policy referencia coluna de provedor.

Conclusão da seção: **todo o controle de acesso do produto passa por `plan_id` / `status` / `access_type` / `access_expires_at` / `environment`.** O único lugar que ainda lê identificador Stripe para montar tela é `billing-account` (faturas e assinatura viva) e `create-portal-session`.

## 5. Dependência do gateway da Lovable

Secrets de pagamento hoje no projeto (apenas nomes):
- `STRIPE_SANDBOX_API_KEY` e `STRIPE_LIVE_API_KEY` — geridos pelo conector, **não** são chaves secretas reais da Stripe: são identificadores de conexão do gateway. Só funcionam via `connector-gateway.lovable.dev`.
- `LOVABLE_API_KEY` — autenticação do projeto junto ao gateway.
- `PAYMENTS_SANDBOX_WEBHOOK_SECRET` e `PAYMENTS_LIVE_WEBHOOK_SECRET` — `whsec_` de verificação do webhook Stripe, provisionados pela integração nativa.
- No frontend, `VITE_PAYMENTS_CLIENT_TOKEN` (`.env.development:1`, `.env.production:1`) — chave publicável, também provisionada pela integração.

Se passarmos a chamar uma API externa (Asaas) diretamente da edge function: esses cinco não servem para nada no fluxo Asaas. Continuam existindo e válidos para a Stripe enquanto a integração nativa estiver ativa (útil no período de convivência). A credencial Asaas seria um secret comum, adicionado pelo dono do projeto em Configurações → Secrets, e a chamada sai da edge function direto para a API da Asaas, sem gateway. Desconectar a integração nativa da Stripe revoga/remove os secrets geridos pelo conector — não verificado se a remoção é imediata ou preguiçosa; assumir que é imediata e não desconectar antes de a Asaas estar em produção.

## 6. Riscos e ordem segura

Fato verificado no banco: hoje **não existe nenhuma assinatura paga recorrente ativa em `live`**. As linhas `live` são 14 `free`, 14 `trial` de Profissional e 1 `escritorio` com `stripe_subscription_id` nulo (concessão administrativa). A única linha com `stripe_subscription_id` está em `sandbox`. Ou seja, o risco de quebrar pagante em produção é hoje próximo de zero — a janela para mudar estrutura é agora.

Ordem sugerida (da mais segura para a mais arriscada):
1. Introduzir colunas neutras aditivas (`provider`, e reaproveitar `payment_provider_ref`/`provider_customer_id`) sem remover nada. Reversível.
2. Fazer o código novo escrever nas colunas neutras e continuar lendo as antigas como fallback. Reversível.
3. Adicionar as functions Asaas em paralelo, com as rotas Stripe intactas. Reversível.
4. Trocar o frontend para o novo checkout atrás de uma condição (provedor por ambiente ou flag). Reversível.
5. Backfill das linhas antigas para as colunas neutras. Reversível com cópia.
6. Só depois: renomear/derrubar colunas Stripe, remover pacotes `@stripe/*`, atualizar copy legal e desconectar a integração nativa. **Irreversível na prática** (desconectar o conector destrói os secrets geridos e o catálogo de preços Stripe deixa de ser alcançável).

Pontos onde renomear coluna quebra em silêncio:
- `src/integrations/supabase/types.ts:473-712` é gerado; qualquer rename exige regenerar, senão o typecheck passa com tipo velho até a query falhar em runtime.
- Índice único `subscriptions_paddle_subscription_id_key` sobre `stripe_subscription_id` (nome do índice ainda cita paddle) e `idx_subscriptions_paddle_id` — renomear a coluna renomeia a coluna, não o índice; nada quebra, mas a leitura fica enganosa.
- `idx_subscriptions_provider_ref` é único sobre `(payment_provider_ref, environment)` — se a Asaas reutilizar esse campo com formato de id diferente, colisão é improvável, mas duas escritas concorrentes do mesmo pagamento passam a falhar por conflito em vez de atualizar; precisa de upsert com `onConflict`.
- `subscriptions_one_trial_per_user` é único sobre `(user_id, environment) WHERE access_type='trial'` — qualquer novo insert com `access_type='trial'` falha para quem já tem trial. Vale para o provedor novo também.
- `idx_payment_events_sub` aponta para `paddle_subscription_id`, coluna morta: dropar é seguro (verificado que nenhum código escreve nela).
- `get_user_plan` e `has_active_subscription` não citam coluna de provedor, então rename não as quebra; mas qualquer mudança em `access_type`/`status` muda o acesso de todo mundo de uma vez — alterar essas funções é o ponto mais sensível de todo o mapa.
- RLS não referencia coluna de provedor; rename é seguro do ponto de vista de policy.
- `payment_events.event_id` é a PK e a base da idempotência. Eventos Asaas precisam de id próprio prefixado (ex.: `asaas_<id>`) para não colidir com ids Stripe históricos.

Não verificado: se a conta Stripe irlandesa tem cobranças históricas com fatura emitida que precisem continuar acessíveis em `/conta` depois do corte (a lista de faturas vem só da API Stripe, `billing-account/index.ts:84-87`, não do nosso banco — se a integração for desconectada, o histórico de faturas some da tela).
