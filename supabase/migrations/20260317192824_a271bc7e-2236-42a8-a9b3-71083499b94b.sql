
-- Create tj_scraping_config table
CREATE TABLE public.tj_scraping_config (
  tribunal TEXT PRIMARY KEY,
  nome_completo TEXT NOT NULL,
  portal_url TEXT,
  sistema TEXT NOT NULL DEFAULT 'proprio',
  scraping_frequency TEXT DEFAULT 'weekly',
  last_scraped_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tj_scraping_config ENABLE ROW LEVEL SECURITY;

-- Public SELECT only
CREATE POLICY "Anyone can read tj_scraping_config"
ON public.tj_scraping_config
FOR SELECT
USING (true);

-- Seed all 27 TJs
INSERT INTO public.tj_scraping_config (tribunal, nome_completo, portal_url, sistema, priority) VALUES
  ('TJSP', 'Tribunal de Justiça de São Paulo', 'https://esaj.tjsp.jus.br', 'esaj', 10),
  ('TJCE', 'Tribunal de Justiça do Ceará', 'https://esaj.tjce.jus.br', 'esaj', 8),
  ('TJAM', 'Tribunal de Justiça do Amazonas', 'https://consultasaj.tjam.jus.br', 'esaj', 6),
  ('TJMS', 'Tribunal de Justiça do Mato Grosso do Sul', 'https://esaj.tjms.jus.br', 'esaj', 7),
  ('TJRN', 'Tribunal de Justiça do Rio Grande do Norte', 'https://esaj.tjrn.jus.br', 'esaj', 5),
  ('TJGO', 'Tribunal de Justiça de Goiás', 'https://projudi.tjgo.jus.br', 'pje', 4),
  ('TJRJ', 'Tribunal de Justiça do Rio de Janeiro', 'https://www3.tjrj.jus.br', 'proprio', 9),
  ('TJMG', 'Tribunal de Justiça de Minas Gerais', 'https://www5.tjmg.jus.br', 'proprio', 8),
  ('TJRS', 'Tribunal de Justiça do Rio Grande do Sul', 'https://www.tjrs.jus.br', 'proprio', 7),
  ('TJPR', 'Tribunal de Justiça do Paraná', 'https://portal.tjpr.jus.br', 'proprio', 7),
  ('TJSC', 'Tribunal de Justiça de Santa Catarina', 'https://busca.tjsc.jus.br', 'proprio', 6),
  ('TJBA', 'Tribunal de Justiça da Bahia', 'https://esaj.tjba.jus.br', 'proprio', 6),
  ('TJPE', 'Tribunal de Justiça de Pernambuco', 'https://www.tjpe.jus.br', 'proprio', 5),
  ('TJPA', 'Tribunal de Justiça do Pará', 'https://consultas.tjpa.jus.br', 'proprio', 4),
  ('TJMA', 'Tribunal de Justiça do Maranhão', 'https://jurisconsult.tjma.jus.br', 'proprio', 4),
  ('TJDF', 'Tribunal de Justiça do Distrito Federal', 'https://pesquisajuris.tjdft.jus.br', 'proprio', 7),
  ('TJES', 'Tribunal de Justiça do Espírito Santo', 'https://sistemas.tjes.jus.br', 'proprio', 4),
  ('TJMT', 'Tribunal de Justiça do Mato Grosso', 'https://jurisprudencia.tjmt.jus.br', 'proprio', 4),
  ('TJAL', 'Tribunal de Justiça de Alagoas', 'https://www2.tjal.jus.br', 'proprio', 3),
  ('TJSE', 'Tribunal de Justiça de Sergipe', 'https://www.tjse.jus.br', 'proprio', 3),
  ('TJPB', 'Tribunal de Justiça da Paraíba', 'https://jurisprudencia.tjpb.jus.br', 'proprio', 3),
  ('TJPI', 'Tribunal de Justiça do Piauí', 'https://www.tjpi.jus.br', 'proprio', 3),
  ('TJRO', 'Tribunal de Justiça de Rondônia', 'https://www.tjro.jus.br', 'proprio', 2),
  ('TJAC', 'Tribunal de Justiça do Acre', 'https://esaj.tjac.jus.br', 'proprio', 2),
  ('TJAP', 'Tribunal de Justiça do Amapá', 'https://tucujuris.tjap.jus.br', 'proprio', 2),
  ('TJRR', 'Tribunal de Justiça de Roraima', 'https://www.tjrr.jus.br', 'proprio', 2),
  ('TJTO', 'Tribunal de Justiça do Tocantins', 'https://www.tjto.jus.br', 'proprio', 2);
