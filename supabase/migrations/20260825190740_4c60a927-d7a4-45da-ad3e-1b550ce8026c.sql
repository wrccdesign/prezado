-- 1) Court list: stop relying on an elevated-privilege function
CREATE POLICY "Public can read active court metadata"
ON public.tj_scraping_config
FOR SELECT
TO anon, authenticated
USING (true);

GRANT SELECT ON public.tj_scraping_config TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.list_tribunais()
RETURNS TABLE(tribunal text, nome_completo text)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT t.tribunal, t.nome_completo
  FROM public.tj_scraping_config t
  ORDER BY t.tribunal
$$;

-- 2) Storage policies scoped to authenticated role
DROP POLICY IF EXISTS "Users can upload own logo" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own logo" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own logo" ON storage.objects;

CREATE POLICY "Users can upload own logo"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'office-logos' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own logo"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'office-logos' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'office-logos' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own logo"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'office-logos' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 3) Owners may delete their own profile row
CREATE POLICY "Users can delete own profile"
ON public.profiles FOR DELETE TO authenticated
USING (auth.uid() = user_id);