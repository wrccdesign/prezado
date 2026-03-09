

# Integrar Prompt de Legislação na Persona JurisAI

## Contexto
A função `search-legislation` é uma API de dados pura (busca normas e retorna JSON). A apresentação formatada da legislação deve acontecer na camada de IA -- especificamente no `chat-juris`, que já é o ponto de contato com o usuário.

## Alteração

### `supabase/functions/chat-juris/index.ts`
Expandir o `JURISAI_SYSTEM_PROMPT` adicionando uma seção dedicada para quando o usuário perguntar sobre legislação. Incluir:

- **Estrutura de apresentação**: Lei Encontrada (nome, número, status vigência, link), Dispositivos Relevantes (artigos explicados), Legislação Relacionada (súmulas, decretos), Aplicação Prática (exemplos)
- **Regras de citação**: nunca citar artigos não verificados, sinalizar possíveis alterações com "Verifique a redação atualizada em planalto.gov.br", informar que a busca cobre apenas legislação federal
- **Formatação com emojis de status**: ✅ Vigente, ⚠️ Parcialmente alterada, ❌ Revogada

Apenas 1 arquivo modificado. A lógica de busca em `search-legislation/index.ts` permanece inalterada.

