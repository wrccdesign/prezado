

## Configurar pg_cron para ingestão automática

### O que será feito

Executar o SQL que você forneceu para agendar dois cron jobs:

- **Phase 1 (DataJud):** Todos os dias às 06:00 UTC
- **Phase 2 (Firecrawl):** Toda segunda-feira às 04:00 UTC

### Passos

1. **Habilitar extensões** `pg_cron` e `pg_net` (se ainda não estiverem ativas)
2. **Criar os dois agendamentos** usando `cron.schedule()` com `net.http_post()` chamando a edge function `cron-ingest`

### Observação técnica

- As edge functions estão configuradas com `verify_jwt = false`, então a anon key funciona para autenticação
- A edge function `cron-ingest` internamente usa `SUPABASE_SERVICE_ROLE_KEY` (via `Deno.env.get`) para chamar as outras funções de scraping, então a autenticação interna está coberta
- O SQL será executado diretamente no banco (não como migration, pois contém dados específicos do projeto)

### SQL a executar

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'cron-ingest-phase1',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url:='https://hfhzkvuoywgxjklpiydq.supabase.co/functions/v1/cron-ingest',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbG...pDA4"}'::jsonb,
    body:='{"phase": 1}'::jsonb
  ) as request_id;
  $$
);

SELECT cron.schedule(
  'cron-ingest-phase2',
  '0 4 * * 1',
  $$
  SELECT net.http_post(
    url:='https://hfhzkvuoywgxjklpiydq.supabase.co/functions/v1/cron-ingest',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbG...pDA4"}'::jsonb,
    body:='{"phase": 2}'::jsonb
  ) as request_id;
  $$
);
```

