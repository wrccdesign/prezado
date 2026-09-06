CREATE TABLE public.sumulas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tribunal text NOT NULL,
  tipo text NOT NULL DEFAULT 'comum',
  numero integer NOT NULL,
  enunciado text NOT NULL,
  situacao text NOT NULL DEFAULT 'vigente',
  data_aprovacao date,
  area text,
  source_url text,
  embedding extensions.vector(1024),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sumulas_tipo_chk CHECK (tipo IN ('comum','vinculante')),
  CONSTRAINT sumulas_situacao_chk CHECK (situacao IN ('vigente','cancelada','revisada')),
  CONSTRAINT sumulas_unica UNIQUE (tribunal, tipo, numero)
);

GRANT SELECT ON public.sumulas TO anon;
GRANT SELECT ON public.sumulas TO authenticated;
GRANT ALL ON public.sumulas TO service_role;

ALTER TABLE public.sumulas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Súmulas são públicas para leitura"
  ON public.sumulas FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Somente o sistema grava súmulas"
  ON public.sumulas FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER update_sumulas_updated_at
  BEFORE UPDATE ON public.sumulas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_sumulas_fts ON public.sumulas
  USING gin (to_tsvector('portuguese', coalesce(enunciado,'') || ' ' || coalesce(area,'')));

CREATE INDEX idx_sumulas_embedding_cosine ON public.sumulas
  USING hnsw (embedding extensions.vector_cosine_ops) WITH (m = 16, ef_construction = 64);

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
  SELECT s.id, s.tribunal, s.tipo, s.numero, s.enunciado, s.situacao,
         s.data_aprovacao, s.area, s.source_url,
         ts_rank(
           to_tsvector('portuguese', coalesce(s.enunciado,'') || ' ' || coalesce(s.area,'')),
           websearch_to_tsquery('portuguese', search_query)
         ) AS rank
  FROM public.sumulas s
  WHERE to_tsvector('portuguese', coalesce(s.enunciado,'') || ' ' || coalesce(s.area,''))
        @@ websearch_to_tsquery('portuguese', search_query)
    AND (include_nao_vigentes IS TRUE OR s.situacao = 'vigente')
    AND (filter_tribunal IS NULL OR s.tribunal = filter_tribunal)
    AND (filter_area IS NULL OR s.area = filter_area)
  ORDER BY rank DESC, s.tribunal, s.numero
  LIMIT result_limit;
$$;

GRANT EXECUTE ON FUNCTION public.search_sumulas(text, text, text, integer, boolean) TO anon, authenticated, service_role;