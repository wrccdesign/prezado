

## Inserir assinaturas free para usuários existentes

### Situação atual
5 usuários no banco sem registro na tabela `subscriptions`:
- costacarvalho@aasp.org.br
- virtusconsultoria@gmail.com
- pejotisker@hotmail.com
- buracosmt@gmail.com
- fernandamanica@gmail.com

### O que será feito
Usar a ferramenta de INSERT para inserir 10 registros (2 por usuário: um `sandbox` e um `live`), replicando o comportamento do trigger `handle_new_user`:

```sql
INSERT INTO subscriptions (user_id, plan_id, status, environment)
VALUES
  ('25797a26-...', 'free', 'active', 'sandbox'),
  ('25797a26-...', 'free', 'active', 'live'),
  -- ... para cada um dos 5 usuários
```

### Resultado
- Todos os 5 usuários passam a ter assinatura free registrada
- Lista de emails entregue para cópia

