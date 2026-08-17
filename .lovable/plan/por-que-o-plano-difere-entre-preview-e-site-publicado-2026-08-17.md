# Por que o plano difere entre preview e site publicado

## Diagnóstico (confirmado no banco)

Sua conta tem duas assinaturas, uma por ambiente de pagamento:

| Ambiente | Plano | Status | Onde aparece |
|---|---|---|---|
| sandbox | escritorio | active (até 13/09/2026) | Preview do Lovable |
| live | free | active | https://honorifico.com.br |

Isso é o comportamento correto do sistema: o preview usa o Paddle em modo teste e o site publicado usa o Paddle ao vivo. Como o go-live da Paddle ainda não foi aprovado, não existe assinatura paga no ambiente live — por isso o site mostra plano gratuito.

## O que fazer

Duas mudanças pequenas, sem alterar a lógica de cobrança:

1. **Deixar isso visível em /conta**: mostrar de forma clara em qual ambiente o usuário está ("Ambiente de teste" no preview / "Ambiente de produção" no site publicado) e, quando estiver em produção sem assinatura ativa, explicar que assinaturas do modo teste não valem em produção.

2. **Liberar sua conta de proprietário no ambiente live**: conceder o plano Escritório à sua conta (wrccdesign@gmail.com) também em `live`, para que você possa usar e revisar o site publicado por completo enquanto a Paddle não aprova o checkout ao vivo. É um registro administrativo, não um pagamento.

## Detalhes técnicos

- Migração pontual: atualizar a linha de `subscriptions` com `environment = 'live'` do seu `user_id` para `plan_id = 'escritorio'`, `status = 'active'` e `current_period_end` no futuro. Nenhuma alteração de schema, RLS ou grants.
- Frontend: ajustar `src/pages/Conta.tsx` (e o texto de `PaymentTestModeBanner`) para exibir o rótulo do ambiente e a nota explicativa. Sem mudanças em `useSubscription`, `PlanGate` ou nas edge functions.
- O webhook da Paddle continua a fonte da verdade: quando o go-live for aprovado e houver assinatura real, ela sobrescreve esse registro normalmente.
