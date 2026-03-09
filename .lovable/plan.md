

# Calculadora de Pensão Alimentícia — Implementação Completa

## Abordagem

Extrair a `PensaoCalc` para `src/components/calculators/PensaoCalc.tsx` (mesmo padrão da `RescisaoCalc`) e substituir a versão inline em `Calculators.tsx` por um import.

## Novo arquivo: `src/components/calculators/PensaoCalc.tsx`

### Campos de entrada
- Renda líquida do alimentante (R$) — Input number
- Número de filhos — Input number (min 1)
- Filhos moram com alimentante? — Select: "Não" / "Sim" / "Parcialmente (guarda compartilhada)"
- Outras obrigações alimentares? — Switch (sim/não)
- Padrão de vida da família — Select: "Baixa renda" / "Médio" / "Alto padrão"

### Lógica de cálculo (diretrizes STJ)
- **Base percentual por filho**: ~15-20% para 1 filho, ~25-30% para 2, ~33% para 3+, cap em ~50%
- **Ajustes**:
  - Guarda compartilhada (mora parcialmente): reduz ~20-30% do valor
  - Mora com alimentante: reduz ~40%
  - Outras obrigações: reduz ~10-15%
  - Alto padrão: tendência ao teto da faixa; Baixa renda: tendência ao piso
- Resultado: faixa **mínima**, **sugerida** e **máxima** para cada cenário

### Resultado
- Card em destaque com valor sugerido (grande, bold, cor primária)
- Faixa de negociação: mínimo — máximo
- Valor por filho
- Texto explicativo sobre art. 1.694 CC e critérios do juiz (necessidade × possibilidade)
- Aviso amarelo com AlertTriangle: "Este é um valor de referência..."
- Botão "Gerar Relatório PDF" com jsPDF (mesmo padrão da RescisaoCalc)

## Alteração: `src/pages/Calculators.tsx`
- Remover `PensaoCalc` inline
- Importar de `@/components/calculators/PensaoCalc`

