

# Página de Detalhe da Decisão com Chat Assistente

## Visão geral
Criar a página `/decisao/:id` que exibe o texto completo de uma decisão judicial e inclui um chat assistente lateral (Prompt 3 do spec) para que o advogado converse sobre a decisão.

## Componentes

### 1. Edge Function `chat-decisao`
- Recebe `messages` + `decisionId`
- Busca a decisão no banco para injetar como contexto no system prompt
- Usa o Prompt 3 do spec (assistente jurídico com capacidades de explicação, análise, redação para petição, etc.)
- Streaming via SSE com Lovable AI (`google/gemini-3-flash-preview`)

### 2. Página `src/pages/DecisaoDetalhe.tsx`
- Layout split: coluna esquerda (decisão) + coluna direita (chat)
- **Coluna esquerda**: metadados completos (tribunal, comarca, relator, data, resultado, temas, legislação citada), ementa, resumo IA, texto completo
- **Coluna direita**: chat assistente com streaming, sugestões rápidas ("Explique esta decisão", "Redija parágrafo para petição", "Compare com meu caso")
- Mobile: chat em drawer/sheet no rodapé

### 3. Rota e navegação
- Adicionar rota `/decisao/:id` no `App.tsx` (pública)
- Na página de Jurisprudência, tornar os cards clicáveis com link para `/decisao/:id`

### 4. Config
- Adicionar `[functions.chat-decisao]` e `[functions.search-jurisprudencia]` ao `config.toml`

## Arquivos
- **Criar**: `supabase/functions/chat-decisao/index.ts`
- **Criar**: `src/pages/DecisaoDetalhe.tsx`
- **Editar**: `src/App.tsx` (nova rota)
- **Editar**: `src/pages/Jurisprudencia.tsx` (links nos cards)
- **Editar**: `supabase/config.toml` (registrar functions)

