CREATE OR REPLACE FUNCTION public.admin_decisions_por_tribunal()
RETURNS TABLE(tribunal text, total bigint, indexadas bigint, ultimos_7d bigint, ultima_entrada timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(d.tribunal,'(sem tribunal)'), count(*),
    count(*) FILTER (WHERE d.embedding IS NOT NULL),
    count(*) FILTER (WHERE d.created_at >= now() - interval '7 days'),
    max(d.created_at)
  FROM public.decisions d
  WHERE public.has_role(auth.uid(),'admin')
  GROUP BY 1 ORDER BY 2 DESC;
$$;

CREATE OR REPLACE FUNCTION public.admin_ingest_runs(p_limit integer DEFAULT 10)
RETURNS TABLE(id uuid, phase integer, total_ingested integer, results jsonb, executed_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT l.id, l.phase, l.total_ingested, l.results, l.executed_at
  FROM public.cron_ingest_log l
  WHERE public.has_role(auth.uid(),'admin')
  ORDER BY l.executed_at DESC NULLS LAST
  LIMIT greatest(1, least(p_limit, 50));
$$;

REVOKE ALL ON FUNCTION public.admin_decisions_por_tribunal() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_ingest_runs(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_decisions_por_tribunal() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_ingest_runs(integer) TO authenticated;