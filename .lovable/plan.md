

## Sistema completo de planos e pagamentos

### Ajustes necessários ao seu plano original

1. **Pagamentos via Paddle (não Stripe)**: O Prezado.ai é elegível para Paddle, que é o provedor nativo recomendado. Paddle atua como Merchant of Record — cuida de impostos, compliance e cobrança automaticamente. Taxa: 5% + 50¢ por transação. Isso simplifica muito a operação, especialmente para clientes brasileiros.

2. **Tabela `subscriptions`**: Seu SQL está correto, mas vou adicionar uma policy de INSERT para `service_role` (o webhook precisa inserir/atualizar) e o trigger para criar assinatura free automaticamente.

3. **Limites do plano free**: Você definiu `peticao=0` no free. Isso significa que cidadãos no plano gratuito não poderão gerar nenhuma petição — confirmo que é intencional?

---

### Etapas de implementação

**Etapa 1 — Habilitar Paddle**
- Ativar a integração nativa de pagamentos via Paddle
- Isso cria a infraestrutura de webhook automaticamente

**Etapa 2 — Criar produtos no Paddle**
- Profissional: R$49/mês
- Escritório: R$149/mês
- (Free não precisa de produto — é o padrão)

**Etapa 3 — Banco de dados**
- Criar tabela `subscriptions` com RLS (SELECT para o próprio usuário, INSERT/UPDATE para service_role)
- Criar trigger `on_auth_user_created` que insere `plan_id = 'free'` automaticamente
- Adicionar coluna `paddle_subscription_id text` para vincular ao Paddle

**Etapa 4 — Atualizar `rate-limit.ts`**
- Consultar `subscriptions` para obter o `plan_id` do usuário
- Aplicar limites por plano:

```text
              free    profissional  escritorio
search         5         50          200
chat           3         30          100
diagnostico    2         15           50
peticao        0         10           30
```

**Etapa 5 — Criar página `/planos`**
- 3 cards com design consistente com a landing page (navy/gold)
- Mostra plano atual do usuário destacado (badge "Seu plano")
- Botões de checkout integrados com Paddle
- Rota adicionada ao `App.tsx` (acessível logado e deslogado)

**Etapa 6 — Webhook de pagamento**
- Edge function que recebe eventos do Paddle
- No evento `subscription.activated` / `subscription.updated`: atualizar `subscriptions` com plano correto
- No evento `subscription.canceled`: marcar status como `canceled`

**Etapa 7 — UX de rate limit**
- Quando limite atingido, toast com botão "Ver planos" redireciona para `/planos`
- Na página de planos, mostrar uso atual do dia se logado

---

### Detalhes técnicos

**Arquivos modificados:**
- `supabase/functions/_shared/rate-limit.ts` — lookup de plano + limites dinâmicos
- `src/App.tsx` — nova rota `/planos`
- `src/pages/LandingPage.tsx` — links dos cards de plano apontam para `/planos`

**Arquivos criados:**
- `src/pages/Planos.tsx` — página de planos com checkout Paddle
- Edge function de webhook (criada pelo sistema Paddle)

**Migração SQL:**
- Tabela `subscriptions`
- Trigger `handle_new_user` atualizado para inserir em `subscriptions`
- RLS policies

