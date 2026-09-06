CREATE OR REPLACE FUNCTION public.search_sumulas(
  search_query text,
  filter_tribunal text DEFAULT NULL,
  filter_area text DEFAULT NULL,
  result_limit integer DEFAULT 5,
  include_nao_vigentes boolean DEFAULT false
)
RETURNS TABLE(
  id uuid, tribunal text, tipo text, numero integer, enunciado text,
  situacao text, data_aprovacao date, area text, source_url text, rank real
)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  WITH q AS (
    SELECT to_tsquery(
      'portuguese',
      NULLIF(array_to_string(tsvector_to_array(to_tsvector('portuguese', coalesce(search_query, ''))), ' | '), '')
    ) AS tsq
  )
  SELECT s.id, s.tribunal, s.tipo, s.numero, s.enunciado, s.situacao,
         s.data_aprovacao, s.area, s.source_url,
         ts_rank(
           to_tsvector('portuguese', coalesce(s.enunciado,'') || ' ' || coalesce(s.area,'')),
           q.tsq
         ) AS rank
  FROM public.sumulas s, q
  WHERE q.tsq IS NOT NULL
    AND to_tsvector('portuguese', coalesce(s.enunciado,'') || ' ' || coalesce(s.area,'')) @@ q.tsq
    AND (include_nao_vigentes IS TRUE OR s.situacao = 'vigente')
    AND (filter_tribunal IS NULL OR s.tribunal = filter_tribunal)
    AND (filter_area IS NULL OR s.area = filter_area)
  ORDER BY rank DESC, s.tribunal, s.numero
  LIMIT result_limit;
$$;

GRANT EXECUTE ON FUNCTION public.search_sumulas(text, text, text, integer, boolean) TO anon, authenticated, service_role;