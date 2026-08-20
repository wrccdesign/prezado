CREATE TABLE public.anon_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_hash text NOT NULL,
  action text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_anon_usage_ip_created ON public.anon_usage (ip_hash, created_at DESC);

GRANT ALL ON public.anon_usage TO service_role;
REVOKE ALL ON public.anon_usage FROM anon, authenticated;

ALTER TABLE public.anon_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages anon usage"
  ON public.anon_usage FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);