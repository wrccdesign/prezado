# Compactar espaçamentos verticais da home

Escopo: apenas `src/pages/LandingPage.tsx`. Nenhum texto, componente, rota ou função é alterada. Só classes utilitárias de espaçamento.

## Diagnóstico

As seções de fundo creme estão usando `py-16 md:py-24` e `border-t border-cream-dark` entre elas. Isso cria duas camadas de respiro (padding + linha) e deixa a página muito longa. O usuário reportou que a altura está ocupando espaço demais.

## O que muda

**1. Padding vertical das seções**
- Hero: de `py-12 md:py-20` para `py-10 md:py-16`.
- Demais seções de conteúdo: de `py-16 md:py-24` para `py-12 md:py-16`.
- Planos e CTA final: de `py-16 md:py-24` para `py-14 md:py-18`.

**2. Remover divisórias entre seções de mesmo fundo**
- Retirar `border-t border-cream-dark` das seções "Do fato ao fundamento", "Por que a fonte importa", "Memória de cálculo" e "Calcule agora".
- Manter a transição visual entre creme e navy (planos) e entre navy e o CTA final, mas sem bordas extras.

**3. Margens internas entre título e conteúdo**
- `mt-12` que separa título da grade de etapas: para `mt-8`.
- `mt-10` que separa título da tabela/memória: para `mt-8`.
- `mt-8` da calculadora: para `mt-6`.
- `mt-12` dos planos: para `mt-8`.

**4. Espaçamento dentro da grade de etapas**
- `gap-8` para `gap-6`.

**5. Manter inalterado**
- Tipografia, cores, raio, sombra do plano em destaque, conteúdo textual, card da decisão do TJPR, formulário de busca e CTA final.

## Validação

Após implementar, verifico via Playwright em 390x844 (mobile) e 1280x900 (desktop) com screenshots, confirmando que a página ficou mais compacta sem parecer apertada e que as transições de fundo ainda marcam bem as mudanças de assunto.
