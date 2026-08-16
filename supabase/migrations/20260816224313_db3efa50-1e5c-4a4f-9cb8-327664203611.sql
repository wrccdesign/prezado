CREATE TABLE public.indices_economicos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_indice text NOT NULL,
  data_ref date NOT NULL,
  valor_percentual numeric(18,8) NOT NULL,
  fator numeric(20,10),
  fonte text NOT NULL DEFAULT 'BCB/SGS',
  codigo_sgs integer,
  sincronizado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT indices_economicos_unique UNIQUE (codigo_indice, data_ref)
);

CREATE INDEX idx_indices_economicos_codigo_data ON public.indices_economicos (codigo_indice, data_ref);

GRANT SELECT ON public.indices_economicos TO anon;
GRANT SELECT ON public.indices_economicos TO authenticated;
GRANT ALL ON public.indices_economicos TO service_role;

ALTER TABLE public.indices_economicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read indices" ON public.indices_economicos FOR SELECT USING (true);

CREATE TABLE public.feriados (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data date NOT NULL,
  tipo text NOT NULL,
  uf text,
  codigo_ibge text,
  tribunal text,
  descricao text NOT NULL,
  fonte_normativa text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT feriados_tipo_check CHECK (tipo IN ('nacional','estadual','municipal','forense'))
);

CREATE INDEX idx_feriados_data ON public.feriados (data);
CREATE INDEX idx_feriados_uf_data ON public.feriados (uf, data);
CREATE UNIQUE INDEX idx_feriados_unique ON public.feriados (
  data, tipo, COALESCE(uf,''), COALESCE(codigo_ibge,''), COALESCE(tribunal,'')
);

GRANT SELECT ON public.feriados TO anon;
GRANT SELECT ON public.feriados TO authenticated;
GRANT ALL ON public.feriados TO service_role;

ALTER TABLE public.feriados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read feriados" ON public.feriados FOR SELECT USING (true);