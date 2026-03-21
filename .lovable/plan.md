

## Resolver timeout de OCR em PDFs grandes

### Problema
PDFs escaneados grandes (sem texto selecionável) são enviados inteiros como base64 para o Gemini via OCR, o que excede o timeout de 45s da edge function. O erro "OCR expirou" aparece quando o documento é muito pesado.

### Solução: OCR por páginas com chunking

Em vez de enviar o PDF inteiro de uma vez para o Gemini, dividir o processamento em chunks menores e processar página a página. Também ajustar os limites de arquivo para serem mais realistas.

### Mudanças

**1. Edge Function `parse-document/index.ts`**
- Implementar processamento paginado: enviar apenas os primeiros N MB do PDF para OCR (split em chunks de ~2MB)
- Aumentar o timeout do OCR de 45s para 55s por chunk
- Adicionar retry com backoff para chunks que falham
- Se o PDF for muito grande para OCR completo, processar parcialmente e informar o usuário
- Reduzir o limite de arquivo de 10MB para 5MB para PDFs (manter 10MB para TXT/DOCX que não precisam de OCR)
- Usar `google/gemini-2.5-flash-lite` para OCR (mais rápido, suficiente para extração de texto)

**2. Frontend `src/pages/Index.tsx`**
- Atualizar mensagem de limite: "PDF: máx 5MB / TXT e DOCX: máx 10MB"
- Validar tamanho por tipo de arquivo antes do upload
- Melhorar feedback de progresso para OCR parcial
- Mostrar aviso quando texto foi extraído parcialmente

**3. Fluxo atualizado**
```text
PDF upload → regex extraction
  ├─ texto suficiente → retorna
  └─ texto insuficiente → OCR
       ├─ PDF ≤ 2MB → envia inteiro
       └─ PDF > 2MB → trunca para primeiros 2MB
            └─ processa + avisa "extração parcial"
```

### Limites de segurança mantidos
- Validação de tamanho no frontend E no backend
- Limite de 5MB para PDFs (reduzido de 10MB)
- Timeout total de 55s para OCR
- Limite de 50.000 caracteres no texto extraído

