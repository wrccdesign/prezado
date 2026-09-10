# Erro no checkout: falta chave Pix na conta de produção

## O que aconteceu

O erro não é do site. O Asaas recusou a criação da cobrança com esta mensagem:

"Para gerar cobranças com Pix é necessário criar uma chave Pix no Asaas."

Isso veio da conta de produção (o teste foi feito no endereço publicado, que usa a conta real). O plano anual oferece Pix e cartão; como a conta ainda não tem chave Pix cadastrada, o Asaas rejeita a cobrança inteira e o pagamento nem chega a abrir.

## Como resolver

### Caminho principal (recomendado)
Cadastre uma chave Pix na sua conta do Asaas de produção (menu de conta bancária / Pix no painel do Asaas). Assim que a chave existir, o checkout anual e o Pix mensal passam a funcionar sem nenhuma mudança no site.

### Proteção no site (o que eu implemento)
Mesmo com a chave cadastrada, o site não deve quebrar quando o Pix está indisponível:

1. Quando o Asaas recusar a cobrança por falta de chave Pix, tentar novamente automaticamente só com cartão, para o pagamento seguir adiante.
2. Se ainda assim falhar, mostrar uma mensagem clara em português em vez do texto técnico atual ("Edge Function returned a non-2xx status code").
3. Na tela de planos, quando a opção Pix mensal for recusada pelo mesmo motivo, avisar que no momento só o cartão está disponível.

## Detalhes técnicos

- `supabase/functions/_shared/asaas.ts`: expor o código/descrição do erro do Asaas no objeto lançado, para permitir tratamento específico.
- `supabase/functions/asaas-create-checkout/index.ts`: detectar a mensagem de chave Pix ausente e refazer a chamada com `billingTypes: ["CREDIT_CARD"]` (anual) ou `billingType: "CREDIT_CARD"` (assinatura mensal); devolver 400 com mensagem legível quando não houver alternativa.
- `src/pages/Planos.tsx`: exibir a mensagem de erro vinda da função em vez do texto genérico do cliente.
- Publicar `asaas-create-checkout` e rodar typecheck e build.

## Fora do escopo
Webhook, autenticação e regras de plano permanecem como estão.
