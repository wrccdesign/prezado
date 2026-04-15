

## Remover edge function temporária test-juslaboris

### O que será feito

1. **Deletar o arquivo** `supabase/functions/test-juslaboris/index.ts`
2. **Remover a entrada** `[functions.test-juslaboris]` do `supabase/config.toml`
3. **Remover a função deployada** usando a ferramenta de delete de edge functions

Isso resolve o erro de build e limpa o código temporário de teste.

