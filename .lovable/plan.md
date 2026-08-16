# Teste das calculadoras com dados reais (pós-login)

Estado verificado agora no banco:

- `indices_economicos`: IPCA, INPC e IGP-M com 391 meses (1994-01 a 2026-07), Selic com 392 (até 2026-08), Taxa Legal com 25 (2024-08 a 2026-08).
- `feriados`: 115 registros.

Ou seja, a base está populada — o teste roda com dados oficiais reais, não em cenário vazio.

## O que será testado

### 1. Correção Monetária
- Login no preview com uma sessão de teste.
- Caso A (regime antigo): R$ 10.000, 10/01/2020 a 10/08/2024, IPCA, juros legais — confere correção pelo índice escolhido e juros de 1% a.m.
- Caso B (regime Lei 14.905/2024): R$ 10.000, 01/09/2024 a data atual — confere que a correção usa IPCA (série 433) e os juros usam a Taxa Legal (série 29543), séries distintas.
- Caso C: cálculo atravessando 30/08/2024 — confere a troca de regime mês a mês na memória de cálculo.
- Verificação: memória mês a mês completa, `meses_faltantes` vazio, totais (multa/honorários) coerentes, exportação PDF/Word abrindo sem erro.

### 2. Prazo Processual
- Caso A (cível): 15 dias úteis a partir de disponibilização no DJe — confere publicação no 1º dia útil seguinte e exclusão do dia do começo.
- Caso B (recesso): prazo iniciado em meados de dezembro — confere suspensão de 20/12 a 20/01.
- Caso C (penal): dias corridos, sem recesso.
- Caso D (UF): prazo em SP com feriado estadual dentro da janela — confere exclusão do dia.
- Verificação: lista de dias excluídos com motivo, prorrogação do vencimento, exportação .ics.

## Como será executado

Playwright headless contra `http://localhost:8080`, com sessão autenticada restaurada, capturando telas dos resultados. As funções `calcular-atualizacao` e `calcular-prazo` também serão chamadas diretamente para conferir os números retornados contra a UI.

## Resultado esperado

Um relatório com: valores obtidos em cada caso, divergências encontradas (se houver) e a lista de correções necessárias. Nenhuma alteração de código nesta etapa — apenas diagnóstico.
