INSERT INTO public.unidades_fiscais (codigo, ano, valor, fonte_normativa, vigencia_inicio) VALUES
  ('UFESP', 2015, 21.25, 'Comunicado DA SEFAZ-SP — valor da UFESP para 2015', '2015-01-01'),
  ('UFESP', 2016, 23.55, 'Comunicado DA SEFAZ-SP — valor da UFESP para 2016', '2016-01-01'),
  ('UFESP', 2017, 25.07, 'Comunicado DA SEFAZ-SP — valor da UFESP para 2017', '2017-01-01'),
  ('UFESP', 2018, 25.70, 'Comunicado DA SEFAZ-SP — valor da UFESP para 2018', '2018-01-01'),
  ('UFESP', 2019, 26.53, 'Comunicado DA SEFAZ-SP — valor da UFESP para 2019', '2019-01-01'),
  ('UFESP', 2020, 27.61, 'Comunicado DA SEFAZ-SP — valor da UFESP para 2020', '2020-01-01'),
  ('UFESP', 2021, 29.09, 'Comunicado DA SEFAZ-SP — valor da UFESP para 2021', '2021-01-01'),
  ('UFESP', 2022, 31.97, 'Comunicado DA SEFAZ-SP — valor da UFESP para 2022', '2022-01-01'),
  ('UFESP', 2023, 34.26, 'Comunicado DA SEFAZ-SP — valor da UFESP para 2023', '2023-01-01')
ON CONFLICT (codigo, ano) DO NOTHING;

CREATE TABLE public.calculos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  tipo text NOT NULL,
  titulo text NOT NULL,
  inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  resultado jsonb NOT NULL DEFAULT '{}'::jsonb,
  environment text NOT NULL DEFAULT 'live',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.calculos TO authenticated;
GRANT ALL ON public.calculos TO service_role;

ALTER TABLE public.calculos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own calculos" ON public.calculos FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own calculos" ON public.calculos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own calculos" ON public.calculos FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own calculos" ON public.calculos FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_calculos_user_created ON public.calculos (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_calculos_updated_at
BEFORE UPDATE ON public.calculos
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();