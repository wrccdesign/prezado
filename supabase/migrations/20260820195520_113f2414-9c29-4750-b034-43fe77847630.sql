DO $$
DECLARE
  v_secret text;
BEGIN
  SELECT substring(command from 'x-sync-secret": "([^"]+)"') INTO v_secret
    FROM cron.job WHERE jobname = 'sync-indices-daily';

  IF v_secret IS NULL THEN
    RAISE EXCEPTION 'segredo interno não encontrado no job sync-indices-daily';
  END IF;

  PERFORM cron.unschedule('backfill-embeddings-5min')
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'backfill-embeddings-5min');

  PERFORM cron.schedule(
    'backfill-embeddings-5min',
    '*/5 * * * *',
    format($f$
      SELECT net.http_post(
        url := 'https://hfhzkvuoywgxjklpiydq.supabase.co/functions/v1/backfill-embeddings',
        headers := %L::jsonb,
        body := '{"batch_size": 96}'::jsonb
      );
    $f$, json_build_object('Content-Type', 'application/json', 'x-sync-secret', v_secret)::text)
  );

  PERFORM cron.unschedule('cron-ingest-phase2')
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cron-ingest-phase2');

  PERFORM cron.schedule(
    'cron-ingest-phase2',
    '0 4 * * 1',
    format($f$
      SELECT net.http_post(
        url := 'https://hfhzkvuoywgxjklpiydq.supabase.co/functions/v1/cron-ingest',
        headers := %L::jsonb,
        body := '{"phase": 2}'::jsonb
      );
    $f$, json_build_object('Content-Type', 'application/json', 'x-sync-secret', v_secret)::text)
  );
END $$;