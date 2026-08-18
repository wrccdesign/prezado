# Cotas mensais, gratuito enxuto e teste de 7 dias

Muda a economia dos planos: contagem por mês-calendário (America/Sao_Paulo), gratuito reduzido e trial de 7 dias do Profissional para contas novas. Preços não mudam (R$ 49 / R$ 149 mensais, R$ 409 / R$ 1.249 anuais).

## 1. Cotas mensais

`_shared/rate-limit.ts` passa a contar `usage_tracking` do primeiro dia do mês 00:00 (Brasília) até o primeiro dia do mês seguinte. Sem rolagem de saldo. Nada é apagado de `usage_tracking` — muda só a janela de contagem.

Novos limites por mês:

| Ação | Gratuito | Profissional | Escritório |
|---|---|---|---|
| Buscas | 20 | 500 | 2000 |
| Chat | 10 | 300 | 1000 |
| Análise de documentos | 3 | 100 | 400 |
| Diagnósticos | 1 | 60 | 200 |
| Calculadoras | 5 | 300 | 1000 |
| Petições | 0 | 60 | 200 |

Mantido: ação desconhecida é negada com log de erro (sem default silencioso); `diagnostico_completo_free` continua cadastrada explicitamente (1 / 60 / 200); `documento` (leitura/OCR) continua cadastrada para não cobrar duas vezes, alinhada à análise (5 / 200 / 800).

## 2. Mensagem de limite e tela de uso

- Mensagem de bloqueio passa a ser mensal: "Você usou suas N análises deste mês. O limite renova em dd/mm." com link para /planos.
- `usage-summary` devolve `period_start`, `renews_at` (1º dia do mês seguinte) e o consumo do mês; `useUsage` acompanha.
- UI de /conta e do menu do avatar dizem "neste mês" (nunca "hoje") e mostram a data de renovação. Análise de documentos e Calculadoras aparecem explicitamente na lista.

## 3. Teste grátis de 7 dias

- Usa o mesmo modelo do acesso por período já existente: linha em `subscriptions` com `plan_id = 'profissional'`, `access_type = 'trial'`, `access_expires_at = now() + 7 dias`, criada no cadastro pelo trigger `handle_new_user` (um por conta, protegido por índice único parcial de trial por usuário/ambiente).
- `get_user_plan` passa a tratar `trial` como acesso vigente enquanto não expirar, mantendo a regra de maior tier ativo (nunca maior validade). `useSubscription` e `billing-account` reconhecem `trial` da mesma forma.
- Banner no app durante o teste: "Teste Profissional — X dias restantes" com CTA de assinatura; tom de alerta a partir do 5º dia e no último dia.
- Ao expirar não há downgrade manual: como o acesso é por data, o usuário volta a gratuito automaticamente; sem renovação de trial.

## 4. Usuários atuais

- Pagantes ativos: nada muda além da janela virar mensal.
- Gratuitos existentes: passam aos novos limites e veem, por 30 dias, um aviso em /conta explicando a mudança com oferta do teste de 7 dias (concessão única para contas criadas antes da mudança, feita por migração usando o mesmo `access_type = 'trial'`).
- `usage_tracking` preservado.

## 5. Página /planos

- Todos os limites descritos "por mês", exatamente com os números do `PLAN_LIMITS`.
- Selo "7 dias grátis do Profissional" no topo dos planos pagos.
- Seletor mensal/anual mantido (R$ 409 e R$ 1.249).
- Comparativo ganha as linhas Análise de documentos e Calculadoras.

## 6. Fora de escopo

Sem mudança de preço, sem rolagem de saldo, sem créditos avulsos, sem cobrança por excedente, e o fluxo de Pix/checkout só é tocado no necessário para o trial reaproveitar o modelo de acesso.

## Detalhes técnicos

- `rate-limit.ts`: substitui `saoPauloDayStart/End` por `saoPauloMonthStart/End` (offset fixo UTC-3), exporta ambas as datas para reuso; `checkRateLimit` retorna também `renews_at`.
- `_shared/calculo-guard.ts` e demais chamadores passam a montar a mensagem mensal a partir de `renews_at`.
- Migração: `handle_new_user` cria a linha de trial nos dois ambientes; `get_user_plan` inclui `access_type in ('one_time','trial')` na cláusula de acesso por data; backfill de trial para usuários gratuitos existentes; índice único parcial impedindo segundo trial.
- Frontend: `useUsage`/`UsageSummary` com textos mensais; novo `TrialBanner` consumindo `useSubscription`; aviso de mudança em /conta com data limite fixa (30 dias).
