# Jurisprudência: resposta do Bloco A + plano dos blocos B, C e D

## Bloco A — resposta (investigação já feita, antes de qualquer alteração)

Amostrei registros reais com `full_text` longo, de origens diferentes. Resultado:

- **DataJud (6.400 de 6.436 registros, `source = datajud_fallback` / `datajud`)**: o `full_text` NÃO contém ementa nem texto de decisão. É uma listagem de movimentações processuais, no formato:
  `Processo / Tribunal / Grau / Órgão Julgador` seguido de dezenas de linhas `Movimento (data): Distribuição - sorteio: 2`, `Conclusão - para despacho: 5`, `Petição (outras): 57`.
  Os 4.257 caracteres médios são carimbo de andamento, não fundamentação.
- **Scrapers de portal (`scraping_esaj` 12/12 e `scraping_tj_proprio` 18/18)**: esses SIM têm ementa em 100% dos casos, mas o `full_text` é curto (558–1.167 caracteres) e o volume é irrisório.

**Conclusão:** o problema não é o prompt de extração — o texto de origem do DataJud simplesmente não tem ementa. Nenhum ajuste de IA sobre a base atual vai criar ementa onde não há texto decisório. A única fonte de ementa real são os scrapers de portal. Isso confirma a mudança de estratégia e torna o Bloco D obrigatório (não opcional).

Também confirmado no banco: o índice HNSW já existe (`idx_decisions_embedding_cosine`, cosine, m=16, ef_construction=64) — **B3 já está atendido, nada a fazer**. E os três jobs de cron estão ativos: `cron-ingest-phase1` (diário 06:00), `cron-ingest-phase2` (semanal), `sync-indices-daily`.

---

## Bloco B — consertos

**B1. Embeddings em lote na Voyage** (`supabase/functions/_shared/embeddings.ts`)
- Nova função `generateEmbeddings(texts: string[])` que envia até 32 textos por chamada (a API aceita array em `input`).
- Retry com backoff exponencial + jitter em 429 e 5xx, respeitando `Retry-After`; teto de tentativas, sem laço infinito.
- Registro de consumo em `ai_usage` (`function_name`, `model = voyage-law-2`, tokens retornados no campo `usage` da resposta), para a Voyage deixar de ser fatura invisível.
- `generateEmbedding` e `generateQueryEmbedding` passam a ser casos finos por cima da versão em lote — nenhum chamador atual quebra.

**B2. Backfill dos 4.552 sem embedding** (`supabase/functions/backfill-embeddings`)
- Passa a processar em lotes (padrão 32 por chamada, configurável), com a pausa fixa de 22s substituída pelo backoff do B1.
- Retomada natural: continua filtrando `embedding is null`, então cada execução pega o próximo bloco.
- Ao final, informo a contagem processada e a estimativa de custo na Voyage (com base nos tokens registrados em `ai_usage`).

**B3. Índice vetorial** — já existe (HNSW cosine). Sem alteração.

**B4. Bug de contagem** (`supabase/functions/ingest-datajud` e demais scrapers com o mesmo padrão)
- O upsert por `numero_processo` conta atualização como inserção. Correção: usar o retorno do upsert comparando com os números já existentes antes da gravação, contando `inserted` e `updated` separadamente, e deduplicar o lote por `numero_processo` antes de enviar.

---

## Bloco C — pausar acumulação e ir para busca sob demanda

**C1. Pausar a fase 1**
- `cron.unschedule('cron-ingest-phase1')` via migração. Nenhuma decisão, log ou a fase 2 é tocada. Reagendável com um comando quando quisermos.

**C2. Busca sob demanda com cache** (`supabase/functions/search-jurisprudencia`)
- Fluxo: (1) base local FTS + vetorial como hoje; (2) em paralelo, consulta ao DataJud ao vivo para o mesmo termo; (3) grava os novos em `decisions` com `source = 'datajud_live'` e `cached_at`; (4) buscas seguintes pelo mesmo termo respondem só do cache enquanto ele for recente (janela de 7 dias, por termo normalizado).
- Migração: coluna `cached_at timestamptz` em `decisions` e tabela `search_cache` (termo normalizado + filtros, `fetched_at`) para saber se o termo já foi buscado ao vivo recentemente.
- Visitante anônimo (guest) não dispara a consulta ao vivo — só lê a base local, como hoje.

**C3. Latência: IA só em segundo plano**
- A resposta devolve imediatamente o que o DataJud já entrega estruturado (número, classe, assuntos, órgão julgador, tribunal, grau, datas). Zero chamada de IA no caminho da resposta.
- O enriquecimento (resumo, temas, embedding) roda depois via `EdgeRuntime.waitUntil`, atualizando o registro. Se falhar, o registro continua válido com os metadados.

**C4. Teto de custo**
- No máximo 10 resultados novos gravados/enriquecidos por busca. A cota mensal de `search` no `checkRateLimit` continua sendo a trava principal.

---

## Bloco D — honestidade na vitrine

Enquanto 99% da base não tiver ementa (e o Bloco A mostra que ela não virá do DataJud), o texto passa a descrever o que existe:
- `src/pages/Planos.tsx` e `src/pages/LandingPage.tsx`: "Busca de jurisprudência" → **"Consulta processual e de andamentos, com resumo por IA"**, com a ressalva de que ementa e inteiro teor aparecem quando o tribunal de origem os disponibiliza.
- A página `/jurisprudencia` já foi ajustada nessa direção antes (badge "Andamento processual", "Sem teor decisório disponível"); apenas alinho os textos remanescentes.

Se no futuro os scrapers de portal (única fonte com ementa real) passarem a responder por parcela relevante da base, aviso e revisamos o nome.

---

## Não será feito
Nenhuma decisão apagada, nenhum job de cron removido, nenhum registro de `cron_ingest_log` tocado. Pagamentos, cotas, calculadoras e autenticação intocados.

## Ordem de execução
1. Migração: `cron.unschedule` da fase 1 + `cached_at` + `search_cache` (C1/C2)
2. B1 e B4 (código)
3. B2 backfill em blocos, com relatório de custo
4. C2/C3/C4 na `search-jurisprudencia`
5. D — textos
