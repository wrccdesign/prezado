

## Plan: Harden `decisions` RLS + pgvector schema

### 1. Database migration — Tighten RLS on `decisions`

Drop the overly permissive INSERT/UPDATE policies and replace with service_role-only policies. Add a DELETE policy for service_role only. Keep the public SELECT as-is.

```sql
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
```

### 2. pgvector schema

The pgvector extension is installed by Supabase itself. Moving it from `public` to `extensions` requires `ALTER EXTENSION vector SET SCHEMA extensions`, but this can break existing functions (`search_decisions_vector`) that reference the `vector` type. Since Lovable Cloud manages the extension installation and the vector type is used across functions and columns, moving it risks breakage. I recommend **not moving it** — the security concern is minimal since pgvector functions are utility operators, not data-access functions.

### Summary

- One migration with the 4 SQL statements above (drop 2 old policies, create 3 new ones)
- No pgvector schema change (risk of breaking existing functions outweighs benefit)
- Edge functions already use `SUPABASE_SERVICE_ROLE_KEY`, so they will continue to work with the new policies

