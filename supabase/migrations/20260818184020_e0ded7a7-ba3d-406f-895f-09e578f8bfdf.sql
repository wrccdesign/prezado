CREATE TABLE IF NOT EXISTS public.ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  function_name text NOT NULL,
  model text NOT NULL,
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  environment text NOT NULL DEFAULT 'live',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.ai_usage TO service_role;

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages ai usage" ON public.ai_usage;
CREATE POLICY "Service role manages ai usage"
  ON public.ai_usage FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON public.ai_usage (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_function_created ON public.ai_usage (function_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_created ON public.usage_tracking (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_action_created ON public.usage_tracking (user_id, action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_decisions_ramos_direito ON public.decisions USING gin (ramos_direito);
CREATE INDEX IF NOT EXISTS idx_decisions_instancia ON public.decisions (instancia);
CREATE INDEX IF NOT EXISTS idx_decisions_comarca_pequena ON public.decisions (comarca_pequena) WHERE comarca_pequena = true;