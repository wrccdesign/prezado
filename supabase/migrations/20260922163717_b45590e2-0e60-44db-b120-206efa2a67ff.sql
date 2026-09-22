-- Índices econômicos: somente o sistema
DROP POLICY IF EXISTS "Anyone can read indices" ON public.indices_economicos;
REVOKE ALL ON public.indices_economicos FROM anon, authenticated;
GRANT ALL ON public.indices_economicos TO service_role;

-- Custas: somente o sistema
DROP POLICY IF EXISTS "Anyone can read custas_regras" ON public.custas_regras;
REVOKE ALL ON public.custas_regras FROM anon, authenticated;
GRANT ALL ON public.custas_regras TO service_role;

-- Unidades fiscais: somente o sistema
DROP POLICY IF EXISTS "Anyone can read unidades_fiscais" ON public.unidades_fiscais;
REVOKE ALL ON public.unidades_fiscais FROM anon, authenticated;
GRANT ALL ON public.unidades_fiscais TO service_role;

-- Configuração de tribunais: somente o sistema; o site usa list_tribunais()
DROP POLICY IF EXISTS "Public can read active court metadata" ON public.tj_scraping_config;
REVOKE ALL ON public.tj_scraping_config FROM anon, authenticated;
GRANT ALL ON public.tj_scraping_config TO service_role;

CREATE OR REPLACE FUNCTION public.list_tribunais()
RETURNS TABLE(tribunal text, nome_completo text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.tribunal, t.nome_completo
  FROM public.tj_scraping_config t
  ORDER BY t.tribunal
$$;
REVOKE ALL ON FUNCTION public.list_tribunais() FROM public;
GRANT EXECUTE ON FUNCTION public.list_tribunais() TO anon, authenticated, service_role;

-- Feriados: público só no que as calculadoras usam
DROP POLICY IF EXISTS "Anyone can read feriados" ON public.feriados;
CREATE POLICY "Feriados forenses sao publicos"
ON public.feriados
FOR SELECT
TO anon, authenticated
USING (tipo = 'forense');

-- Decisões: público só em registros completos
DROP POLICY IF EXISTS "Anyone can read decisions" ON public.decisions;
CREATE POLICY "Decisoes publicaveis sao legiveis"
ON public.decisions
FOR SELECT
TO anon, authenticated
USING (
  numero_processo IS NOT NULL
  AND numero_processo NOT LIKE '%<UNKNOWN>%'
  AND (
    (ementa IS NOT NULL AND length(ementa) >= 50)
    OR (resumo_ia IS NOT NULL AND length(resumo_ia) >= 30)
  )
);

-- Súmulas: público só nas vigentes
DROP POLICY IF EXISTS "Súmulas são públicas para leitura" ON public.sumulas;
CREATE POLICY "Sumulas vigentes sao publicas"
ON public.sumulas
FOR SELECT
TO anon, authenticated
USING (situacao = 'vigente');