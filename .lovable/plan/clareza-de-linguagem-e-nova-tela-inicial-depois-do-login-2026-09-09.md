# Clareza de linguagem e nova tela inicial depois do login

## O problema hoje

1. Quem entra na conta cai direto na tela de Análise Jurídica, com um campo de texto grande e um botão. Não há contexto, não há escolha, não há visão do que mais existe. É a tela mais difícil de começar: exige que a pessoa já saiba o que quer fazer.
2. "Análise" e "Diagnóstico" são a mesma promessa para quem lê o menu: alguém olha meu caso e me diz o que fazer. A diferença real é só a forma de entrada: Análise parte de um documento colado ou enviado; Diagnóstico parte da situação descrita com as próprias palavras. Nenhum texto na interface diz isso.
3. O menu Ferramentas guarda Diagnóstico, Petição, Chat, Modelos e Painel sem nenhuma frase de apoio, então a descoberta depende de tentativa e erro.

## O que proponho

### 1. Unificar as duas entradas em um só lugar

Uma entrada única no menu, chamada **Meu caso**, com duas formas de começar dentro da mesma tela:

- "Tenho um documento" (envio ou colagem, o que hoje é Análise)
- "Vou descrever a situação" (o que hoje é Diagnóstico)

O resultado continua sendo o de cada motor atual, sem mexer na lógica de análise nem na de diagnóstico. Muda só a porta de entrada e o texto.

Rotas: `/analise` recebe a tela unificada, com abas. `/diagnostico` continua existindo e abre a mesma tela já na aba de descrição, para não quebrar links, a landing pública e a busca. A raiz `/` deixa de ser a tela de análise para quem está logado.

Se preferir manter os dois nomes separados, a alternativa mínima é renomear no menu para "Analisar documento" e "Descrever meu caso", com uma linha de explicação embaixo de cada um. Digo qual escolher no fim do plano.

### 2. Nova tela inicial depois do login (`/`)

Uma página de partida, não um formulário. Fundo creme, conteúdo alinhado à esquerda, container de 1120px, sem card decorativo e sem animação de entrada.

Ordem:

1. Linha de abertura com o nome da pessoa e uma frase curta: por onde começar hoje.
2. **Continuar de onde parou**: os três últimos itens do histórico (análise, diagnóstico ou petição), com data e um verbo de ação. Só aparece se houver histórico.
3. **O que dá para fazer**, em duas colunas no desktop e uma no mobile, sem card repetido: cada linha traz o nome, uma frase de uma linha dizendo o que entrega, e o link.
   - Meu caso: envie um documento ou descreva a situação, receba direitos, riscos e próximos passos.
   - Jurisprudência: busque decisões com link para a fonte no tribunal.
   - Petição: monte a peça em etapas, com fundamentação conferida.
   - Chat jurídico: tire dúvidas sobre um caso já analisado.
   - Calculadoras: correção, prazos, rescisão, pensão, custas, sem limite de uso.
   - Modelos de minutas: pontos de partida prontos para editar.
   - Painel do advogado: clientes, petições e modelos, só para quem tem OAB cadastrada.
4. **Seu plano**: consumo do mês em tabela curta (recurso, usado, limite), aviso de teste de 7 dias quando ativo, e link para Planos.

### 3. Ajustes de texto no menu

O item "Análise" some do topo e vira "Meu caso" dentro de Ferramentas, junto com os demais. O logotipo e o item Início levam à nova tela inicial. Cada item do menu no celular ganha a mesma frase curta de uma linha usada na tela inicial, para o vocabulário ser o mesmo em todo o site.

## O que não muda nesta rodada

Nada de backend: sem mudança em tabelas, cotas, permissões ou funções. Os motores de análise, diagnóstico e petição ficam iguais. A home pública para visitante fica exatamente como está. Nada de nova cor, fonte ou animação.

## Detalhes técnicos

- `src/App.tsx`: `HomeRoute` passa a renderizar a nova página `src/pages/Inicio.tsx` quando há sessão; nova rota `/analise` aponta para `src/pages/Index.tsx`; `/diagnostico` logado passa a abrir a tela unificada com a aba de descrição pré-selecionada.
- Tela unificada: componente com duas abas que reaproveita o corpo atual de `Index.tsx` e de `Diagnostico.tsx`, sem reescrever a chamada às funções `analyze-legal-text` e `diagnostico-juridico`.
- `src/pages/Inicio.tsx`: consulta os últimos registros do histórico já usados em `History.tsx` e reaproveita `useUsage`/`UsageSummary` para o bloco do plano; sem consulta nova ao banco.
- `src/components/AppHeader.tsx`: rótulos e frases de apoio; nenhuma mudança na regra de cadeado para quem não tem conta.
- SEO: `/` logado não é indexável (só visitante vê a landing), então não há mudança em `routeMeta.ts`; se `/analise` virar rota pública nova, entra em `routeMeta.ts`, `routeContent.ts` e no sitemap.
- Verificação: build, `check:seo` e capturas em 375px e 1280px da tela inicial e da tela unificada.

## Recomendação

Ficar com a unificação em "Meu caso". Dois nomes para a mesma promessa é o que confunde, e renomear sem unir só adia o problema. A pergunta que a pessoa faz é "o que eu tenho na mão", não "qual produto eu quero".
