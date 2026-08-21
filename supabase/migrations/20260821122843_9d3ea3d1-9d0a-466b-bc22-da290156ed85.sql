ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

UPDATE public.profiles SET onboarding_completed = true WHERE onboarding_completed = false;

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
    office_name,
    onboarding_completed
  ) VALUES (
    NEW.id,
    CASE WHEN NEW.raw_user_meta_data->>'profile_type' = 'advogado' THEN 'advogado' ELSE 'cidadao' END,
    NULLIF(NEW.raw_user_meta_data->>'oab_number', ''),
    NULLIF(NEW.raw_user_meta_data->>'oab_state', ''),
    COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(COALESCE(NEW.raw_user_meta_data->'specialties', '[]'::jsonb))),
      ARRAY[]::text[]
    ),
    NULLIF(NEW.raw_user_meta_data->>'office_name', ''),
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email') = 'email'
  );

  INSERT INTO public.subscriptions (user_id, plan_id, status, environment)
  VALUES (NEW.id, 'free', 'active', 'sandbox');
  INSERT INTO public.subscriptions (user_id, plan_id, status, environment)
  VALUES (NEW.id, 'free', 'active', 'live');

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