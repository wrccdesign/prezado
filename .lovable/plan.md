

# Plano: Padronizar Calculadora de Prazo e Remover Emojis

## Alterações em `src/pages/Calculators.tsx`

1. **Adicionar "Prazo Processual" ao array `mainCalculators`** com os mesmos campos (id, title, icon, desc) — será exibido como card igual aos outros no grid (mudando de `lg:grid-cols-3` para `lg:grid-cols-4` ou mantendo 3 cols com 4 itens).

2. **Remover emojis** de todos os títulos — tanto no array `mainCalculators` (remover campo `emoji`) quanto na view ativa (linha 191).

3. **Remover toda a seção colapsável** do Prazo Processual (linhas 147-179) e o state `prazoExpanded`.

4. **Remover imports não usados**: `ChevronDown`, `ChevronUp`, `Info`.

### Grid layout
Com 4 cards, manter `lg:grid-cols-3` (3+1 na segunda linha) ou usar `lg:grid-cols-4`. Vou manter `lg:grid-cols-4` para ficar tudo na mesma linha.

