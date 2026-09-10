-- Migra a tabela subscriptions de identificadores Stripe para identificadores neutros de provedor.
-- Histórico: nasceu como paddle_subscription_id, foi renomeada para stripe_subscription_id,
-- agora vira provider_subscription_id. Nenhum dado é perdido.

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'stripe',
  ADD COLUMN IF NOT EXISTS provider_subscription_id text,
  ADD COLUMN IF NOT EXISTS provider_customer_id text;

-- Migrar dados existentes
UPDATE public.subscriptions
SET provider_subscription_id = stripe_subscription_id,
    provider_customer_id = stripe_customer_id
WHERE provider_subscription_id IS NULL;

-- Dropar constraint/index antiga sobre stripe_subscription_id
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_stripe_subscription_id_key;
DROP INDEX IF EXISTS idx_subscriptions_stripe_id;

-- Remover colunas antigas
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS stripe_subscription_id;
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS stripe_customer_id;

-- Índice único composto para evitar duplicatas do mesmo provedor/ambiente
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_provider_ref_unique
  ON public.subscriptions (provider_subscription_id, provider, environment)
  WHERE provider_subscription_id IS NOT NULL;

-- payment_events ganha coluna neutra para novos eventos Asaas
ALTER TABLE public.payment_events
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'stripe',
  ADD COLUMN IF NOT EXISTS provider_subscription_id text;

CREATE INDEX IF NOT EXISTS idx_payment_events_provider_sub
  ON public.payment_events (provider_subscription_id)
  WHERE provider_subscription_id IS NOT NULL;

-- Atualizar funções que leem as colunas antigas
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
          (COALESCE(s.access_type, 'recurring') IN ('one_time', 'trial')
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

CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid uuid, check_env text DEFAULT 'live'::text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT public.get_user_plan(user_uuid, check_env) <> 'free';
$function$;
