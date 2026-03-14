
-- Fix search_path for the search_decisions function
CREATE OR REPLACE FUNCTION public.search_decisions(
  search_query text,
  filter_tribunal text DEFAULT NULL,
  filter_uf text DEFAULT NULL,
  filter_ramo text DEFAULT NULL,
  filter_instancia text DEFAULT NULL,
  filter_comarca_pequena boolean DEFAULT NULL,
  result_limit int DEFAULT 20,
  result_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid, tribunal text, instancia text, uf text, comarca text,
  numero_processo text, data_decisao date, relator text, tipo_decisao text,
  resultado text, resultado_descricao text, temas_juridicos text[],
  ramos_direito text[], ementa text, resumo_ia text, comarca_pequena boolean,
  upvotes int, view_count int, score_utilidade int, source_url text,
  created_at timestamptz, rank real
)
LANGUAGE sql STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    d.id, d.tribunal, d.instancia, d.uf, d.comarca,
    d.numero_processo, d.data_decisao, d.relator, d.tipo_decisao,
    d.resultado, d.resultado_descricao, d.temas_juridicos, d.ramos_direito,
    d.ementa, d.resumo_ia, d.comarca_pequena, d.upvotes, d.view_count,
    d.score_utilidade, d.source_url, d.created_at,
    ts_rank(
      to_tsvector('portuguese', coalesce(d.ementa, '') || ' ' || coalesce(d.full_text, '') || ' ' || coalesce(d.resumo_ia, '')),
      websearch_to_tsquery('portuguese', search_query)
    ) AS rank
  FROM public.decisions d
  WHERE
    to_tsvector('portuguese', coalesce(d.ementa, '') || ' ' || coalesce(d.full_text, '') || ' ' || coalesce(d.resumo_ia, ''))
    @@ websearch_to_tsquery('portuguese', search_query)
    AND (filter_tribunal IS NULL OR d.tribunal = filter_tribunal)
    AND (filter_uf IS NULL OR d.uf = filter_uf)
    AND (filter_instancia IS NULL OR d.instancia = filter_instancia)
    AND (filter_comarca_pequena IS NULL OR d.comarca_pequena = filter_comarca_pequena)
    AND (filter_ramo IS NULL OR filter_ramo = ANY(d.ramos_direito))
  ORDER BY rank DESC
  LIMIT result_limit
  OFFSET result_offset;
$$;
