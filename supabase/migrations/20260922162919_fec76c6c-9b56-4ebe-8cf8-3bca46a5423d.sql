CREATE OR REPLACE FUNCTION public.ai_usage_summary(p_days integer DEFAULT 30)
RETURNS TABLE(
  dia date,
  function_name text,
  chamadas bigint,
  falhas bigint,
  input_tokens bigint,
  output_tokens bigint,
  custo_brl numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (u.created_at AT TIME ZONE 'America/Sao_Paulo')::date AS dia,
    u.function_name,
    count(*) AS chamadas,
    count(*) FILTER (WHERE u.success IS FALSE) AS falhas,
    COALESCE(sum(u.input_tokens), 0)::bigint AS input_tokens,
    COALESCE(sum(u.output_tokens), 0)::bigint AS output_tokens,
    COALESCE(sum(u.cost_brl), 0)::numeric AS custo_brl
  FROM public.ai_usage u
  WHERE public.has_role(auth.uid(), 'admin')
    AND u.created_at >= now() - make_interval(days => greatest(1, least(p_days, 180)))
  GROUP BY 1, 2
  ORDER BY 1 DESC, custo_brl DESC;
$$;

REVOKE ALL ON FUNCTION public.ai_usage_summary(integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ai_usage_summary(integer) TO authenticated, service_role;