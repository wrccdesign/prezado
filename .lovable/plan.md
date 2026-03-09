

# Histórico Unificado: Análises + Petições

## Implementação

### Interface com Abas
Usar `Tabs` do Radix para separar "Análises" e "Petições" na página de histórico.

### Alterações em `src/pages/History.tsx`
1. Adicionar estado para petições (`petitions`, `selectedPetition`)
2. Buscar petições da tabela `petitions` junto com análises
3. Criar duas abas: "Análises" e "Petições"
4. Aba de Análises: manter lista atual
5. Aba de Petições: listar petições com tipo, resumo dos dados e data
6. Visualização de petição: exibir usando `PetitionResult` existente
7. Adicionar função de deletar petição

### Estrutura Visual
- Cada petição mostra: tipo (badge), partes envolvidas, data de criação
- Clicar abre visualização com texto gerado e opções de edição/download

### Tipo TypeScript
Criar interface `PetitionRecord` para tipar os dados das petições.

