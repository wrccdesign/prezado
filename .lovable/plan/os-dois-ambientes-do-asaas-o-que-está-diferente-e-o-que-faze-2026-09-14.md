# Os dois ambientes do Asaas: o que está diferente e o que fazer

## O que as duas telas mostram

| | Produção (ASAAS) | Testes (ASAAS SANDBOX) |
|---|---|---|
| Aviso cadastrado | sim, "Honorifico Produção" | sim, "webhook-sandbox" |
| Ligado? | **não** (a chavinha "Este Webhook ficará ativo?" está desligada) | sim, "Ativado" |
| Fila de sincronização | desligada | ligada |
| Falhas | 1 configuração penalizada | 0 |

Confirmei no banco: até agora o site **não recebeu nenhum aviso do Asaas**, nem de teste nem de produção. Ou seja, quem paga ainda não tem o plano ativado sozinho.

O aviso de produção está desligado porque o Asaas tentou entregar, recebeu erro e pausou a fila. Isso é esperado: o cadastro foi feito antes do endereço/token estarem certos.

## O que fazer, na ordem

### 1. Testar primeiro no ambiente de testes (sandbox)

1. No painel do sandbox, Integrações, Webhooks, clique no lápis de `webhook-sandbox`.
2. Confira três coisas contra o card "Configuração do Asaas" na página de administração do site (menu de administração, seção de ingestão):
   - o endereço do aviso é exatamente o que está no card;
   - o token de autenticação é o mesmo valor salvo no site para o ambiente de teste;
   - os eventos marcados são os sete listados no card.
3. Salve e crie uma cobrança de teste, ou pague um checkout gerado na pré-visualização com cartão de teste.
4. Me avise: eu confiro no banco se o aviso chegou e se o plano ativou sozinho.

### 2. Só depois, arrumar produção

1. Painel de produção, Integrações, Webhooks, abrir "Honorifico Produção", botão Editar.
2. Corrigir endereço e token (mesmos do card, versão de produção), marcar os sete eventos.
3. Ligar "Este Webhook ficará ativo?" e "Fila de sincronização ativada".
4. Salvar. Se continuar aparecendo como penalizado, remover e criar de novo.
5. Em Logs de Webhooks, ver se as tentativas passam a responder 200.

Se você não tiver mais o valor do token de produção em mãos, eu abro o formulário seguro para você cadastrar um novo, e aí você cola o mesmo valor nos dois lados.

### 3. Limpeza da cobrança real

Com o aviso de produção funcionando: cancelar a assinatura criada por engano em 14/09 e estornar o pagamento de R$ 49. O site recebe os avisos de cancelamento e estorno e volta a conta ao plano gratuito sozinho. Se algum aviso não chegar, eu ajusto o registro à mão.

## Meu papel em cada etapa

Não mexo em código nesta rodada. Eu verifico, depois de cada passo seu, se o aviso chegou, se foi processado e se a assinatura ficou no plano certo, e reporto o resultado.
