

# Implementar Persona JurisAI

## Resumo
Aplicar as diretrizes completas do JurisAI nos system prompts das Edge Functions e renomear a marca na UI. Também criar uma nova Edge Function de chat jurídico geral com streaming.

## Alterações

### 1. Atualizar system prompt em `analyze-legal-text/index.ts`
Substituir o prompt genérico (linhas 198-213) pelo prompt completo do JurisAI com todas as regras: fontes obrigatórias, formato de citação (nome da lei + numero + ano + artigo), proibição de inventar dispositivos, aviso legal, e priorização do contexto RAG.

### 2. Atualizar system prompt em `generate-petition/index.ts`
Substituir o prompt (linhas 203-218) para incluir as diretrizes JurisAI: citações precisas, uso de linguagem técnico-jurídica, fundamentação baseada nas fontes listadas, e o disclaimer ao final da petição.

### 3. Renomear marca na UI
- `AppHeader.tsx`: "Assistente Juridico" -> "JurisAI"
- `Index.tsx`: Atualizar titulos e descrições
- `Petition.tsx`: Atualizar titulos
- `Auth.tsx`: Atualizar branding se presente

### 4. Nova Edge Function: `chat-juris/index.ts`
Chat jurídico geral com streaming SSE. Usa o prompt completo do JurisAI como system message. Extrai keywords do input, busca legislação relacionada, e injeta como contexto RAG antes de chamar o modelo com streaming habilitado.

### 5. Nova página: `src/pages/Chat.tsx`
Interface de chat com:
- Lista de mensagens (user/assistant) com renderização markdown (`react-markdown` ja esta no projeto ou usaremos prose styles)
- Input de texto + botao enviar
- Streaming token-by-token
- Toggle "Sou advogado(a)" para adaptar o tom

### 6. Atualizar rotas e navegação
- `App.tsx`: Adicionar rota `/chat`
- `AppHeader.tsx`: Adicionar botão "Chat" na navegação
- `supabase/config.toml`: Registrar `chat-juris` function

### Arquivos criados/modificados
| Arquivo | Ação |
|---------|------|
| `supabase/functions/chat-juris/index.ts` | Criar |
| `src/pages/Chat.tsx` | Criar |
| `supabase/functions/analyze-legal-text/index.ts` | Modificar prompt |
| `supabase/functions/generate-petition/index.ts` | Modificar prompt |
| `src/components/AppHeader.tsx` | Renomear + nav |
| `src/pages/Index.tsx` | Branding |
| `src/App.tsx` | Rota /chat |

