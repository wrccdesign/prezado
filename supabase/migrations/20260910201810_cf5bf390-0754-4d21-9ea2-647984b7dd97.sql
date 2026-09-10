ALTER TABLE public.payment_events
  ADD COLUMN IF NOT EXISTS processed_at timestamptz;

UPDATE public.payment_events
SET processed_at = created_at
WHERE processed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_payment_events_unprocessed
  ON public.payment_events (created_at)
  WHERE processed_at IS NULL;