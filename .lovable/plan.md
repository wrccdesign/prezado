# Ajustes finais do webhook e Pix mensal

## Escopo confirmado

- `payment_events` ainda não possui `processed_at`.
- O webhook grava o evento antes de processá-lo e hoje considera qualquer conflito do `event_id` uma duplicata concluída.
- A ausência de `userId` em pagamentos recorrentes e anuais apenas encerra o processamento, permitindo resposta 200 indevida.
- O checkout mensal atual oferece somente cartão. O helper de assinatura direta existe, mas usa `billingType: "UNDEFINED"` e não está conectado à página de planos.

## Implementação

### 1. Idempotência com reprocessamento seguro

- Criar migration adicionando `payment_events.processed_at timestamptz NULL` e atualizar os tipos do banco.
- Alterar o registro do evento para:
  - inserir eventos novos com `processed_at` nulo;
  - em conflito `23505`, consultar o evento existente;
  - ignorar somente quando `processed_at` estiver preenchido;
  - reprocessar quando `processed_at` estiver nulo;
  - propagar qualquer erro de leitura ou gravação como HTTP 500.
- Após todo o tratamento do evento terminar com sucesso, preencher `processed_at`.
- Se a marcação final falhar, retornar HTTP 500.
- Trocar os dois casos de usuário não localizado por exceções, garantindo resposta 500 e novo envio pelo Asaas.

### 2. Validar Pix mensal no sandbox antes da interface

- Fazer uma chamada real de teste a `POST /v3/subscriptions` no sandbox com `billingType: "PIX"`, `cycle: "MONTHLY"`, cliente de teste, vencimento e referência rastreável.
- Cancelar a assinatura criada para o teste após registrar o resultado.

**Se a API recusar:** não alterar a página de planos nem o fluxo atual. Entregar o status e a mensagem exata retornada pelo Asaas.

**Se a API aceitar:**

- Adicionar ao fluxo mensal a escolha entre:
  - cartão, mantendo o checkout recorrente atual;
  - Pix, criando assinatura mensal direta e abrindo a primeira cobrança gerada.
- Usar `${user.id}:${priceId}` também na assinatura Pix para o webhook localizar a conta sem depender apenas do cliente.
- Registrar a intenção local com o identificador da assinatura e manter a ativação somente após o webhook de pagamento confirmado.
- Mostrar na página de planos e no diálogo que o Pix mensal exige pagamento manual a cada mês.
- Não alterar o fluxo anual.

## Verificação

- Testar evento novo, evento já processado, reenvio com `processed_at` nulo e pagamento sem usuário.
- Confirmar que falhas retornam 500 e duplicatas concluídas retornam 200.
- Se Pix for aceito, testar criação da assinatura, abertura da primeira cobrança e ativação pelo webhook no sandbox.
- Executar verificação de tipos e build.
- Publicar somente as funções alteradas. Não configurar o webhook no painel nem fazer outras mudanças.
