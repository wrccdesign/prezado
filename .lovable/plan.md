
Objetivo: eliminar o “loading infinito” no upload de PDF, garantindo que o processamento sempre termine (sucesso ou erro claro) e o usuário não fique preso em 30%.

1) Diagnóstico (com base no código atual)
- No frontend (`src/pages/Index.tsx`), o estado `parsing` só é encerrado quando o `fetch` de `parse-document` resolve/rejeita.
- Esse `fetch` não tem timeout nem cancelamento; se a requisição ficar pendente, o spinner nunca para.
- Nos logs do backend, já houve casos de `Regex extraction yielded 0 chars, falling back to OCR...`, indicando OCR em PDFs escaneados grandes.
- Em OCR pesado, a chamada ao gateway pode demorar muito; hoje também não há timeout explícito no backend.

2) Correção proposta (arquitetura)
- Frontend: adicionar `AbortController` + timeout (ex.: 90s) na chamada de upload.
- Backend (`parse-document`): adicionar timeout específico na etapa OCR (ex.: 45s) para evitar bloqueio indefinido.
- Backend: retornar resposta controlada quando OCR expirar (em vez de ficar aguardando), com texto de fallback amigável.
- Frontend: tratar timeout/abort com mensagem explícita (“arquivo muito pesado para OCR no tempo limite; tente PDF menor, TXT ou colar texto”).

3) Mudanças planejadas por arquivo
- `src/pages/Index.tsx`
  - Envolver `fetch` com `AbortController`.
  - Criar timer de timeout e limpar no `finally`.
  - Ajustar `parseStage` para refletir etapa longa (ex.: “Aplicando OCR…”).
  - Diferenciar erro de timeout de erro genérico no toast.
- `supabase/functions/parse-document/index.ts`
  - Em `ocrWithVision`, usar `AbortController` com timeout.
  - Capturar `AbortError` e retornar `""` rapidamente.
  - Logar claramente timeout de OCR.
  - Manter retorno final sempre consistente (`text` + `ocr` e, opcionalmente, `ocr_timeout` para UX mais clara).

4) Critérios de aceite
- Upload não fica preso em “Processando...” indefinidamente.
- Mesmo quando OCR falhar/estourar tempo, o frontend sai do loading e mostra feedback útil.
- PDF problemático enviado pelo usuário conclui com:
  - texto extraído (se possível), ou
  - fallback amigável sem travar a interface.

5) Validação (fim a fim)
- Teste 1: PDF textual pequeno → deve concluir rápido.
- Teste 2: PDF escaneado grande (o que travava) → deve encerrar com sucesso ou timeout controlado (sem spinner infinito).
- Teste 3: repetir no mobile (430x667) para confirmar UX de progresso e mensagens.

Se você aprovar, eu implemento exatamente esse pacote (frontend + backend) em uma única rodada.
