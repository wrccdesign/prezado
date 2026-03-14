

# Adicionar "Copiar Citação" formatada para petição

## O que será feito
Adicionar um botão "Copiar Citação" na página de detalhe da decisão (`DecisaoDetalhe.tsx`) e nos cards de resultado da busca (`Jurisprudencia.tsx`) que copia para a área de transferência a jurisprudência formatada no padrão processual brasileiro (ABNT/forense).

## Formato da citação
```text
BRASIL. Tribunal de Justiça de São Paulo. Apelação Cível nº 1234567-89.2024.8.26.0100. Relator: Des. Fulano de Tal. Julgado em 15/03/2025. Resultado: Provido. Ementa: "texto da ementa..."
```

## Implementação

### 1. Função utilitária `formatCitation(decision)`
- Criar em `src/lib/citation.ts`
- Monta a string no formato forense brasileiro usando os campos: tribunal, tipo_decisao, numero_processo, relator, data_decisao, resultado, ementa

### 2. Botão na página de detalhe (`DecisaoDetalhe.tsx`)
- Adicionar botão "Copiar Citação" (ícone `Copy`/`Check`) ao lado dos metadados, após a linha do número do processo
- Usa `navigator.clipboard.writeText()` + toast de confirmação

### 3. Botão nos cards da busca (`Jurisprudencia.tsx`)
- Adicionar pequeno botão de copiar em cada card de resultado (com `e.preventDefault()` para não navegar ao detalhe)

### Arquivos
- **Criar**: `src/lib/citation.ts`
- **Editar**: `src/pages/DecisaoDetalhe.tsx` (importar função + botão)
- **Editar**: `src/pages/Jurisprudencia.tsx` (botão nos cards)

