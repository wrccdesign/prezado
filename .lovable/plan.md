# Três ajustes na conta de cobrança (Asaas)

As três observações procedem. Confirmei no código:

- `estimateCredit` usa `remainingRatio = 0.5` fixo, ou seja, mostra um valor em reais inventado.
- `changePlan` só chama `updateSubscriptionValue` (muda o valor da assinatura no Asaas) e já grava `plan_id` novo na hora, liberando ou cortando acesso antes do pagamento.
- `getSummary` monta `https://.../i/{provider_subscription_id}`; esse caminho é de cobrança, não de assinatura, então tende a dar 404.

## 1. Fim da estimativa de crédito

- Remover a ação `estimate-credit` e a função `estimateCredit` da função de cobrança.
- Remover a chamada correspondente na tela da conta.
- Texto novo na troca de plano: "a alteração passa a valer na próxima cobrança. Não há cobrança nem crédito proporcional agora."

## 2. Troca de plano só vale depois do pagamento

- Nova coluna `pending_plan_id` em `subscriptions` (texto, opcional).
- `changePlan` passa a gravar apenas `price_id` e `pending_plan_id`; `plan_id` fica intacto.
- Quando o pagamento seguinte for confirmado, o plano pendente vira o plano atual e o campo é limpo.
- Na conta, mostrar o plano atual e, havendo pendência, "muda para X em DD/MM" (data da próxima cobrança).

Ponto que precisa da sua ciência: você pediu para não mexer no webhook, mas a promoção do plano pendente só pode acontecer na confirmação do pagamento, que é justamente o webhook. A alteração lá será mínima e restrita a isso: ao ativar uma assinatura recorrente, se houver `pending_plan_id`, ele vira `plan_id` e é apagado. Sem essa parte, a troca de plano nunca se conclui.

Detalhe técnico relacionado: a referência externa da assinatura no Asaas guarda o preço antigo, então hoje o webhook reescreveria o plano anterior. A promoção do plano pendente passa a ter prioridade sobre esse valor.

## 3. Link da próxima fatura

- Novo auxiliar que lista as cobranças da assinatura no Asaas (`/v3/subscriptions/{id}/payments`).
- Usar a `invoiceUrl` real da cobrança pendente mais próxima (status aguardando pagamento ou vencida).
- Sem cobrança pendente, o campo simplesmente não é retornado e o link não aparece na tela.
- O caminho de pagamento avulso (anual) continua como está, já usa a `invoiceUrl` real.

## Arquivos afetados

- `supabase/functions/asaas-billing-account/index.ts`
- `supabase/functions/_shared/asaas.ts` (novo auxiliar de cobranças da assinatura)
- `supabase/functions/asaas-webhook/index.ts` (apenas a promoção do plano pendente)
- `src/pages/Conta.tsx`, `src/pages/Planos.tsx` (textos e remoção da estimativa)
- Migração de banco para `pending_plan_id`

Autenticação e validação de titularidade ficam como estão.

## Verificação

- Compilação e testes.
- Publicação das funções alteradas.
- Teste em ambiente de testes: troca de plano não altera o plano atual, plano pendente aparece na conta, link de fatura só aparece quando existe cobrança pendente.
