# Correções no pagamento após a compra real

Verifiquei item por item. Dois já estão prontos, dois faltam.

## Já aplicado (vou pular)

- **Item 4a** — a estimativa de crédito não existe mais no sistema: não há ação "estimate-credit", nem função, nem chamada na tela. A troca de plano já avisa que passa a valer na próxima cobrança, sem cobrança nem crédito proporcional agora (tela de planos e tela da conta).
- **Item 4b** — a troca de plano já grava apenas o preço novo e o plano pendente, mantendo o plano atual; a confirmação do pagamento promove o plano pendente e limpa o campo. A tela da conta já exibe o plano atual e a mudança prevista.
- **Item 4c** — o link da próxima fatura já vem da cobrança real da assinatura no Asaas. Não há mais endereço montado à mão.

## Item 1 — assinatura duplicada

Na função de checkout, antes de criar qualquer coisa no Asaas:

1. Procurar uma cobrança iniciada e não concluída do mesmo usuário, mesmo ambiente e mesmo plano, criada há menos de 30 minutos. Existindo, devolver o mesmo endereço de pagamento já criado, em vez de abrir outro.
   Para isso é preciso guardar o endereço da sessão e o horário de criação na linha existente (dois campos novos na tabela de assinaturas: endereço de checkout e validade da sessão).
2. Consultar as assinaturas do cliente no Asaas. Havendo uma ativa para o mesmo plano, não criar outra: devolver uma resposta clara de que a assinatura já existe e encaminhar para a tela da conta.

Na tela de planos, o botão "Continuar para pagamento" passa a bloquear no primeiro clique e só volta a ficar disponível depois que a aba de pagamento abre ou o pedido falha. Hoje ele destrava cedo demais em parte dos caminhos.

## Item 2 — forma de pagamento sempre explícita

- Pix mensal: já é explícito.
- Cartão: a sessão de checkout já restringe a cartão.
- Resta uma função antiga de cobrança anual avulsa que usa "pergunte ao cliente". Ela não é mais chamada por nenhum fluxo: será removida, para não voltar a ser usada por engano.
- A criação de assinatura passa a exigir a forma de pagamento como parâmetro obrigatório, sem valor padrão, para que nunca fique indefinida.

## Item 3 — assinatura no Asaas sem registro no banco

Os dois caminhos passam a ter proteção:

- **Pix mensal**: hoje a assinatura é criada no Asaas e só depois gravada. Passa a ser: gravar primeiro a linha pendente, criar no Asaas, atualizar a linha com o identificador. Se a atualização falhar, cancelar imediatamente a assinatura recém-criada no Asaas e devolver erro.
- **Cartão**: gravar a intenção antes de abrir a sessão de checkout e registrar o identificador da sessão na mesma linha.

Nenhuma cobrança fica órfã: ou existe linha no banco, ou a assinatura é cancelada no Asaas.

## Limpeza das 4 assinaturas existentes no Asaas

Vou listar as assinaturas do seu cliente no Asaas e comparar com as duas conhecidas pelo sistema, informando quais estão sobrando. O cancelamento das duplicadas só acontece com sua confirmação, uma a uma.

## Detalhes técnicos

- Migração: `subscriptions.checkout_url text`, `subscriptions.checkout_expires_at timestamptz`.
- `asaas-create-checkout`: guarda de reuso por `(user_id, environment, price_id, status='incomplete', created_at > now()-30min)`; consulta `GET /v3/subscriptions?customer=...&status=ACTIVE`; gravação antes da criação remota com rollback via `DELETE /v3/subscriptions/{id}`.
- `_shared/asaas.ts`: remover `createAnnualCharge`; `createSubscription` com `billingType` obrigatório.
- `src/pages/Planos.tsx`: `isCheckoutLoading` mantido até o `window.open`/erro; sem alteração visual.
- Verificação: typecheck, build, publicação de `asaas-create-checkout`, teste em ambiente de testes com clique duplo.
