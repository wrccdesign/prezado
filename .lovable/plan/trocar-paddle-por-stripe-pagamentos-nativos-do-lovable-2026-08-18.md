# Trocar Paddle por Stripe (pagamentos nativos do Lovable)

Objetivo: remover toda a camada Paddle e recolocar assinaturas com o Stripe integrado ao Lovable, que tem verificação muito mais leve (identificação do negócio + conta bancária), sem revisão de domínio nem checagem editorial das páginas legais.

## O que muda para você

- Mesmos planos e preços: Profissional R$49/mês e Escritório R$149/mês.
- Checkout hospedado pelo Stripe, com cartão (e Pix disponível na conta Stripe Brasil).
- Você continua com o plano Escritório liberado na conta, sem precisar refazer nada.
- Páginas `/termos`, `/reembolso` e `/privacidade` permanecem no site (boas práticas e exigência do próprio Stripe), mas ninguém mais vai reprovar o domínio por causa delas.

## Ação necessária sua (antes de eu executar)

Desconectar a Paddle no painel de pagamentos (menu de três pontos no canto superior direito → "Disconnect Paddle"). Não existe forma de eu fazer isso por você.

<presentation-actions><presentation-open-payments>Abrir painel de pagamentos</presentation-open-payments></presentation-actions>

Observação: o catálogo da Paddle não migra — eu recrio os produtos e preços no Stripe. Como não há assinantes pagos hoje, não há perda.

## Passos técnicos

1. **Ativar o Stripe nativo** e recriar o catálogo: produtos `profissional` (R$49/mês) e `escritorio` (R$149/mês), quantidade fixa 1.
2. **Banco** (uma migração, mantendo a tabela `subscriptions` e os dados atuais):
   - renomear `paddle_subscription_id` → `provider_subscription_id` e `paddle_customer_id` → `provider_customer_id`;
   - renomear `payment_events.paddle_subscription_id` → `provider_subscription_id`;
   - manter `plan_id`, `status`, `environment`, períodos e `get_user_plan()` sem alteração — o acesso Escritório concedido segue valendo.
3. **Remover código Paddle**:
   - excluir `supabase/functions/_shared/paddle.ts`, `get-paddle-price`, `paddle-customer-portal`, `paddle-account`;
   - excluir `src/lib/paddle.ts` e `src/hooks/usePaddleCheckout.ts`;
   - retirar as entradas correspondentes de `supabase/config.toml`.
4. **Nova camada Stripe**:
   - `stripe-checkout` (cria sessão de checkout para o preço escolhido, com `user_id` nos metadados);
   - `stripe-webhook` (assinatura criada/atualizada/cancelada → grava em `subscriptions`, com deduplicação em `payment_events`);
   - `stripe-portal` (portal de cobrança do cliente para trocar cartão ou cancelar);
   - `account-summary` substituindo `paddle-account`, mantendo o fallback que reconhece concessões administrativas locais.
5. **Frontend**:
   - `src/hooks/useCheckout.ts` no lugar de `usePaddleCheckout`;
   - `src/pages/Planos.tsx` e `src/pages/Conta.tsx` apontando para as novas funções;
   - `src/hooks/useSubscription.ts` sem `getPaddleEnvironment` — ambiente resolvido pelo host, como hoje;
   - `PaymentTestModeBanner` adaptado ao token do Stripe.
6. **Limpeza final**: remover menções à Paddle como Merchant of Record no rodapé e nas páginas legais (a Wrcc Design passa a ser a vendedora direta, com nota de que o processamento é feito pelo Stripe), e apagar os segredos `PADDLE_*` e `PAYMENTS_*_WEBHOOK_SECRET` antigos.
7. **Validação**: checkout de teste ponta a ponta no preview e confirmação de que `/conta` mostra o plano correto nos dois ambientes.

## Fora do escopo

Mercado Pago / Pix nativo brasileiro — pode ser adicionado depois, exigiria integração customizada.
