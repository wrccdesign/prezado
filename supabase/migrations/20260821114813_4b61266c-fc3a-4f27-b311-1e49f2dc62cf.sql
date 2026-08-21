REVOKE ALL ON public.anon_usage FROM anon, authenticated;
GRANT ALL ON public.anon_usage TO service_role;