ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_environment_key;

CREATE TABLE IF NOT EXISTS public.payment_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  environment text NOT NULL,
  paddle_subscription_id text,
  occurred_at timestamptz,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_events_sub ON public.payment_events(paddle_subscription_id);

GRANT ALL ON public.payment_events TO service_role;

ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages payment events" ON public.payment_events;
CREATE POLICY "Service role manages payment events"
  ON public.payment_events FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');