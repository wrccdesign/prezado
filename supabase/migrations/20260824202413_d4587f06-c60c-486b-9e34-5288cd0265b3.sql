CREATE OR REPLACE FUNCTION public.list_tribunais()
RETURNS TABLE (tribunal text, nome_completo text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.tribunal, c.nome_completo
  FROM public.tj_scraping_config c
  ORDER BY c.priority DESC
$$;

REVOKE EXECUTE ON FUNCTION public.list_tribunais() FROM public;
GRANT EXECUTE ON FUNCTION public.list_tribunais() TO anon, authenticated, service_role;