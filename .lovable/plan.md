## Trocar modelo para Gemini 2.5 Flash

### Contexto
A análise jurídica está lenta com `google/gemini-2.5-pro` (chegou a dar timeout no teste). Você prefere velocidade — vamos para o Flash.

### O que será alterado
`supabase/functions/analyze-legal-text/index.ts`, linha 247:
- De: `model: "google/gemini-2.5-pro"`
- Para: `model: "google/gemini-2.5-flash"`

A linha 182 (extração de palavras-chave) já usa `gemini-2.5-flash-lite` e continua igual.

### Sobre "assinar o Gemini"
Não muda nada aqui. As chamadas de IA do app passam pelo Lovable AI Gateway (crédito Lovable), não pela sua conta pessoal do Gemini. Sua assinatura do Google não é usada nem consultada nessa rota — nenhum ajuste de credencial necessário.

### Passos
1. Editar o model na linha 247.
2. Redeployar a função `analyze-legal-text`.
3. Testar via curl para confirmar resposta rápida sem erro 500.
