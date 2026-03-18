-- Drop permissive policies
DROP POLICY IF EXISTS "Authenticated users can insert decisions" ON public.decisions;
DROP POLICY IF EXISTS "Service role can update decisions" ON public.decisions;

-- INSERT: service_role only
CREATE POLICY "Service role can insert decisions"
ON public.decisions FOR INSERT
TO service_role
WITH CHECK (true);

-- UPDATE: service_role only
CREATE POLICY "Service role can update decisions"
ON public.decisions FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- DELETE: service_role only
CREATE POLICY "Service role can delete decisions"
ON public.decisions FOR DELETE
TO service_role
USING (true);