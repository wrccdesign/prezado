REVOKE EXECUTE ON FUNCTION public.get_user_plan(uuid, text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.get_user_plan(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) TO service_role;