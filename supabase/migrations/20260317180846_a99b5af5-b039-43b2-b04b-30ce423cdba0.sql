
-- ITEM 2: Add orgao_julgador column
ALTER TABLE public.decisions ADD COLUMN orgao_julgador TEXT;

-- ITEM 3: Add UNIQUE constraint on numero_processo
ALTER TABLE public.decisions ADD CONSTRAINT decisions_numero_processo_unique UNIQUE (numero_processo);

-- Add UPDATE RLS policy (needed for upsert to work)
CREATE POLICY "Service role can update decisions"
ON public.decisions
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
