-- C1: pausa a fase 1 do cron (job preservado, apenas desagendado)
SELECT cron.unschedule('cron-ingest-phase1');

-- C2: marca de cache nas decisões
ALTER TABLE public.decisions ADD COLUMN IF NOT EXISTS cached_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_decisions_cached_at ON public.decisions (cached_at DESC);

-- C2: cache por termo de busca
CREATE TABLE IF NOT EXISTS public.search_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term_key text NOT NULL UNIQUE,
  raw_query text NOT NULL,
  results_found integer NOT NULL DEFAULT 0,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.search_cache TO service_role;

ALTER TABLE public.search_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages search cache"
  ON public.search_cache FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

COMMENT ON TABLE public.search_cache IS 'Cache de termos já consultados ao vivo no DataJud. Uso interno das edge functions (service role); sem acesso de cliente.';