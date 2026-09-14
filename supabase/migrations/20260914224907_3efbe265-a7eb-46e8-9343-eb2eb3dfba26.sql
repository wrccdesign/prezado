-- Ensure RLS is on for both internal tables
ALTER TABLE public.anon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_cache ENABLE ROW LEVEL SECURITY;

-- Remove all client-side privileges: these tables are written/read only by edge functions
REVOKE ALL ON public.search_cache FROM anon, authenticated;
REVOKE ALL ON public.anon_usage FROM anon, authenticated;

GRANT ALL ON public.search_cache TO service_role;
GRANT ALL ON public.anon_usage TO service_role;