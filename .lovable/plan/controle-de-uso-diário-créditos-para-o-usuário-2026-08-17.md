# Controle de uso diário (créditos) para o usuário

Hoje existem limites diários por ação (busca, chat, diagnóstico, petição) aplicados no servidor, mas o usuário não enxerga quanto já usou nem quanto resta. O objetivo é dar essa visibilidade no plano gratuito e nos pagos.

## Limites por plano (já vigentes no servidor)

| Ação | Gratuito | Profissional | Escritório |
|---|---|---|---|
| Buscas de jurisprudência | 5 | 50 | 200 |
| Chat | 3 | 30 | 100 |
| Diagnósticos | 2 | 15 | 50 |
| Petições | 0 | 10 | 30 |

Renovação diária (00:00 UTC).

## O que será construído

1. **Resumo de uso na página Minha conta**
   Um cartão "Seu uso hoje" com uma barra de progresso por ação, mostrando `usado / limite`, restante, e o horário de renovação. Ações indisponíveis no plano (ex.: petições no gratuito) aparecem bloqueadas com link para /planos. Quando o uso passa de 80%, a barra fica em tom de alerta.

2. **Resumo no dropdown do avatar (header)**
   No topo do menu da conta: e-mail, selo do plano atual e três linhas compactas com o restante do dia (buscas, chat, diagnósticos — e petições quando o plano permite), mais o link "Ver detalhes" para /conta. Também disponível no menu mobile.

3. **Atualização automática**
   O resumo é recarregado ao abrir o menu e após cada ação que consome uso, para o número ficar sempre coerente com o que o servidor aplica.

## Detalhes técnicos

- Nova edge function `usage-summary`: autentica o usuário, resolve o plano via `get_user_plan` com o ambiente derivado do origin (mesma lógica de `_shared/rate-limit.ts`) e retorna `{ plan, resets_at, actions: [{ action, used, limit }] }`. Os limites saem de `PLAN_LIMITS`, que será exportado de `_shared/rate-limit.ts` para evitar duplicar valores no frontend.
- Contagem via `usage_tracking` (`created_at >= hoje 00:00 UTC`), agrupada por `action` — leitura apenas, sem gravar nada.
- Novo hook `src/hooks/useUsage.ts` (React Query, `queryKey: ["usage-summary", user.id]`) e componente `src/components/UsageSummary.tsx` com as variantes `full` (Conta) e `compact` (dropdown).
- Invalidação da query no listener global já existente após ações consumidoras (mesmo padrão do evento usado para assinatura).
- Sem mudanças de schema, RLS ou grants: `usage_tracking` já permite o usuário ler o próprio uso.
