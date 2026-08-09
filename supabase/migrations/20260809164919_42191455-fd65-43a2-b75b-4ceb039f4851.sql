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
  RETURN NEW;
END;
$function$;