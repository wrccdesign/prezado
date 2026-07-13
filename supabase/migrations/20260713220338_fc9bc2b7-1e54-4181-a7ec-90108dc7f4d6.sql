
-- Revoke EXECUTE on SECURITY DEFINER functions from anon/authenticated
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_user_plan(uuid, text) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.get_user_plan(uuid, text) TO service_role;

-- Restrict tj_scraping_config to service_role only
DROP POLICY IF EXISTS "Anyone can read tj_scraping_config" ON public.tj_scraping_config;
REVOKE SELECT ON public.tj_scraping_config FROM anon, authenticated;
CREATE POLICY "Service role manages tj_scraping_config"
  ON public.tj_scraping_config
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Prevent public LISTING of office-logos bucket (public URLs still work via CDN)
DROP POLICY IF EXISTS "Anyone can view logos" ON storage.objects;
CREATE POLICY "Users can list own logos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'office-logos'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );
