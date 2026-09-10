# Correções de segurança no pagamento (Asaas)

## 1. Webhook: autenticação pelo header correto
- Ler o segredo apenas de `asaas-access-token`. Remover a leitura de `?token=` e de `X-Asaas-Token`.
- Remover também `?env=` da URL.

## 2. Ambiente derivado do token
- Dois novos segredos: `ASAAS_WEBHOOK_TOKEN_SANDBOX` e `ASAAS_WEBHOOK_TOKEN_LIVE` (pedidos a você pelo formulário seguro; você usará os mesmos valores no painel do Asaas).
- Comparar o token recebido com os dois usando comparação de tempo constante (hash SHA-256 dos dois lados e comparação byte a byte, sem retorno antecipado).
- O ambiente vem de qual token bateu. Nenhum bateu: 401.
- `getWebhookToken()` em `_shared/asaas.ts` é substituído por `matchWebhookEnv(token)`.

## 3. Idempotência sem perder evento
- Em `logEvent`, separar os casos:
  - erro com código `23505`: duplicata, ignora o evento e responde 200;
  - qualquer outro erro: responde 500 para o Asaas reenviar.
- O handler passa a propagar essa distinção em vez de sempre responder 200.

## 4. ID de evento obrigatório
- Remover `crypto.randomUUID()`. Sem `event.id`: log de erro e 500.
- Gravar `event_id` como `asaas_${event.id}`.

## 5. Checkout oficial do Asaas
- Substituir a criação direta de assinatura/cobrança + garimpagem de `invoiceUrl` por `POST /v3/checkouts`.
  - Mensal: `chargeTypes: ["RECURRENT"]`, `subscription: { cycle: "MONTHLY", nextDueDate }`.
  - Anual: `chargeTypes: ["DETACHED"]`, `billingTypes: ["PIX","CREDIT_CARD"]`.
  - `callback` com `successUrl`, `cancelUrl` e `expiredUrl` apontando para `/planos`.
  - `externalReference` no formato `${user.id}:${priceId}`.
  - Redirecionar para `https://asaas.com/checkoutSession/show?id={id}` em produção e o host equivalente de sandbox, escolhido por ambiente.
- Teste em sandbox: verificar se `billingTypes` com Pix é aceito junto de `RECURRENT`. Se não for, Pix fica só no anual e eu aviso no fim.
- O webhook passa a ler o `user_id` do `externalReference` do checkout, além do caminho atual por cliente.
- `listCustomerPayments` continua existindo (é usado no extrato da conta), mas sai do fluxo de checkout.

## 6. Autenticação da conta de cobrança
`asaas-billing-account` roda com `verify_jwt = false` e valida o JWT no código:

```ts
const token = req.headers.get("Authorization")?.replace("Bearer ", "");
const { data: { user }, error: authError } = await getSupabase().auth.getUser(token ?? "");
if (authError || !user) return json({ error: "Unauthorized" }, 401);
```

`summary`, `invoices`, `cancel` e `change-plan` filtram por `user_id = user.id`, então estão corretos.

Falha encontrada: `estimate-credit` aceita `subscriptionId` do corpo e consulta o Asaas sem checar dono, expondo o valor da assinatura de terceiros. Correção: validar antes que aquele `provider_subscription_id` pertence ao usuário; senão 403.

## 7. Import de CORS
`npm:@supabase/supabase-js@2/cors` será verificado por resolução real do pacote. Se o subpath não existir, defino `corsHeaders` em `_shared/cors.ts` e importo nas três funções.

## 8. Limpeza
Remover o import não usado `resolveAsaasEnv` em `asaas-webhook`.

## Verificação
- Typecheck e build.
- Deploy das três funções.
- Testes: webhook sem header (401), com token errado (401), com token sandbox (200), evento repetido (200 sem regravar), evento sem `id` (500).
- Checkout mensal e anual em sandbox, conferindo a URL de sessão retornada.

## URLs finais do webhook (sem parâmetros)
- Sandbox: `https://hfhzkvuoywgxjklpiydq.supabase.co/functions/v1/asaas-webhook`
- Produção: `https://hfhzkvuoywgxjklpiydq.supabase.co/functions/v1/asaas-webhook`

É a mesma URL nos dois ambientes; o ambiente é decidido pelo token enviado no header. Não configurarei nada no painel do Asaas.
