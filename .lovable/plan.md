# Plano anual à vista via Pix

Implementação do plano anual (pagamento único) na conta Stripe atual, sem Pix Automático, mantendo intactos os planos mensais e o fluxo de cartão.

## 1. Catálogo de preços

Dois novos preços one-time em BRL nos produtos já existentes:

- `profissional_anual` — R$ 409,00 (40900)
- `escritorio_anual` — R$ 1.249,00 (124900)

Mensais permanecem exatamente como estão. Comunicação: "30% de desconto" (efetivo 30,4% e 30,1%), equivalente mensal R$ 34,08 e R$ 104,08.

## 2. Banco de dados

Migração na tabela `subscriptions`:

- `access_type text not null default 'recurring'` (`recurring` | `one_time`)
- `access_expires_at timestamptz`
- `payment_provider_ref text` (id da Checkout Session / PaymentIntent)
- `stripe_subscription_id` passa a aceitar `null`
- índice em `(user_id, environment, access_expires_at)`

`get_user_plan` reescrita com o critério **maior tier ativo** (não maior validade):

1. Reúne todos os acessos vigentes do usuário no `environment` pedido:
   - recorrentes: status em `active`/`trialing`/`past_due`, ou `canceled` com `current_period_end > now()`;
   - one-time: `access_type = 'one_time'` e `access_expires_at > now()`.
2. Devolve o de maior nível na ordem `escritorio` > `profissional` > `free`.

`has_active_subscription` continua derivada de `get_user_plan`.

## 3. Crédito proporcional do mensal

Ao comprar o anual tendo mensal ativo:

- crédito = floor((dias restantes até `current_period_end` ÷ dias totais do ciclo) × valor mensal pago), em centavos, lido **da API do Stripe**;
- teto duplo: nunca maior que um mês nem que o valor do plano anual;
- aplicado como Coupon Stripe (`amount_off` BRL, `duration: once`) na Checkout Session;
- só concedido se a assinatura estiver `active` ou `trialing`;
- um crédito por assinatura: o id do coupon é registrado em `payment_events` e reutilizado se o usuário abrir um segundo checkout.

**Trava crítica de ordem**: a assinatura mensal **não** é cancelada ao criar a sessão. O cancelamento acontece somente quando o pagamento é confirmado. Pix expirado ou falho deixa o usuário com o mensal intacto.

## 4. Checkout (`create-checkout`)

Quando o preço resolvido for one-time:

- `mode: "payment"`, `payment_method_types: ["pix", "card"]`
- `tax_id_collection: { enabled: true }` (CPF/CNPJ exigido pelo Pix)
- `locale: "pt-BR"`, `ui_mode: "embedded_page"`
- metadados: `userId`, `plan`, `duration_days: 365`, `credit_coupon_id` quando houver
- `payment_intent_data.description` com o nome do produto

Na tela de espera do Pix: aviso de que o acesso é liberado após confirmação do pagamento (normalmente segundos, podendo demorar) e que o QR expira em 24h.

## 5. Webhook (`payments-webhook`)

- Idempotência por `event.id`: insere em `payment_events` primeiro; se já existir, ignora o evento.
- `checkout.session.completed`: concede acesso apenas se `payment_status !== "unpaid"`; se `unpaid`, grava registro pendente.
- `checkout.session.async_payment_succeeded`: grava `access_type='one_time'`, `access_expires_at = now() + 365 dias`, `payment_provider_ref`, `plan_id`, `environment`; cancela a mensal (se houver) e marca o crédito como consumido.
- `checkout.session.async_payment_failed` e `checkout.session.expired`: marca como falho, não cancela nada, libera o coupon para novo uso.
- Eventos recorrentes de assinatura seguem como hoje.

## 6. Interface

**/planos**: seletor mensal/anual em cada plano pago, anual destacado com equivalente mensal e o selo de 30%. Quem já tem mensal ativo vê o crédito proporcional estimado antes de confirmar.

**/conta**: para acesso `one_time`, mostrar "Acesso ativo até dd/mm/aaaa" e botão "Renovar agora" — sem "Gerenciar assinatura" nem portal do cliente (o portal continua para assinaturas recorrentes). Avisos in-app a 30, 7 e 1 dia da expiração. Expirado, a UI reflete o rebaixamento automático para free.

## 7. Reembolso e arrependimento (CDC art. 49)

Atualizar `/reembolso` cobrindo:

- 7 dias de arrependimento com devolução integral para a compra anual, além da garantia de 30 dias já existente;
- reembolso de Pix retorna à chave do pagador;
- se houve crédito proporcional do mensal, o reembolso é do valor efetivamente pago, não do cheio;
- ao estornar, o acesso é revogado (`access_expires_at` limpo) — caminho previsto no backoffice.

## 8. Fora de escopo nesta rodada

Pix Automático, mandato, cobrança recorrente por Pix, conta Stripe BR, e qualquer alteração nos planos mensais ou no fluxo de cartão.

## Detalhes técnicos

Arquivos tocados: migração SQL (`subscriptions` + `get_user_plan` + `has_active_subscription`), `supabase/functions/create-checkout/index.ts`, `supabase/functions/payments-webhook/index.ts`, `supabase/functions/_shared/stripe.ts` (mapa `PLAN_BY_PRICE` com os anuais e helper de duração), `supabase/functions/billing-account/index.ts` (expor `access_type`/`access_expires_at` e estimativa de crédito), `src/pages/Planos.tsx`, `src/pages/Conta.tsx`, `src/pages/Reembolso.tsx`, `src/components/StripeEmbeddedCheckout.tsx` (aviso Pix).

Verificação após implementar: checkout anual no sandbox com Pix (pagar, expirar e falhar), conferindo que a mensal só cai no sucesso e que reenvio de evento não estende o acesso duas vezes.
