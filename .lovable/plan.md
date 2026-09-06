# Parte B: acervo de súmulas e busca unificada

## Sobre a "carga inicial curada"

Súmulas não vêm de nenhuma fonte automática que já usamos hoje (o CNJ/DataJud entrega processos, não súmulas). Então o conteúdo entra escrito por mim, conferido enunciado por enunciado contra o texto oficial do tribunal, com o link da fonte gravado em cada linha.

O que entra agora:

- Súmulas Vinculantes do STF (série completa, é curta e fechada)
- Súmulas do STJ mais citadas nas áreas que o site atende (consumidor, civil, processual, previdenciário)
- Súmulas do TST mais citadas em matéria trabalhista

O que precisa de manutenção depois: tribunais editam, revisam e cancelam enunciados, e novos são aprovados algumas vezes por ano. Por isso cada linha guarda situação (vigente, cancelada, revisada), data e fonte. Quando um enunciado muda, é uma correção pontual naquela linha, não um retrabalho. Ampliar a cobertura para outras áreas também é acréscimo de linhas, no mesmo formato.

Nada é inventado: se um enunciado não puder ser conferido no site do tribunal, ele não entra.

## O que será feito

1. Nova tabela `sumulas` no banco: tribunal, tipo (comum ou vinculante), número, enunciado, situação, data de aprovação, área do direito, link da fonte oficial, mais o texto de busca e o vetor semântico. Leitura liberada para todos (é conteúdo público); gravação apenas por rotinas internas, igual ao acervo de decisões.
2. Carga inicial curada, conforme descrito acima.
3. Busca unificada: a consulta de jurisprudência passa a devolver também as súmulas que combinam com o termo, marcadas como súmula e separadas visualmente das decisões. Mesmas regras já em vigor no acervo de decisões: quem não tem conta continua com prévia limitada, e o texto de metadados continua sinalizado como resumo, nunca como texto oficial.
4. A verificação de citações deixa de marcar súmula como "não verificável": passa a conferir número e tribunal contra a nova tabela. Enunciado ausente do acervo continua com a formulação atual, "não localizado no nosso acervo", nunca "inexistente".
5. A IA (diagnóstico, petição, chat) passa a receber as súmulas relevantes junto do contexto de decisões, com a regra de citar apenas o que está no contexto.

## Detalhes técnicos

- Migração: tabela `public.sumulas` com `id`, `tribunal`, `tipo`, `numero`, `enunciado`, `situacao`, `data_aprovacao`, `area`, `source_url`, `embedding vector(1024)`, `created_at/updated_at` + trigger; unicidade em (`tribunal`, `tipo`, `numero`); GRANT `select` para `anon`/`authenticated`, `all` para `service_role`; RLS com leitura pública e escrita só por `service_role`; índice GIN de full-text português sobre o enunciado e índice HNSW cosine no embedding.
- Novo RPC `search_sumulas(search_query, filter_tribunal, filter_area, result_limit)` — FTS português, só `situacao = 'vigente'` por padrão. `search_decisions` e `search_decisions_vector` ficam intactos (misturar tipos diferentes na mesma função quebraria a assinatura e os chamadores atuais).
- `search-jurisprudencia`: chama `search_sumulas` em paralelo ao FTS/vetorial e devolve `sumulas: [...]` ao lado de `results`, com `search_modes.sumulas`. Convidado recebe no máximo 2 súmulas.
- `Jurisprudencia.tsx`: bloco "Súmulas" acima da lista de decisões, sem card, seguindo o padrão visual atual (fundo creme, sem ícone, sem animação).
- `citation-check.ts`: `verifyCitations` passa a extrair tribunal + número do texto da súmula e conferir na tabela; status `verificado` / `nao_encontrado`. Testes novos no arquivo existente.
- `grounding.ts`: `fetchGroundingContext` ganha as súmulas relevantes e `buildGroundingBlock` um bloco "SÚMULAS DISPONÍVEIS", com a mesma regra de citação restrita ao contexto.
- Embeddings das súmulas gerados no mesmo pipeline em lote já usado nas decisões.

## Fora de escopo

Coleta automática de súmulas, cobertura completa de todos os tribunais, e qualquer alteração em pagamentos, cotas ou calculadoras.
