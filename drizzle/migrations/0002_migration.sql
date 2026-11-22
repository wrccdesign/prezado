ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ga4_client_id text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_started_tracked_at timestamptz;

CREATE TABLE public.ga4_purchases_enviados (
  payment_id text PRIMARY KEY,
  user_id uuid,
  plano text,
  valor numeric,
  enviado boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.ga4_purchases_enviados TO service_role;
ALTER TABLE public.ga4_purchases_enviados ENABLE ROW LEVEL SECURITY;