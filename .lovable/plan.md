# Abrir o pagamento em uma nova aba

## O que aconteceu

A tela de pagamento do Asaas recusa ser exibida dentro de outra página. Hoje o site troca a página atual pelo endereço do Asaas, e como a pré-visualização do Lovable roda dentro de uma moldura, o Asaas bloqueia e aparece "sandbox.asaas.com refused to connect".

Isso é comportamento do Asaas (proteção contra ser embutido), não erro do checkout: o link gerado está correto.

## Mudança

Em `src/pages/Planos.tsx` (linha 203), trocar a troca de página por abertura em nova aba:

- Abrir o endereço de pagamento em uma aba nova (`window.open(checkoutUrl, "_blank", "noopener,noreferrer")`).
- Se o navegador bloquear a abertura, mostrar um aviso com um link clicável para o pagamento, em vez de falhar em silêncio.
- Manter o estado de carregamento coerente: o botão volta ao normal depois de abrir a aba.

Nada muda no back-end, nos preços, nos planos ou no fluxo de confirmação.

## Como testar depois

1. Entrar na pré-visualização, ir em Planos e escolher um plano.
2. A tela do Asaas abre em uma aba nova.
3. Pagar com cartão de teste do sandbox e voltar em Conta para conferir a assinatura.
