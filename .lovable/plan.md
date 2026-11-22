# Correções no Word e no PDF da memória de cálculo

## 1. Mesmo total no Word e no PDF (pro rata)
- O botão de exportar usa os mesmos parâmetros nos dois formatos, incluindo o pro rata. A diferença veio do exemplo: o Word foi gerado com pro rata desligado e o PDF com ele ligado.
- Gerar de novo o PDF e o Word da Correção a partir do mesmo cálculo (R$ 10.000, 15/01/2024 a 31/10/2025, pro rata ligado), conferir que os dois mostram o mesmo TOTAL e que o link e o QR trazem pro_rata=1.
- Adicionar um teste para garantir que o link de conferência mantém o pro rata.

## 2. Período no formato brasileiro
- No resumo da Correção, trocar "2024-01-15 a 2025-10-31" por "15/01/2024 a 31/10/2025" (vale para Word e PDF, que usam o mesmo texto).
- Conferir as outras calculadoras exportadas e corrigir se alguma mostrar data no formato do sistema.

## 3. Mesma data no cabeçalho e no rodapé
- O cabeçalho usa o fuso do computador; o rodapé usa o de São Paulo. Os dois passam a usar a mesma data de geração, no fuso America/Sao_Paulo.

## Entrega
- Mostrar o DOCX novo e o PDF correspondente em Files, com o total dos dois.
- Rodar os testes. Não publicar sem sua aprovação. Pedido de indicação continua parado.

## Sobre o purchase
- Sim: está no webhook do Asaas, enviado pelo Measurement Protocol só após o pagamento confirmado, sem repetir (registro por id do pagamento).
- Secret a criar: GA4_API_SECRET. No GA4: Administrador, Fluxos de dados, fluxo G-BYDBC1Q8MD, Chaves secretas da API do Measurement Protocol, Criar. Depois eu abro o formulário seguro para você colar o valor.

## Detalhes técnicos
- `CorrecaoCalc.tsx`: `buildSections` usa `formatDateBR` no período.
- `exportDocument.ts`: cabeçalho de `exportToPDF`/`exportToDOCX` usa `dataBR(verificacao.geradoEm)` (ou agora, em São Paulo) em vez de `toLocaleDateString` sem fuso.
- Teste em `urlConferencia` com `pro_rata`.
