# Migração da IA para a API direta do Google + custo e performance

Objetivo: tirar o consumo dos clientes do saldo de créditos do workspace (que hoje pode pausar o app publicado), sair dos modelos Gemini 2.5 que o Google desliga em 16/10/2026, e ganhar visibilidade de custo e performance. Nada de preço, plano, cota, Stripe ou Pix é tocado; prompts e formatos de saída ficam idênticos.

## Secrets que você precisa configurar

- `GEMINI_API_KEY` — chave da Google Generative Language API criada em um projeto do **Google Cloud com faturamento ativo** (nível pago). Não use a chave gratuita do AI Studio: o nível gratuito permite que o Google use o conteúdo enviado para melhorar produtos, e nós processamos petições e documentos de clientes.

Opcionais (têm default no código, só configure se quiser trocar o modelo sem alterar código):
- `GEMINI_MODEL_MAIN`
- `GEMINI_MODEL_LIGHT`

Nenhuma outra secret muda. `LOVABLE_API_KEY` continua existindo apenas para o gateway do Stripe (`_shared/stripe.ts`), que não é IA.

## 1. Camada única de IA (`supabase/functions/_shared/ai.ts`)

Ponto único de chamada, usando a camada compatível com OpenAI do Google:
`https://generativelanguage.googleapis.com/v1beta/openai/chat/completions` — preserva `messages`, `tools`, `tool_choice` e `stream`, então o refactor em cada função é trocar URL, header e nome do modelo.

Conteúdo:
- `callAI({ messages, tools, tool_choice, model: "main" | "light", stream, functionName, userId, environment })`.
- Sem `GEMINI_API_KEY` configurada: erro explícito no log (`GEMINI_API_KEY não configurada`) e falha da função. **Nenhum fallback para `LOVABLE_API_KEY`.**
- Retry com backoff exponencial (3 tentativas) em 429 e 5xx; 4xx não é retentado.
- Timeout por chamada (60s nas não-streaming; streaming não usa timer de corte após o primeiro byte).
- Erros traduzidos em mensagem útil ao usuário, sem vazar corpo do upstream nem a chave.
- Comentário no topo do arquivo registrando a exigência do nível pago e o motivo (confidencialidade dos documentos).
- Grava uma linha em `ai_usage` por chamada, lendo o bloco `usage` da resposta (nas chamadas em streaming, do chunk final com `usage`). Falha de log nunca derruba a chamada.

Escolha dos modelos: antes de fixar os defaults faço uma chamada real de teste com a `GEMINI_API_KEY` para cada candidato da geração 3 (main e light). Se algum retornar 404/modelo inválido, ajusto para o equivalente vigente e informo no chat quais ficaram valendo.

## 2. Funções migradas

Todas as que hoje chamam `ai.gateway.lovable.dev`:

| Função | Uso hoje |
|---|---|
| `analyze-legal-text` | light (keywords) + main (análise) |
| `generate-petition` | light (keywords) + main (petição) |
| `diagnostico-juridico` | main com function calling |
| `chat-juris` | main, streaming |
| `chat-decisao` | main, streaming |
| `search-jurisprudencia` | main |
| `parse-document` | light (OCR fallback) |
| `ingest-datajud` | main (extração de metadados) |

Fora do escopo: `scrape-esaj`, `scrape-tj-proprio`, `scrape-tj-fallback` usam Anthropic com `ANTHROPIC_API_KEY` própria — não passam pelo gateway e não mudam.

Validação: function calling (`diagnostico-juridico`, `analyze-legal-text`, `ingest-datajud`) e streaming (`chat-juris`, `chat-decisao`) são testados de ponta a ponta. Se a camada compatível com OpenAI não reproduzir o comportamento de tools, essas funções específicas passam para o endpoint nativo `generateContent`, mantido dentro do mesmo `_shared/ai.ts`.

## 3. Tabela `ai_usage`

Colunas: `id`, `user_id`, `function_name`, `model`, `input_tokens`, `output_tokens`, `created_at`, `environment`. RLS ligada, leitura e escrita apenas por `service_role` (sem grants para `anon`/`authenticated`). Índice por `created_at` e por `function_name, created_at`. Sem tela agora.

## 4. Cache dos índices econômicos

Em `calcular-atualizacao`, cache em escopo de módulo (sobrevive entre invocações da mesma instância) da série lida de `indices_economicos`, chaveado por `codigo_indice` + intervalo de datas, TTL de 24h. `sync-indices` invalida via um marcador de versão lido do banco, de modo que uma instância antiga não sirva série desatualizada após a sincronização mensal. Só a série do banco é cacheada — nunca o resultado do cálculo do usuário.

## 5. Índices no Postgres

`usage_tracking` hoje só tem a chave primária, e é consultada a cada chamada de IA para a cota mensal:
- `(user_id, created_at DESC)` — consulta de rajada por hora e cota mensal
- `(user_id, action, created_at DESC)` — cota por ação

`decisions` já tem FTS (GIN), HNSW do embedding, `(tribunal, uf)`, `data_decisao`, `comarca`. Faltam, para os filtros que `search_decisions` realmente aplica:
- GIN em `ramos_direito` (filtro por `= ANY`)
- `(instancia)` e `(comarca_pequena)` — índices parciais/compostos conforme seletividade real

Os índices são criados com `CREATE INDEX CONCURRENTLY` quando o ambiente permitir, para não bloquear o cron de ingestão.

## Detalhes técnicos

- Deploy: `_shared/ai.ts` novo; 8 funções editadas; 1 migração (tabela `ai_usage` + índices).
- A migração para `ai_usage` e índices é submetida para sua aprovação antes de rodar.
- Nenhum prompt, schema de tool ou formato de resposta é alterado — as mudanças são invisíveis ao usuário final.
- Ordem de execução: migração → `_shared/ai.ts` → funções → testes reais (tools + streaming) → cache e índices.
