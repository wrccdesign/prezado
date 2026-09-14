# Corrigir o ambiente de pagamento no preview e tornar o ambiente visível

## O problema

O endereço do preview é `preview--honorifico.lovable.app`. A regra do servidor só reconhece como teste os endereços que começam com `id-preview--`, terminam em `.lovableproject.com` ou em `.sandbox.lovable.app`. O preview não bate com nenhuma e cai no padrão de produção, então o checkout abriu uma cobrança real.

Há um segundo desencontro, hoje: no navegador, qualquer endereço terminado em `lovable.app` é tratado como teste, inclusive o site publicado `honorifico.lovable.app`. Ou seja, a tela e a cobrança podem discordar. Vou unificar as duas regras.

## A regra única

Um mesmo conjunto de regras, escrito igual nos dois lados (navegador e servidor):

Teste (sandbox), quando o endereço:
- é `localhost`, `127.0.0.1`, `[::1]` ou termina em `.localhost`
- contém `preview--` em qualquer posição (cobre `preview--x.lovable.app` e `id-preview--x.lovableproject.com`)
- termina em `.lovableproject.com` (todo domínio de desenvolvimento da Lovable)
- termina em `.sandbox.lovable.app`
- termina em `.lovable.dev` ou `.gptengineer.app` (domínios antigos ainda em uso)

Produção (live): todo o resto, incluindo `honorifico.com.br`, `www.honorifico.com.br` e o site publicado `honorifico.lovable.app`. Endereço desconhecido continua sendo tratado como produção, como você pediu.

Consequência intencional: o site publicado em `honorifico.lovable.app` passa a ser produção também no navegador, ficando igual ao que o servidor já faz.

## Indicador de ambiente visível

- Em teste, uma faixa fixa no topo de todas as páginas (não só nas de pagamento), com o texto "Ambiente de teste. As cobranças aqui não são reais." Ela já existe para algumas telas; passa a ser aplicada no cabeçalho, uma única vez.
- Na tela de planos, ao lado do botão de assinar, uma linha curta dizendo se o pagamento será de teste ou real.
- Em produção, nada aparece.

## Testes automatizados

Novo arquivo de teste cobrindo a regra do navegador e a do servidor com a mesma lista:

| endereço | esperado |
|---|---|
| preview--honorifico.lovable.app | sandbox |
| id-preview--algo.lovableproject.com | sandbox |
| algo.sandbox.lovable.app | sandbox |
| localhost | sandbox |
| honorifico.com.br | live |
| www.honorifico.com.br | live |
| honorifico.lovable.app | live |

## Verificação

Abro o preview, chego até o checkout e confiro que a URL é `sandbox.asaas.com`, não `asaas.com`. Reporto a URL exata.

## Detalhes técnicos

- `supabase/functions/_shared/payment-env.ts`: nova lista de regras em `resolvePaymentEnv`, mantendo a derivação por Origin/Referer (sem confiar em header do cliente).
- `src/lib/payment-env.ts`: mesma lista, aplicada a `window.location.hostname`; exporta uma função pura `classifyHost(host)` para os testes.
- `src/components/PaymentTestModeBanner.tsx`: texto ajustado; render passa para `AppHeader.tsx` e as chamadas duplicadas em Planos, Conta, Chat, Petition, Diagnostico e MeuCaso são removidas.
- `src/pages/Planos.tsx`: linha de ambiente junto ao botão de assinatura.
- `src/test/payment-env.test.ts`: tabela acima, testando a função do cliente e, por importação direta do arquivo do servidor, a função do servidor.
- Sem mudança de banco, de webhook ou da lógica de assinatura.

## Sobre a cobrança de R$ 49 já gerada

Depois de corrigir, me diga se quer que eu cancele a assinatura e a cobrança em produção; faço uma a uma com sua confirmação.
