

# Reformular Calculadora de Rescisão Trabalhista

## Resumo
Substituir o `RescisaoCalc` atual por uma versão completa com todos os campos solicitados, cálculos detalhados conforme CLT, tabela discriminada de resultados, e botão para gerar PDF.

## Alterações em `src/pages/Calculators.tsx`

### Novos campos de entrada
- Salário bruto mensal (R$)
- Data de admissão e demissão via **Popover + Calendar** (date picker do shadcn)
- Tipo de demissão: 4 opções (sem justa causa, com justa causa, pedido de demissão, acordo mútuo art. 484-A)
- Toggle "Possui saldo de FGTS?" (Switch) + campo valor estimado (condicional)
- Média de horas extras mensais (opcional, number)
- Toggle "Possui comissões?" (Switch) + campo média mensal (condicional)

### Cálculos expandidos
- **Remuneração base** = salário + horas extras + comissões
- **Saldo de salário** = (remuneração / 30) × dias trabalhados no mês
- **Aviso prévio** proporcional: 30 dias + 3 dias/ano (máx 90), conforme art. 487 CLT. Indenizado (sem justa causa), metade (acordo), zero (justa causa/pedido demissão)
- **13º proporcional** = (remuneração / 12) × meses trabalhados no ano
- **Férias proporcionais + 1/3** = (remuneração / 12) × meses desde último período aquisitivo + 1/3
- **Férias vencidas + 1/3** = se tempo > 12 meses e período aquisitivo completo não gozado
- **Multa FGTS**: 40% (sem justa causa), 20% (acordo), 0% (justa causa/pedido)
- **FGTS do mês da rescisão** = remuneração × 8%

### Resultado
- Tabela usando componentes `Table` do shadcn com cada verba discriminada
- Total líquido estimado em destaque (bold, cor primária)
- Botão "Gerar Relatório PDF" usando jsPDF — tabela formatada com cabeçalho "Relatório de Rescisão Trabalhista — JurisAI"
- Aviso amarelo: "Cálculo estimado. Consulte um advogado trabalhista para valores exatos."

### Imports adicionais
- `Switch` do shadcn
- `Calendar`, `Popover`, `PopoverContent`, `PopoverTrigger` para date pickers
- `Table, TableBody, TableCell, TableHead, TableHeader, TableRow` para resultado
- `AlertTriangle` do lucide para aviso
- `jsPDF` para PDF
- `format` do date-fns
- `toast` do sonner

