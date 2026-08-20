# Ingestão: controle de acesso + conserto do pipeline

## Bloco A — Controle de acesso (urgente)

Hoje `/admin/ingestao` só exige login, e `ingest-datajud` só exige um usuário autenticado. Qualquer conta gratuita pode disparar ingestão em massa.

1. **Papéis (migração no banco)**
   - Enum `app_role` ('admin', 'user') e tabela `public.user_roles` (id, user_id → auth.users on delete cascade, role, created_at; UNIQUE(user_id, role)).
   - GRANT: `select` para `authenticated`, `all` para `service_role`. Sem grants de insert/update/delete para usuários.
   - RLS ligada: usuário lê apenas os próprios papéis; escrita só por service role.
   - Função `public.has_role(_user_id uuid, _role app_role) returns boolean`, SQL, STABLE, SECURITY DEFINER, `set search_path = public`.
   - Nenhum papel concedido automaticamente. O SQL de promoção fica no final, para execução manual.

2. **Rota protegida** — `src/pages/AdminIngestao.tsx`: novo hook `useIsAdmin` (consulta `user_roles` do usuário logado). Enquanto carrega, não renderiza nada; sem papel admin, `<Navigate to="/" replace />` sem mensagem.

3. **Função protegida** — em `ingest-datajud`, após `requireUser`, consulta `user_roles` com service role; se não for admin, responde 403 e encerra antes de qualquer chamada externa. Essa é a barreira real.

4. **Navegação** — verificar `AppHeader` (hoje não há link para a página); se houver qualquer entrada, ela passa a depender de `useIsAdmin`.

5. **Chave DataJud** — passa a ler a secret `DATAJUD_API_KEY` (já existe no projeto); a constante embutida vira fallback comentado apenas para o caso de a secret sumir, e o mesmo tratamento é aplicado onde a constante se repete nos scrapers.

## Bloco B — Pipeline quebrado

**Causa raiz (confirmada por leitura de código + dados):** `ingest-datajud` já foi migrado para `_shared/ai.ts` (API direta do Google) — não é ele que roda no cron. O `cron-ingest` chama `scrape-tj-fallback` (fase 1) e `scrape-esaj` / `scrape-tj-proprio` (fase 2), e os três ainda chamam a Anthropic direto com `model: "claude-sonnet-4-20250514"`. Cada item falha individualmente na extração por IA — exatamente o padrão "errors = nº de resultados pedidos". A última execução registrada (29/06) mostra `errors: 1` em todos os 8 tribunais da fase 2, com zero ingeridos. `decisions` não recebe registro novo desde 02/04.

O que falta confirmar é o erro exato da Anthropic (modelo descontinuado x crédito/chave). Primeira etapa da execução: rodar `ingest-datajud` (TJSP, "dano moral", size 3) e um `scrape-tj-fallback` e ler os logs, para nomear o erro antes de trocar qualquer coisa.

1. **Conserto** — migrar `scrape-tj-fallback`, `scrape-esaj` e `scrape-tj-proprio` para `aiChatTool`/`aiChatText` do `_shared/ai.ts` (mesmo prompt e mesmo schema de extração), eliminando a chamada direta à Anthropic e o modelo fixo. Se o teste mostrar que a causa é outra, volto a te falar antes de mudar o escopo.

2. **Log confiável** — `cron-ingest` passa a gravar em `cron_ingest_log` SEMPRE, inclusive em falha total, com campo de mensagem de erro no `results` (try/finally). Nada de gravação silenciosa perdida.

3. **Alerta visível** — faixa no topo de `/admin/ingestao` mostrando a data da última ingestão bem-sucedida (maior `created_at` em `decisions` e última execução com `total_ingested > 0`), destacada em vermelho quando passar de 7 dias.

4. **Bug de contagem** — remover o `if (existing) { updated++ }` morto no upsert de `ingest-datajud`; o caminho só é alcançado para registros novos.

5. **Teto de custo** — `size` limitado a 50 por chamada (400 se exceder) em `ingest-datajud`; o consumo de IA já é registrado em `ai_usage` pelo `_shared/ai.ts`, e a migração dos scrapers estende esse registro a eles.

## Fora de escopo
Pagamentos, cotas, calculadoras e refino visual permanecem intocados. Nenhum registro existente de `decisions`, `profiles` ou `cron_ingest_log` é apagado ou alterado.

## SQL para você virar admin (rodar manualmente depois da migração)

```sql
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'SEU_EMAIL_AQUI'
on conflict (user_id, role) do nothing;
```
