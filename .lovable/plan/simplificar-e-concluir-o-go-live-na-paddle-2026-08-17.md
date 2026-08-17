# Simplificar e concluir o go-live na Paddle

Decisão: continuar na Paddle, com os mesmos planos (Profissional R$49/mês, Escritório R$149/mês). O trabalho técnico já está pronto — o que resta é burocracia da Paddle, e o plano abaixo reduz isso ao mínimo.

## Por que a Paddle pede mais que outros provedores

A Paddle é *Merchant of Record*: ela vende em seu nome, emite a fatura, recolhe imposto e repassa o valor. Por isso exige verificação da empresa, páginas legais públicas e revisão do domínio. Provedores comuns (ex.: Stripe direto) não fazem isso porque a responsabilidade fiscal fica com você. Não há como desligar essas etapas mantendo a Paddle.

## Situação atual

- Readiness check: aprovado (privacidade, termos, reembolso, preços públicos, conteúdo)
- Publicação do projeto: concluída
- Verificação inicial: concluída
- Revisão de domínio: **reprovada** (honorifico.com.br estava fora do ar durante a transição de DNS)
- Identificação do negócio: **ação necessária** (documentos da Wrcc Design)
- Verificação de identidade e revisão final: pendentes, liberam automaticamente depois

## O que farei no código

1. Varredura final das páginas públicas exigidas pela Paddle (`/termos`, `/reembolso`, `/privacidade`, `/planos`) confirmando que abrem sem login no domínio novo e que os links do rodapé apontam para `honorifico.com.br`.
2. Adicionar um bloco curto de contato/identificação do vendedor (Wrcc Design, CNPJ, e-mail de suporte) visível no rodapé — é o item que a Paddle mais costuma citar em reprovação de domínio.
3. Garantir que os preços exibidos em `/planos` batem exatamente com os do catálogo Paddle (R$49 e R$149).
4. Republicar o site para a Paddle revisar a versão correta.

## O que só você pode fazer (2 ações, ~15 min)

1. **Responder ao e-mail de reprovação da Paddle** dizendo que honorifico.com.br está no ar e pedindo nova revisão de domínio. Só a Paddle reverte isso.
2. **Concluir Business identification** no painel de pagamentos: documentos da Wrcc Design, CNPJ 15.236.018/0001-64 e dados bancários.

Feito isso, identidade e revisão final costumam sair em algumas horas e o checkout ao vivo é liberado.

## Enquanto isso

O modo teste continua funcionando no preview, então dá para validar todo o fluxo de assinatura sem esperar a aprovação.
