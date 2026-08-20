CREATE OR REPLACE FUNCTION public.search_decisions_vector(query_embedding extensions.vector, match_threshold double precision DEFAULT 0.3, match_count integer DEFAULT 10)
 RETURNS TABLE(id uuid, tribunal text, instancia text, uf text, comarca text, numero_processo text, data_decisao date, relator text, tipo_decisao text, resultado text, resultado_descricao text, temas_juridicos text[], ramos_direito text[], ementa text, resumo_ia text, comarca_pequena boolean, upvotes integer, view_count integer, score_utilidade integer, source_url text, created_at timestamp with time zone, similarity double precision)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'extensions'
AS $function$
  SELECT
    d.id, d.tribunal, d.instancia, d.uf, d.comarca,
    d.numero_processo, d.data_decisao, d.relator, d.tipo_decisao,
    d.resultado, d.resultado_descricao, d.temas_juridicos, d.ramos_direito,
    d.ementa, d.resumo_ia, d.comarca_pequena, d.upvotes, d.view_count,
    d.score_utilidade, d.source_url, d.created_at,
    1 - (d.embedding OPERATOR(extensions.<=>) query_embedding) AS similarity
  FROM public.decisions d
  WHERE d.embedding IS NOT NULL
    AND 1 - (d.embedding OPERATOR(extensions.<=>) query_embedding) > match_threshold
    AND d.ementa IS NOT NULL
    AND length(d.ementa) >= 50
    AND d.numero_processo IS NOT NULL
    AND d.numero_processo NOT LIKE '%<UNKNOWN>%'
    AND (d.resultado IS NULL OR d.resultado NOT IN ('Em andamento', 'Distribuição', 'Em Andamento / Distribuição', 'Em tramitação', 'Em Andamento', 'em tramitação'))
    AND (d.data_decisao IS NULL OR d.data_decisao >= '2015-01-01')
  ORDER BY d.embedding OPERATOR(extensions.<=>) query_embedding
  LIMIT match_count;
$function$;