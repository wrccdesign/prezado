-- Drop existing embedding data (all NULL anyway) and change dimension
ALTER TABLE public.decisions ALTER COLUMN embedding TYPE vector(1024) USING NULL;

-- Create HNSW index for cosine similarity search
CREATE INDEX IF NOT EXISTS idx_decisions_embedding_cosine 
ON public.decisions 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Create a DB function for vector similarity search
CREATE OR REPLACE FUNCTION public.search_decisions_vector(
  query_embedding vector(1024),
  match_threshold float DEFAULT 0.3,
  match_count int DEFAULT 10
)
RETURNS TABLE(
  id uuid,
  tribunal text,
  instancia text,
  uf text,
  comarca text,
  numero_processo text,
  data_decisao date,
  relator text,
  tipo_decisao text,
  resultado text,
  resultado_descricao text,
  temas_juridicos text[],
  ramos_direito text[],
  ementa text,
  resumo_ia text,
  comarca_pequena boolean,
  upvotes integer,
  view_count integer,
  score_utilidade integer,
  source_url text,
  created_at timestamptz,
  similarity float
)
LANGUAGE sql STABLE
SET search_path TO 'public'
AS $$
  SELECT
    d.id, d.tribunal, d.instancia, d.uf, d.comarca,
    d.numero_processo, d.data_decisao, d.relator, d.tipo_decisao,
    d.resultado, d.resultado_descricao, d.temas_juridicos, d.ramos_direito,
    d.ementa, d.resumo_ia, d.comarca_pequena, d.upvotes, d.view_count,
    d.score_utilidade, d.source_url, d.created_at,
    1 - (d.embedding <=> query_embedding) AS similarity
  FROM public.decisions d
  WHERE d.embedding IS NOT NULL
    AND 1 - (d.embedding <=> query_embedding) > match_threshold
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
$$;