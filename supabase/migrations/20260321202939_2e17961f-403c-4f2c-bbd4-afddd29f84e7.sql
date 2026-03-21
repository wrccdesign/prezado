CREATE TABLE IF NOT EXISTS public.cron_ingest_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase INTEGER NOT NULL,
  total_ingested INTEGER DEFAULT 0,
  results JSONB,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cron_ingest_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON public.cron_ingest_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);