# Plano: Diagnosticar e destravar o Paddle no Prezado.ai

## O que é o Paddle
Paddle é o provedor de pagamentos nativo do Lovable (Merchant of Record). Ele processa cartão, boleto, Pix, emite notas fiscais, cobra impostos e repassa o dinheiro para a Wrcc Design. No projeto, ele já está configurado com dois planos pagos:

- Profissional: R$ 49/mês
- Escritório: R$ 149/mês

Os limites diários de uso (buscas, chat, diagnósticos, petições) são aplicados com base na tabela `subscriptions`, que é atualizada por webhooks do Paddle.

## Status atual identificado
- Sandbox (teste): produtos e preços criados e ativos.
- Go-live: **bloqueado na etapa "Domain review"** — Paddle rejeitou `honorifico.com.br`.
- Readiness check (páginas legais, preços, conteúdo): **aprovado**.
- Verificação inicial de conta: **concluída**.
- Identificação empresarial e verificação de identidade: **pendentes** (dependem da revisão de domínio).

## Objetivo
1. Confirmar que o checkout de teste funciona no preview.
2. Resolver a rejeição de domínio para liberar pagamentos reais.
3. Completar as etapas pendentes de verificação empresarial/identidade.
4. Testar o fluxo completo de assinatura no sandbox.

## Etapas

### 1. Diagnóstico técnico no preview (sandbox)
- Abrir `/planos` no preview logado.
- Clicar em "Assinar Profissional" e verificar se o checkout Paddle abre.
- Verificar console do navegador por erros de token, CORS ou resolução de preço.
- Verificar se a edge function `get-paddle-price` responde corretamente.
- Confirmar que `payments-webhook` está registrado e recebendo eventos de teste.

### 2. Resolver a rejeição de domínio
- Verificar o e-mail enviado pela Paddle com o motivo da rejeição de `honorifico.com.br`.
- Corrigir o problema apontado (geralmente: conteúdo do site, páginas legais, dados de contato ou inconsistência de marca).
- Reenviar o domínio para revisão.
- Acompanhar até a etapa "Domain review" ficar como "completed".

### 3. Completar verificação empresarial e de identidade
- Finalizar o cadastro de "Business identification" na aba Payments.
- Responder às solicitações de "Identity verification" quando liberadas.
- Aguardar "Final review".

### 4. Teste end-to-end no sandbox
- Criar uma assinatura de teste com cartão `4242 4242 4242 4242`.
- Confirmar que a tabela `subscriptions` é atualizada com `plan_id = profissional`.
- Confirmar que os limites diários refletem o plano pago.
- Testar cancelamento e mudança de plano via `/conta`.

## Entregáveis
- Checkout de teste funcionando no preview.
- Domínio `honorifico.com.br` aprovado na Paddle.
- Conta Paddle aprovada para receber pagamentos reais.
- Documento curto com os cartões de teste e passos de validação.

## Riscos e observações
- A rejeição de domínio pode exigir ajustes no site que a Paddle não detalha claramente no e-mail. Nesse caso, a estratégia é corrigir o máximo possível de itens do readiness check e reenviar.
- Enquanto o domínio não for aprovado, o checkout live mostrará erro para usuários reais, mesmo que tecnicamente o código esteja correto.
