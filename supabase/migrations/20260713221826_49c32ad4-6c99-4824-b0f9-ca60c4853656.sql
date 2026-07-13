-- Grace period: canceled subscription retains plan until current_period_end
CREATE OR REPLACE FUNCTION public.get_user_plan(p_user_id uuid, p_env text DEFAULT 'live')
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT plan_id FROM public.subscriptions
     WHERE user_id = p_user_id
       AND environment = p_env
       AND plan_id <> 'free'
       AND (
         (status IN ('active', 'trialing', 'past_due')
           AND (current_period_end IS NULL OR current_period_end > now()))
         OR (status = 'canceled' AND current_period_end IS NOT NULL AND current_period_end > now())
       )
     ORDER BY current_period_end DESC NULLS LAST
     LIMIT 1),
    'free'
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_user_plan(uuid, text) TO service_role;

-- Defense-in-depth helper for future server-side gates
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid uuid, check_env text DEFAULT 'live')
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_plan(user_uuid, check_env) <> 'free';
$$;

GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) TO service_role;