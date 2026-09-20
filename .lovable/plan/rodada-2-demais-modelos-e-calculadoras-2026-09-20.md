# Rodada 2: demais modelos e calculadoras

Os três modelos prioritários já ganharam texto completo e perguntas frequentes no HTML. Agora o mesmo tratamento para o restante.

## Rodada 2 — os cinco modelos que faltam

Petição inicial de cobrança, contestação cível, recurso de apelação, contrato de honorários e acordo extrajudicial hoje têm só um parágrafo curto no HTML. Cada um passa a ter:

- o que é e quando usar, em texto corrido
- base legal citada (artigo e o que determina)
- passo a passo de preenchimento
- quatro a seis perguntas frequentes com resposta completa
- data real de atualização no mapa do site

## Rodada 3 — as sete calculadoras

Correção monetária, prazo processual, custas do TJSP, rescisão, pensão, operações com datas e validador de CPF e CNPJ recebem o mesmo tratamento: explicação da regra, fonte oficial do índice, passo a passo e perguntas frequentes visíveis no HTML, mais data de atualização no mapa do site.

## Depois

Reenvio o mapa do site no Search Console e acompanho quantas páginas saem da fila.

## Detalhes técnicos

- `src/seo/routeContent.ts`: ampliar as entradas das cinco minutas e das sete calculadoras no mesmo formato já usado nas três páginas prontas (heading, intro, bullets, faq).
- `src/pages/MinutaDetalhe.tsx` e `src/components/calculators/CalculatorLanding.tsx` já renderizam o bloco de perguntas e os links internos; nenhuma mudança estrutural prevista.
- `public/sitemap.xml`: `lastmod` por rota, com a data real da alteração de conteúdo, nunca a data do build.
- Sem mudanças em banco, pagamentos, autenticação, cores ou tipografia.

## Ordem

Rodada 2 (cinco modelos) agora; rodada 3 (calculadoras) em seguida, em um único lote.
