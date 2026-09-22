ALTER TABLE public.ai_usage
  ADD COLUMN IF NOT EXISTS tier text,
  ADD COLUMN IF NOT EXISTS success boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS error_status integer,
  ADD COLUMN IF NOT EXISTS duration_ms integer,
  ADD COLUMN IF NOT EXISTS cost_brl numeric(12,6);

CREATE INDEX IF NOT EXISTS ai_usage_created_at_idx ON public.ai_usage (created_at DESC);
CREATE INDEX IF NOT EXISTS ai_usage_function_created_idx ON public.ai_usage (function_name, created_at DESC);