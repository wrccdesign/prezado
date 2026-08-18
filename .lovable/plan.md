# Ajustes finais da economia mensal (delta sobre o que já está no ar)

A virada de cotas diárias para mensais já foi implementada e está no código: `_shared/rate-limit.ts` conta o mês-calendário em America/Sao_Paulo (`saoPauloMonthStart/End`), as mensagens de bloqueio já dizem "deste mês" com data de renovação, `usage-summary` devolve `period_start`/`renews_at`, `UsageSummary` mostra "Uso neste mês", `/planos` já traz o selo de 7 dias grátis e existe um `TrialBanner` no header. Os limites de `analise` e `calculo` também já existem em formato mensal.

Este plano cobre só o que ainda difere do que você pediu agora.

## 1. Números dos planos pagos (ajuste para baixo)

Substituir em `PLAN_LIMITS` (o gratuito já está exatamente como pedido):

| Ação | Free | Profissional (hoje → novo) | Escritório (hoje → novo) |
|---|---|---|---|
| busca | 20 | 500 → 400 | 2000 → 1500 |
| chat | 10 | 300 → 200 | 1000 → 800 |
| analise | 3 | 100 → 40 | 400 → 150 |
| diagnostico | 1 | 60 | 200 |
| peticao | 0 | 60 | 200 |
| calculo | 5 | 300 → 150 | 1000 → 500 |

As ações internas `diagnostico_completo_free` e `documento` (leitura/OCR, para não cobrar duas vezes pela análise) continuam cadastradas; `documento` acompanha a nova escala (5 / 80 / 300).

## 2. Trava anti-abuso (nova)

Limite de rajada por usuário, igual para todos os planos: **30 chamadas por hora somando todas as ações**, verificado antes da cota mensal em `checkRateLimit`, contando `usage_tracking` na última hora.

Ao estourar, resposta 429 com corpo distinto do de cota mensal (`burst_limit: true`) e mensagem própria: "Muitas requisições em pouco tempo. Aguarde alguns minutos — sua cota mensal continua disponível." O frontend já lê o corpo do erro em `readFunctionError`; ele passa a diferenciar as duas situações e só oferece o link para /planos no caso de cota mensal esgotada.

## 3. Trial de 7 dias — onde ele mora

Você pediu `trial_ends_at` em `profiles`. O trial já está implementado por outro caminho: uma linha em `subscriptions` com `access_type = 'trial'` e `access_expires_at`, com índice único parcial que impede um segundo trial por conta/ambiente, e `get_user_plan` já trata `trial` como acesso vigente mantendo a regra do maior tier ativo (trial nunca rebaixa quem paga).

Proposta: **manter esse modelo** em vez de mover para `profiles`. Ele já entrega tudo o que você descreveu (uma vez por conta, nunca reconcedido, não rebaixa pagante) e evita uma segunda fonte de verdade sobre entitlement. Se preferir mesmo o campo em `profiles`, digo na revisão e eu migro — mas nesse caso o entitlement passa a ser lido de dois lugares.

Único ajuste real aqui: garantir que a reconcessão é impossível também em troca de e-mail (o índice é por `user_id`, e o e-mail não altera o `user_id` — nada a fazer) e confirmar que uma nova assinatura não recria linha de trial.

## 4. Avisos do 5º e 7º dia

Hoje o `TrialBanner` aparece o tempo todo durante o trial, com tom de alerta nos últimos 3 dias. Passa a ter marcos explícitos:

- Dias 1–4: faixa discreta, "Teste Profissional — N dias restantes".
- Dia 5 e dia 7 (último): faixa em alerta + um card dispensável (uma vez por marco, guardado em `localStorage`) listando o que se perde ao voltar ao gratuito, com os números reais do `PLAN_LIMITS`: petições deixam de existir, buscas caem de 400 para 20/mês, chat de 200 para 10, análises de 40 para 3, cálculos de 150 para 5.

## 5. Interface

- `/conta`: `UsageSummary` passa a escrever "X de Y usados neste mês" (hoje escreve "X de Y · restam Z") e mantém a data de renovação.
- `/planos`: revisar linha a linha para que todo limite exibido bata com os novos números e nenhum texto sugira renovação diária.
- Landing: destacar o trial de 7 dias no CTA principal (hoje o selo só existe em /planos).
- Mensagem de cota esgotada: já diz quanto falta para renovar; passa a nomear o plano que resolve.

## 6. Fora de escopo

Preços intocados (R$ 49 / R$ 409, R$ 149 / R$ 1.249). Nada de Stripe, checkout, webhook ou Pix. `get_user_plan` não muda — o caminho de trial já está lá.

## Detalhes técnicos

- `rate-limit.ts`: novos valores em `PLAN_LIMITS`; nova função `checkBurstLimit` (contagem de `usage_tracking` por `user_id` na última hora, sem filtro de ação) chamada no início de `checkRateLimit`; retorno ganha `burstLimited`.
- Todos os chamadores (`analyze-legal-text`, `chat-juris`, `diagnostico-juridico`, `generate-petition`, `search-jurisprudencia`, `parse-document`, `_shared/calculo-guard.ts`) repassam `burst_limit` no corpo 429; redeploy das funções afetadas.
- `src/lib/usageLimit.ts`: expõe `burstLimited` além de `limitReached`.
- `src/components/TrialBanner.tsx`: marcos de dia 5/7 com card dispensável; `src/components/UsageSummary.tsx`, `src/pages/Planos.tsx`, `src/pages/LandingPage.tsx`: textos.
- Sem migração de banco, salvo se você optar pelo `trial_ends_at` em `profiles`.
