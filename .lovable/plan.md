

# Atualizar Prompt de Geração de Petições

## Resumo
Substituir o `systemPrompt` atual na Edge Function `generate-petition/index.ts` (linhas 203-228) pelo novo prompt completo com estrutura rigorosa de 5 blocos (Cabeçalho, Fatos, Direito, Pedidos, Fecho), integração explícita de RAG, e aviso legal atualizado.

## Alteração

### `supabase/functions/generate-petition/index.ts` (linhas 203-228)
Substituir o systemPrompt por:
- **Estrutura obrigatória em 5 blocos**: Cabeçalho (endereçamento + qualificação), Dos Fatos (cronológico), Do Direito (fundamentação com RAG), Dos Pedidos (numerados + tutela de urgência + valor da causa), Fecho (local, data, assinatura/OAB)
- **Instruções de RAG**: integrar legislação do contexto naturalmente na fundamentação, citando "nos termos do art. X da Lei nº Y/ANO..."
- **Qualidade**: linguagem formal, sem redundâncias, argumentação progressiva, pedidos coerentes
- **Aviso legal atualizado**: disclaimer com separador e texto sobre revisão por advogado OAB
- Manter regras absolutas (não inventar artigos/leis) e a injeção de `${legislationContext}`

Apenas 1 arquivo modificado.

