CREATE OR REPLACE FUNCTION public.search_decisions(
  search_query text,
  filter_tribunal text DEFAULT NULL,
  filter_uf text DEFAULT NULL,
  filter_ramo text DEFAULT NULL,
  filter_instancia text DEFAULT NULL,
  filter_comarca_pequena boolean DEFAULT NULL,
  result_limit integer DEFAULT 20,
  result_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid, tribunal text, instancia text, uf text, comarca text,
  numero_processo text, data_decisao date, relator text, orgao_julgador text,
  tipo_decisao text, resultado text, resultado_descricao text,
  temas_juridicos text[], ramos_direito text[], ementa text, resumo_ia text,
  comarca_pequena boolean, upvotes integer, view_count integer,
  score_utilidade integer, source_url text, created_at timestamptz, rank real
)
LANGUAGE sql STABLE
SET search_path TO 'public'
AS $$
  SELECT
    d.id, d.tribunal, d.instancia, d.uf, d.comarca,
    d.numero_processo, d.data_decisao, d.relator, d.orgao_julgador, d.tipo_decisao,
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
    AND (
      (d.ementa IS NOT NULL AND length(d.ementa) >= 50)
      OR
      (d.resumo_ia IS NOT NULL AND length(d.resumo_ia) >= 30)
    )
    AND d.numero_processo IS NOT NULL
    AND d.numero_processo NOT LIKE '%<UNKNOWN>%'
    AND (d.resultado IS NULL OR d.resultado NOT IN ('Em andamento', 'Distribuição', 'Em Andamento / Distribuição', 'Em tramitação', 'Em Andamento', 'em tramitação'))
    AND (d.data_decisao IS NULL OR d.data_decisao >= '2015-01-01')
    AND (filter_tribunal IS NULL OR d.tribunal = filter_tribunal)
    AND (filter_uf IS NULL OR d.uf = filter_uf)
    AND (filter_instancia IS NULL OR d.instancia = filter_instancia)
    AND (filter_comarca_pequena IS NULL OR d.comarca_pequena = filter_comarca_pequena)
    AND (filter_ramo IS NULL OR filter_ramo = ANY(d.ramos_direito))
  ORDER BY rank DESC
  LIMIT result_limit
  OFFSET result_offset;
$$;