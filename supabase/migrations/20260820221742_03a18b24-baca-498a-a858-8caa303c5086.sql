CREATE OR REPLACE FUNCTION public.unschedule_backfill_embeddings()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron
AS $$
DECLARE
  found_job boolean := false;
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'backfill-embeddings-5min') THEN
    PERFORM cron.unschedule('backfill-embeddings-5min');
    found_job := true;
  END IF;
  RETURN found_job;
END;
$$;

REVOKE ALL ON FUNCTION public.unschedule_backfill_embeddings() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.unschedule_backfill_embeddings() TO service_role;