# Conta nova aparece como plano pago: é o teste grátis de 7 dias

## O que está acontecendo

Nada foi cobrado. Toda conta nova recebe automaticamente 7 dias do plano Profissional como teste. Confirmei no banco: a conta criada agora tem uma linha de teste do Profissional que expira em 17/09.

O problema é só de comunicação na tela de Planos: ela mostra "Seu plano" no Profissional e o botão "Gerenciar assinatura", exatamente como se fosse uma assinatura paga. Não há nenhuma indicação de teste nem da data em que ele termina.

Há também um efeito colateral real: como o site trata a conta como "já paga", o botão do plano Escritório vira "Fazer upgrade", que segue pelo caminho de troca de assinatura. Quem está só no teste não tem assinatura para trocar, então esse caminho falha.

## O que vou mudar (apenas a tela de Planos)

1. Marcar claramente o teste: no cartão do Profissional, em vez de "Seu plano", mostrar "Teste grátis, termina em DD/MM" quando o acesso vier do teste de 7 dias.
2. Aviso no topo da página quando o teste está ativo: "Você está no teste grátis do Profissional. Ele termina em DD/MM e depois a conta volta para o plano Gratuito."
3. Botões corretos durante o teste:
   - Profissional: "Assinar Profissional" (leva ao pagamento), não "Gerenciar assinatura".
   - Escritório: "Assinar Escritório" (leva ao pagamento), não "Fazer upgrade".
4. Manter tudo como está para quem realmente assinou.

## Detalhes técnicos

- `src/hooks/useSubscription.ts` já expõe `isTrial`, `trialEndsAt` e `trialDaysLeft`; nenhuma mudança necessária.
- `src/pages/Planos.tsx`: usar `isTrial` para (a) derivar `hasPaidPlan` como `planId !== "free" && !isTrial`, (b) trocar o rótulo "Seu plano" pelo selo de teste com data formatada em pt-BR, (c) enviar o clique para `handleSubscribe` em vez de `/conta` e do fluxo de troca de plano.
- Sem alterações em backend, webhook, cotas ou regras de acesso.

## Verificação
Build e typecheck, mais uma conferência visual da tela de Planos com uma conta em teste.
