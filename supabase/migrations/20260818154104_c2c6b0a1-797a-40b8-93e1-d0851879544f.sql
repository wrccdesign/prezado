with anos as (select generate_series(2024, 2028) as y),
est(uf, md, descricao) as (values
  ('AC','06-15','Aniversário do Acre'),
  ('AC','09-05','Dia da Amazônia'),
  ('AC','10-23','Dia do Evangélico'),
  ('AC','11-17','Assinatura do Tratado de Petrópolis'),
  ('AL','09-16','Emancipação política de Alagoas'),
  ('AL','06-24','São João'),
  ('AL','06-29','São Pedro'),
  ('AM','09-05','Elevação do Amazonas à categoria de província'),
  ('AP','09-13','Criação do Território Federal do Amapá'),
  ('AP','03-19','São José'),
  ('CE','03-25','Data Magna do Ceará'),
  ('CE','03-19','São José'),
  ('MA','07-28','Adesão do Maranhão à Independência do Brasil'),
  ('MS','10-11','Criação do Estado de Mato Grosso do Sul'),
  ('PA','08-15','Adesão do Pará à Independência do Brasil'),
  ('PB','08-05','Fundação do Estado da Paraíba'),
  ('PE','03-06','Revolução Pernambucana de 1817'),
  ('PE','06-24','São João'),
  ('PI','10-19','Dia do Piauí'),
  ('RN','10-03','Mártires de Cunhaú e Uruaçu'),
  ('RO','01-04','Criação do Estado de Rondônia'),
  ('RO','06-18','Dia do Evangélico'),
  ('RR','10-05','Criação do Estado de Roraima'),
  ('SC','08-11','Criação da Capitania de Santa Catarina'),
  ('SE','07-08','Emancipação política de Sergipe'),
  ('TO','10-05','Criação do Estado do Tocantins')
),
trf(tribunal) as (values ('TRF1'),('TRF2'),('TRF3'),('TRF4'),('TRF5'),('TRF6')),
tj(tribunal) as (values ('TJSP'),('TJRJ'),('TJMG')),
tj_dias(md, descricao) as (values
  ('08-11','Dia do Advogado — sem expediente forense'),
  ('10-28','Dia do Servidor Público — sem expediente forense'),
  ('11-01','Dia de Todos os Santos — sem expediente forense'),
  ('12-08','Dia da Justiça — sem expediente forense')
),
novos as (
  select
    make_date(y, split_part(md,'-',1)::int, split_part(md,'-',2)::int) as data,
    'estadual'::text as tipo,
    uf::text as uf,
    null::text as tribunal,
    descricao::text as descricao,
    ('Legislação estadual do ' || uf || ' — conferir calendário oficial do estado')::text as fonte_normativa
  from est cross join anos
  union all
  select
    d::date as data,
    'forense'::text,
    null::text,
    trf.tribunal::text,
    'Suspensão dos prazos na Justiça Federal (recesso de 20/12 a 06/01)'::text,
    'Lei 5.010/1966, art. 62, II, com redação da Lei 13.545/2017'::text
  from trf
  cross join anos
  cross join lateral generate_series(make_date(y,12,20), make_date(y,12,31), interval '1 day') as d
  union all
  select
    d::date,
    'forense'::text,
    null::text,
    trf.tribunal::text,
    'Suspensão dos prazos na Justiça Federal (recesso de 20/12 a 06/01)'::text,
    'Lei 5.010/1966, art. 62, II, com redação da Lei 13.545/2017'::text
  from trf
  cross join (select generate_series(2024, 2029) as y) as ay
  cross join lateral generate_series(make_date(ay.y,1,1), make_date(ay.y,1,6), interval '1 day') as d
  union all
  select
    make_date(y, split_part(md,'-',1)::int, split_part(md,'-',2)::int),
    'forense'::text,
    null::text,
    tj.tribunal::text,
    descricao::text,
    ('Provimento/Portaria de expediente forense do ' || tj.tribunal || ' — conferir calendário oficial')::text
  from tj cross join tj_dias cross join anos
)
insert into public.feriados (data, tipo, uf, codigo_ibge, tribunal, descricao, fonte_normativa)
select n.data, n.tipo, n.uf, null, n.tribunal, n.descricao, n.fonte_normativa
from novos n
where not exists (
  select 1 from public.feriados f
  where f.data = n.data
    and f.tipo = n.tipo
    and coalesce(f.uf, '') = coalesce(n.uf, '')
    and coalesce(f.tribunal, '') = coalesce(n.tribunal, '')
    and f.descricao = n.descricao
);