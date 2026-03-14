

# Ingestão de Dados via API Pública do DataJud (CNJ)

## Visão geral
Criar uma edge function `ingest-datajud` que consulta a API pública do DataJud, usa IA para extrair metadados estruturados do texto da decisão, e salva na tabela `decisions`.

## API do DataJud
- Base URL: `https://api-publica.datajud.cnj.jus.br`
- Endpoints por tribunal (ex: `/api_publica_tst/_search`, `/api_publica_tjsp/_search`)
- Usa ElasticSearch query format (POST com JSON body)
- API pública, sem autenticação necessária, mas requer header `Authorization: APIKey cDZHYzlZa0JadVREZDR4N3ZSaTdlQV9ZYVFxdkFvOXlmVkR3LTFpbFJRZkl1alhNd2Fia1REVW5KN0VkUVFMWE1jZ0trQ2dEMHlhcWRCRjVpR3RDOGliSHlsTXBoanExY19kUzZiZlFZMEhSZURMcGNJLUZiQ2RIYl9ORWtGOElQYnN4S2N6YVR6bEdMZWxSUmVfU2lB`
- Chave pública documentada pelo CNJ

## Implementação

### 1. Edge Function `ingest-datajud`
**Arquivo:** `supabase/functions/ingest-datajud/index.ts`

- Aceita parâmetros: `tribunal` (sigla, ex: "tjsp"), `query` (termo de busca), `size` (quantidade, default 10)
- Consulta a API do DataJud com query ElasticSearch
- Para cada decisão retornada:
  1. Verifica se já existe pelo `external_id` (evita duplicatas)
  2. Chama Lovable AI (Gemini) com o Prompt de Extração de Metadados para estruturar os campos
  3. Insere na tabela `decisions` com `source: 'datajud'`

### 2. Prompt de Extração de Metadados (Prompt 1 do spec)
System prompt que recebe o texto bruto e retorna JSON com:
- tribunal, comarca, comarca_pequena, data_decisao, relator
- temas_juridicos, argumentos_principais, resultado, resumo_ia
- ramos_direito, legislacao_citada, tipo_decisao, numero_processo, ementa

Usa tool calling para extração estruturada confiável.

### 3. Registro no config.toml
Adicionar `[functions.ingest-datajud]` com `verify_jwt = false`

### 4. Endpoint de trigger (admin/manual)
A function pode ser chamada manualmente via fetch ou futuramente agendada via cron. Não cria UI neste momento — foco na infraestrutura.

## Arquivos
- **Criar**: `supabase/functions/ingest-datajud/index.ts`
- **Editar**: `supabase/config.toml` (registrar function)

## Detalhes técnicos

```text
Fluxo:
  POST /ingest-datajud { tribunal: "tjsp", query: "dano moral", size: 5 }
    │
    ▼
  Consulta DataJud API (ElasticSearch)
    │
    ▼
  Para cada hit:
    ├─ Verifica external_id (skip se já existe)
    ├─ Envia texto para Lovable AI (tool calling → JSON estruturado)
    └─ INSERT na tabela decisions
    │
    ▼
  Retorna { ingested: N, skipped: M, errors: [] }
```

