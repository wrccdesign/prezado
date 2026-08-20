CREATE TABLE public.unidades_fiscais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL,
  ano INTEGER NOT NULL,
  valor NUMERIC(12,4) NOT NULL,
  fonte_normativa TEXT,
  vigencia_inicio DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (codigo, ano)
);

GRANT SELECT ON public.unidades_fiscais TO anon;
GRANT SELECT ON public.unidades_fiscais TO authenticated;
GRANT ALL ON public.unidades_fiscais TO service_role;

ALTER TABLE public.unidades_fiscais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read unidades_fiscais" ON public.unidades_fiscais FOR SELECT USING (true);
CREATE POLICY "Service role manages unidades_fiscais" ON public.unidades_fiscais FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE public.custas_regras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tribunal TEXT NOT NULL,
  uf TEXT NOT NULL,
  tipo_ato TEXT NOT NULL,
  base_calculo TEXT NOT NULL,
  aliquota NUMERIC(8,4),
  valor_fixo_qtd NUMERIC(12,4),
  unidade_fiscal TEXT NOT NULL,
  piso_qtd NUMERIC(12,4),
  teto_qtd NUMERIC(12,4),
  tipo_guia TEXT NOT NULL,
  codigo_receita TEXT,
  url_emissao TEXT,
  vigencia_inicio DATE NOT NULL,
  vigencia_fim DATE,
  fonte_normativa TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_custas_regras_lookup ON public.custas_regras (tribunal, tipo_ato, vigencia_inicio DESC);

GRANT SELECT ON public.custas_regras TO anon;
GRANT SELECT ON public.custas_regras TO authenticated;
GRANT ALL ON public.custas_regras TO service_role;

ALTER TABLE public.custas_regras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read custas_regras" ON public.custas_regras FOR SELECT USING (true);
CREATE POLICY "Service role manages custas_regras" ON public.custas_regras FOR ALL TO service_role USING (true) WITH CHECK (true);

INSERT INTO public.unidades_fiscais (codigo, ano, valor, fonte_normativa, vigencia_inicio) VALUES
  ('UFESP', 2024, 35.3600, 'Decreto anual do Governador do Estado de São Paulo / Secretaria da Fazenda de SP', '2024-01-01'),
  ('UFESP', 2025, 37.0200, 'Decreto anual do Governador do Estado de São Paulo / Secretaria da Fazenda de SP', '2025-01-01'),
  ('UFESP', 2026, 38.4200, 'Decreto anual do Governador do Estado de São Paulo / Secretaria da Fazenda de SP', '2026-01-01');

INSERT INTO public.custas_regras
  (tribunal, uf, tipo_ato, base_calculo, aliquota, valor_fixo_qtd, unidade_fiscal, piso_qtd, teto_qtd, tipo_guia, codigo_receita, url_emissao, vigencia_inicio, vigencia_fim, fonte_normativa, observacoes)
VALUES
  ('TJSP','SP','distribuicao_acao','valor_causa',1.0,NULL,'UFESP',5,3000,'DARE','230-6','https://portaldecustas.tjsp.jus.br/portaltjsp','2004-01-01','2024-01-02','Lei Estadual 11.608/2003, art. 4º, I','Regime anterior à Lei Estadual 17.785/2023.'),
  ('TJSP','SP','distribuicao_acao','valor_causa',1.5,NULL,'UFESP',5,3000,'DARE','230-6','https://portaldecustas.tjsp.jus.br/portaltjsp','2024-01-03',NULL,'Lei Estadual 11.608/2003, art. 4º, I, com redação da Lei Estadual 17.785/2023','Taxa judiciária inicial.'),
  ('TJSP','SP','execucao_titulo_extrajudicial','valor_causa',2.0,NULL,'UFESP',5,3000,'DARE','230-6','https://portaldecustas.tjsp.jus.br/portaltjsp','2024-01-03',NULL,'Lei Estadual 11.608/2003, com redação da Lei Estadual 17.785/2023','Execução fundada em título executivo extrajudicial.'),
  ('TJSP','SP','cumprimento_sentenca','valor_credito',2.0,NULL,'UFESP',5,3000,'DARE','230-6','https://portaldecustas.tjsp.jus.br/portaltjsp','2024-01-03',NULL,'Lei Estadual 11.608/2003, com redação da Lei Estadual 17.785/2023','Incide sobre o valor do crédito a satisfazer.'),
  ('TJSP','SP','preparo_apelacao','valor_condenacao',4.0,NULL,'UFESP',5,3000,'DARE','230-6','https://portaldecustas.tjsp.jus.br/portaltjsp','2024-01-03',NULL,'Lei Estadual 11.608/2003, art. 4º, II, com redação da Lei Estadual 17.785/2023','4% sobre o valor da condenação, se líquida; na ausência de pedido condenatório, sobre o valor da causa atualizado.'),
  ('TJSP','SP','agravo_instrumento','fixo',NULL,10,'UFESP',NULL,NULL,'DARE','230-6','https://portaldecustas.tjsp.jus.br/portaltjsp','2004-01-01','2024-01-02','Lei Estadual 11.608/2003','Valor fixo no regime anterior.'),
  ('TJSP','SP','agravo_instrumento','fixo',NULL,15,'UFESP',NULL,NULL,'DARE','230-6','https://portaldecustas.tjsp.jus.br/portaltjsp','2024-01-03',NULL,'Lei Estadual 11.608/2003, com redação da Lei Estadual 17.785/2023','Valor fixo de 15 UFESPs.');