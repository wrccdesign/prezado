# Corrigir erro "Failed to fetch" no Diagnóstico

## Causa

O cliente (`src/pages/Diagnostico.tsx`) envia o header `x-payment-env` ao chamar a edge function `diagnostico-juridico`. Porém, o `Access-Control-Allow-Headers` dessa function não lista `x-payment-env`, então o browser falha no preflight CORS e mostra "Failed to fetch" antes mesmo da requisição sair.

Outras functions (ex.: `_shared/auth.ts`) já incluem esse header — só a `diagnostico-juridico` ficou desatualizada.

## Alteração

**`supabase/functions/diagnostico-juridico/index.ts`**
- Adicionar `x-payment-env` (e demais headers padrão já usados no projeto) ao `Access-Control-Allow-Headers` do `corsHeaders`.

Sem mudanças de lógica, UI, banco ou auth. Somente o header CORS.

## Verificação

- Recarregar `/diagnostico`, clicar em "Analisar minha situação" e confirmar que a chamada retorna 200 (ou o 429 de limite, conforme o caso) em vez de "Failed to fetch".
