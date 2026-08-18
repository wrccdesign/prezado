# Concluir go-live do Stripe no Honorífico

## Status atual
- A migração Paddle → Stripe já foi concluída no código.
- O checkout em ambiente de teste (sandbox) está funcionando.
- O go-live do Stripe está na **etapa 1 de 5**.

## Etapas pendentes (todas no dashboard da Stripe)

1. **Reivindicar a sandbox Stripe** (em andamento)
   - Clicar no link "Claim your sandbox" no painel de pagamentos do Lovable.
   - Criar uma nova conta Stripe ou conectar a uma conta existente.
   - Confirmar o e-mail de verificação enviado pela Stripe.

2. **Completar o formulário de ativação da conta Stripe**
   - Tipo de negócio, dados pessoais, dados da empresa (Wrcc Design / CNPJ 15.236.018/0001-64).
   - Adicionar conta bancária para recebimento.
   - Ativar autenticação de dois fatores.
   - Revisar e enviar.

3. **Instalar o app Lovable na conta Stripe live**
   - A Stripe redireciona para a instalação após o envio do formulário.
   - Caso contrário, voltar ao painel do Lovable e clicar em "Install Lovable app".

4. **Provisionar chaves live (automático)**
   - O Lovable cria as chaves live e os webhooks automaticamente após a instalação do app.
   - Nenhuma ação manual necessária.

5. **Readiness check (automático)**
   - Validar produtos, preços e webhooks.
   - Se houver falhas, corrigir ou clicar em "Ask Lovable to fix".

## Observações importantes
- O checkout só funcionará em produção após todas as etapas estarem concluídas.
- O ambiente de teste continua disponível para simular pagamentos com cartões de teste.
- A aprovação da conta live pela Stripe pode levar de minutos a alguns dias, dependendo da verificação de documentos.
