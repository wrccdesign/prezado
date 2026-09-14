# Ajuste dos nomes de evento de assinatura no Asaas

Confirmado no código atual (`supabase/functions/asaas-webhook/index.ts`): existe tratamento para `SUBSCRIPTION_CANCELLED` e para `SUBSCRIPTION_RENEWED`, nomes que não existem na API do Asaas. Eventos desconhecidos já caem no ramo padrão, são apenas registrados no log, marcados como processados e devolvem 200.

## O que muda

1. `SUBSCRIPTION_CANCELLED` deixa de existir. No lugar entram `SUBSCRIPTION_DELETED` e `SUBSCRIPTION_INACTIVATED`, os dois chamando o mesmo tratamento: cancelar a assinatura local e voltar o plano para gratuito.
2. `SUBSCRIPTION_RENEWED` é removido, junto com a função `renewSubscription`, que fica sem uso. A renovação continua chegando como cobrança paga, já tratada.
3. Nada muda na autenticação, no registro de eventos nem no comportamento de evento desconhecido: segue 200 e marcado como processado.

## Lista final de eventos tratados

| Evento | Efeito |
|---|---|
| PAYMENT_RECEIVED | ativa assinatura recorrente, ou acesso avulso quando não há assinatura |
| PAYMENT_CONFIRMED | mesmo efeito acima |
| PAYMENT_OVERDUE | marca a assinatura como em atraso |
| PAYMENT_DELETED | cancela a assinatura, ou encerra o acesso avulso |
| PAYMENT_REFUNDED | mesmo efeito acima |
| SUBSCRIPTION_DELETED | cancela a assinatura local e volta o plano para gratuito |
| SUBSCRIPTION_INACTIVATED | cancela a assinatura local e volta o plano para gratuito |
| qualquer outro | registrado no log, marcado como processado, resposta 200 |

## Detalhe técnico

- `case "SUBSCRIPTION_CANCELLED"` passa a `case "SUBSCRIPTION_DELETED": case "SUBSCRIPTION_INACTIVATED":`, mantendo `markSubscriptionCanceled(subscription.id, env)`.
- Remoção do `case "SUBSCRIPTION_RENEWED"` e da função `renewSubscription`, que deixa de ter chamador.
- Único arquivo tocado: `supabase/functions/asaas-webhook/index.ts`. Depois, republicar a função.
