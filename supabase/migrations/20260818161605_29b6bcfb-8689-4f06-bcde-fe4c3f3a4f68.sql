ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS access_type text NOT NULL DEFAULT 'recurring',
  ADD COLUMN IF NOT EXISTS access_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_provider_ref text;

ALTER TABLE public.subscriptions ALTER COLUMN stripe_subscription_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_env_expires
  ON public.subscriptions (user_id, environment, access_expires_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_provider_ref
  ON public.subscriptions (payment_provider_ref, environment)
  WHERE payment_provider_ref IS NOT NULL;

CREATE OR REPLACE FUNCTION public.get_user_plan(p_user_id uuid, p_env text DEFAULT 'live'::text)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT s.plan_id
       FROM public.subscriptions s
      WHERE s.user_id = p_user_id
        AND s.environment = p_env
        AND s.plan_id <> 'free'
        AND (
          (COALESCE(s.access_type, 'recurring') = 'one_time'
             AND s.access_expires_at IS NOT NULL
             AND s.access_expires_at > now())
          OR
          (COALESCE(s.access_type, 'recurring') = 'recurring'
             AND (
               (s.status IN ('active', 'trialing', 'past_due')
                  AND (s.current_period_end IS NULL OR s.current_period_end > now()))
               OR (s.status = 'canceled'
                  AND s.current_period_end IS NOT NULL
                  AND s.current_period_end > now())
             ))
        )
      ORDER BY CASE s.plan_id WHEN 'escritorio' THEN 2 WHEN 'profissional' THEN 1 ELSE 0 END DESC
      LIMIT 1),
    'free'
  );
$function$;