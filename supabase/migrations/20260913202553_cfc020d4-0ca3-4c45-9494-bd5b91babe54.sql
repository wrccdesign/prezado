ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS checkout_url text,
  ADD COLUMN IF NOT EXISTS checkout_expires_at timestamptz;