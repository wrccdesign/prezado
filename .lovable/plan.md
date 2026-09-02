# Estado atual do lote da Fase 4

## 1. Commits desde 392241d

| Commit | Mensagem | Arquivos |
|---|---|---|
| 2c486b5 | Changes | CalculatorLanding.tsx |
| b0f5e93 | Changes | FaqSection.tsx |
| af82914 | Changes | Calculators.tsx |
| d5cdf97 | Changes | 7 calculadoras (Correcao, CpfCnpj, Custas, Date, Pensao, Prazo, Rescisao) |
| d17e2c9 | Changes | CorrecaoCalc.tsx |
| 62732f5 | Changes | Correcao, Custas, Date, Pensao, Prazo, Rescisao |
| bf5f12f / ae84fad / 918c3a1 / 67c4a2b | Changes | Pensao, Rescisao, Custas, Prazo |
| 57140b5, b27e2fc, afaaad8, a43e8c9, a48ce36 | Changes | Planos.tsx |
| 34a219f | Changes | 7 landings de calculadora, routeMeta.ts, faqData.ts |
| 78b4f64 | Changes | 7 landings de calculadora |
| 0652f5d | Finalizou Fase 4 do site | (merge/checkpoint) |
| 51490f9 | Changes | shared: GuestExportGate, MemoriaList, ResultCard, StepIndicator |
| b3d52c8 | Atualizou componentes compartilhados | (checkpoint) |

## 2. Contagem atualizada (23 arquivos)

Padrões com zero ocorrências em todos os arquivos: `Card`, `Badge`, `uppercase`, `tracking-wide`, `font-bold`, `font-semibold`, `rounded-full`, gradiente, `bg-primary`, `text-white`, `dark:`, travessão.

Só sobraram estes:

| Arquivo | `·` | `text-muted-foreground` | Ícone lucide em Button (fora de Loader2/Check/Copy) | `bg-navy` |
|---|---|---|---|---|
| CustasCalc.tsx | 3 | 16 | ArrowLeft x2, ExternalLink | 0 |
| PrazoCalc.tsx | 1 | 6 | Download | 0 |
| DateCalc.tsx | 1 | 1 | CalendarDays | 0 |
| CorrecaoCalc.tsx | 0 | 4 | FileDown, FileText | 0 |
| PensaoCalc.tsx | 0 | 3 | FileText | 0 |
| RescisaoCalc.tsx | 0 | 2 | CalendarIcon x2, FileDown | 0 |
| CpfCnpjCalc.tsx | 0 | 2 | RotateCcw | 0 |
| Planos.tsx | 0 | 0 | 0 | 2 (toggle mensal/anual, decisão de estilo, não fundo de seção) |
| 5 shared, 7 landings, Calculators.tsx, CalculatorLanding.tsx, FaqSection.tsx | 0 | 0 | 0 | 0 |

Travessão em `src/seo/routeMeta.ts` e `src/seo/faqData.ts`: **0** (já limpos).

## 3. Situação dos quatro prompts

- **Prompt 1, componentes compartilhados: concluído.** Os cinco arquivos estão limpos em todos os padrões.
- **Prompt 2, moldura e vitrine (`CalculatorLanding.tsx`, `Calculators.tsx`, `FaqSection.tsx`): concluído.** Zero ocorrências.
- **Prompt 3, as sete calculadoras: parcial.** Estrutura visual feita (sem Card, Badge, dark:, bold), falta:
  - CustasCalc: 3 pontos médios (linhas 499, 500, 609), 16 `text-muted-foreground`, ArrowLeft (347, 490) e ExternalLink (630) em botão.
  - PrazoCalc: 1 ponto médio (375), 6 `text-muted-foreground`, Download (381).
  - DateCalc: 1 ponto médio (43), 1 `text-muted-foreground`, CalendarDays (105).
  - CorrecaoCalc: 4 `text-muted-foreground`, FileDown/FileText (352, 355).
  - PensaoCalc: 3 `text-muted-foreground`, FileText (217).
  - RescisaoCalc: 2 `text-muted-foreground`, CalendarIcon (131, 135, seletor de data, pode ser mantido como funcional), FileDown (164).
  - CpfCnpjCalc: 2 `text-muted-foreground`, RotateCcw (139).
- **Prompt 4, `/planos`, landings SEO e travessões: concluído.** Único ponto a decidir é o `bg-navy` do toggle mensal/anual em Planos.tsx (uso como estado selecionado, não como fundo de seção).

## Próximo passo proposto (prompt único)

Fechar o Prompt 3: trocar `text-muted-foreground` por `text-navy/60` ou `text-navy/70` conforme peso, trocar ponto médio por vírgula ou quebra, e remover os ícones decorativos dos botões (mantendo `Loader2`, `Check`, `Copy` e o `CalendarIcon` do seletor de data, que é funcional). Sem alterar cálculo, fontes oficiais ou gate de exportação. Validação ao final: typecheck, build, grep dos padrões nos sete arquivos e screenshot de duas calculadoras com resultado.
