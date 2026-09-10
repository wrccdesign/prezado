# Aviso do fim do teste grátis

## Como funciona hoje

O teste de 7 dias termina sozinho. Não há cartão cadastrado e nenhuma cobrança acontece: quando a data passa, a conta volta ao plano Gratuito automaticamente.

Dentro do site já existe uma faixa de aviso no topo enquanto o teste está ativo, com contagem de dias e um lembrete extra a 3 dias do fim e no último dia. Falta só o e-mail.

## O que será feito

### 1. Ajustes no aviso dentro do site
- Deixar claro na faixa que nada será cobrado e que a conta volta ao Gratuito sozinha.
- Mostrar a data exata do fim do teste, não só a contagem de dias.
- Repetir o mesmo aviso na página Conta, junto do plano atual.

### 2. E-mail 2 dias antes do fim
- E-mail enviado uma vez por conta, dois dias antes do teste terminar.
- Assunto e texto no tom do Honorífico: o teste termina no dia X, nada será cobrado, a conta volta ao Gratuito, e o que muda nos limites.
- Um botão para ver os planos.
- Um segundo e-mail opcional no dia em que o teste termina, confirmando a volta ao Gratuito.

### 3. Envio de e-mails
O projeto ainda não tem e-mail próprio configurado. Para enviar do domínio honorifico.com.br é preciso concluir a configuração de e-mail antes; enquanto isso, apenas a parte do site funciona.

## Detalhes técnicos

- `src/components/TrialBanner.tsx`: incluir data de término (`trialEndsAt`) e a frase "nada será cobrado"; nenhuma mudança de layout.
- `src/pages/Conta.tsx`: bloco de status do teste com a mesma informação.
- Configuração de e-mail: domínio remetente, infraestrutura de fila e função de envio de e-mails do app.
- Novo template `trial-ending` (e opcional `trial-ended`) em `supabase/functions/_shared/transactional-email-templates/`, cores navy/creme/dourado, Source Serif/Sans.
- Nova edge function agendada (pg_cron, 1x/dia) que busca em `subscriptions` as linhas com `access_type='trial'`, `environment='live'` e `access_expires_at` entre 47h e 48h à frente, e dispara o envio com chave de idempotência `trial-ending-<subscription_id>` para não repetir.
- Nenhuma mudança em cobrança, planos, cotas ou webhook do Asaas.
