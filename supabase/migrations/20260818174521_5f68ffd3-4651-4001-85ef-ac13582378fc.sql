-- 1) get_user_plan passa a reconhecer acesso por período do tipo 'trial'
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

-- 2) Um trial por conta e por ambiente
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_one_trial_per_user
  ON public.subscriptions (user_id, environment)
  WHERE access_type = 'trial';

-- 3) Novos cadastros ganham 7 dias de Profissional
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    profile_type,
    oab_number,
    oab_state,
    specialties,
    office_name
  ) VALUES (
    NEW.id,
    CASE WHEN NEW.raw_user_meta_data->>'profile_type' = 'advogado' THEN 'advogado' ELSE 'cidadao' END,
    NULLIF(NEW.raw_user_meta_data->>'oab_number', ''),
    NULLIF(NEW.raw_user_meta_data->>'oab_state', ''),
    COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(COALESCE(NEW.raw_user_meta_data->'specialties', '[]'::jsonb))),
      ARRAY[]::text[]
    ),
    NULLIF(NEW.raw_user_meta_data->>'office_name', '')
  );

  INSERT INTO public.subscriptions (user_id, plan_id, status, environment)
  VALUES (NEW.id, 'free', 'active', 'sandbox');
  INSERT INTO public.subscriptions (user_id, plan_id, status, environment)
  VALUES (NEW.id, 'free', 'active', 'live');

  -- Teste grátis de 7 dias do Profissional (um por conta/ambiente)
  INSERT INTO public.subscriptions (
    user_id, plan_id, status, environment, access_type, access_expires_at
  )
  VALUES
    (NEW.id, 'profissional', 'active', 'sandbox', 'trial', now() + interval '7 days'),
    (NEW.id, 'profissional', 'active', 'live', 'trial', now() + interval '7 days')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$function$;

-- 4) Contas gratuitas existentes recebem o mesmo teste, uma única vez
INSERT INTO public.subscriptions (user_id, plan_id, status, environment, access_type, access_expires_at)
SELECT u.id, 'profissional', 'active', e.env, 'trial', now() + interval '7 days'
FROM auth.users u
CROSS JOIN (VALUES ('sandbox'), ('live')) AS e(env)
WHERE public.get_user_plan(u.id, e.env) = 'free'
ON CONFLICT DO NOTHING;