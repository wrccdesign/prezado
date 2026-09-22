CREATE POLICY "Service role manages indices_economicos"
ON public.indices_economicos
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);