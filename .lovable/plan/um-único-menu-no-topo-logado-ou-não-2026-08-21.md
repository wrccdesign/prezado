# Um único menu no topo, logado ou não

## O problema (confirmado no código)

Hoje existem **dois cabeçalhos diferentes**:

- `LandingPage.tsx` tem uma barra própria com âncoras da própria página: Calcular, Recursos, Memória de cálculo, Planos + Entrar/Cadastrar. Ela só aparece na home de visitante.
- `AppHeader.tsx` (todas as outras rotas) mostra Análise, Diagnóstico, Petição, Jurisprudência, Ferramentas + avatar/conta.

Resultado: o visitante que chega na home não vê nada do que o produto faz — vê rolagens da própria página. E se ele navegar para `/calculadoras` ou `/jurisprudencia` (rotas públicas), o menu muda por completo e passa a oferecer itens que ele nem pode abrir.

Concordo com sua leitura: o menu deve ser o mesmo, e deve mostrar o que o site tem.

## O que vou fazer

Um único menu de produto, com os mesmos rótulos para todos. O que muda com o login é só o canto direito (Entrar/Criar conta vs. avatar) e um cadeado nos itens que exigem conta.

Menu único (desktop):

```text
[Logo]   Calculadoras   Jurisprudência   Ferramentas ▾   Planos   |   Entrar  [Criar conta grátis]
                                          ├ Análise 🔒
                                          ├ Diagnóstico 🔒
                                          ├ Petição 🔒
                                          ├ Chat Jurídico 🔒
                                          ├ Modelos de Minutas
                                          └ Painel do Advogado 🔒 (advogado)
```

Depois de logar, exatamente o mesmo menu, sem cadeados, com Análise promovida ao primeiro nível e o avatar (conta, histórico, uso, planos) no lugar dos botões de entrar.

Critérios:

1. **Primeiro nível = o que o visitante pode usar agora**: Calculadoras e Jurisprudência são rotas públicas hoje; ficam visíveis para todos.
2. **Itens com conta continuam visíveis**, com ícone de cadeado. Clicar leva a `/auth` já guardando o destino, então após criar conta o usuário cai na página que queria — mesmo padrão do aviso de exportação das calculadoras.
3. **Planos** fica sempre no topo (é a página de conversão), e no menu da conta quando logado.
4. **Âncoras da landing** (Calcular, Recursos, Memória de cálculo) deixam de ser navegação de topo. Continuam existindo como seções da página, e o CTA do hero "Calcular agora" continua rolando até a calculadora.

## Detalhes técnicos

- `src/components/AppHeader.tsx` passa a ser o cabeçalho também da landing: novas listas de navegação com flag `requiresAuth`, item renderizado com `Lock` e `onClick` que faz `navigate("/auth", { state: { redirectTo } })` para visitantes.
- `src/pages/LandingPage.tsx`: remove a `<nav>` própria, o estado `menuOpen`/`scrolled` ligado a ela e o array `navSections`; passa a renderizar `<AppHeader />`. Ajusta o `padding-top` do hero, já que o header vira `sticky` em vez de `fixed`.
- Sheet mobile do `AppHeader` recebe a mesma estrutura, com as seções PRINCIPAIS / FERRAMENTAS / CONTA já existentes.
- Sem mudança em rotas, banco, cotas ou regras de acesso — apenas navegação e apresentação.

## Verificação

Screenshots via Playwright em `/` e `/calculadoras`, deslogado e logado, em desktop e mobile, conferindo que o menu é o mesmo e que um item com cadeado leva ao cadastro e volta para o destino certo.
