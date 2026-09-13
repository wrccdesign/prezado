# Navegação sem retorno visual: rolagem não volta ao topo

## Diagnóstico (confirmado)

- Não existe nenhum mecanismo de voltar ao topo na troca de página. A única chamada de rolagem no projeto inteiro está em `src/pages/DecisaoDetalhe.tsx` (rola o chat para o fim), sem relação com navegação.
- Como a navegação é feita pelo roteador no próprio navegador, sem recarregar, a posição da rolagem é preservada. Quem estava no meio de uma página cai no meio da nova, com o mesmo cabeçalho e o mesmo fundo creme no topo: a impressão é de que nada abriu.
- As quatro páginas citadas (Operações com datas, Validador CPF/CNPJ, Pensão alimentícia, Jurisprudência) não têm carregamento próprio de dados na abertura: aparecem instantaneamente. Ou seja, não há atraso, o problema é só a rolagem.
- Jurisprudência já tem indicador de carregamento durante a busca (ícone girando com "Buscando jurisprudência"). Não precisa de tratamento adicional.

## Correção proposta

1. Criar um componente global `ScrollToTop` (em `src/components/ScrollToTop.tsx`) que observa a rota atual e leva a janela ao topo a cada mudança de caminho.
   - Aplicado uma vez em `src/App.tsx`, dentro do roteador, valendo para todas as rotas.
   - Usa `useLayoutEffect` para o reposicionamento acontecer antes da pintura, sem "pulo" visível.
   - Não interfere quando o usuário volta pelo botão do navegador (navegação do tipo "pop"): nesse caso a posição anterior é preservada, comportamento esperado.
   - Não reposiciona quando muda apenas a consulta na URL (por exemplo `?q=` na Jurisprudência), para não atrapalhar quem está lendo resultados.
   - Respeita `prefers-reduced-motion`: salto direto, sem rolagem animada (na prática já usaremos salto direto sempre).

2. Barra de progresso no topo: **não recomendo**. As páginas em questão abrem instantaneamente, então a barra apareceria e sumiria no mesmo quadro, virando um piscar sem informação. Ela só faria sentido se houvesse carregamento sob demanda das telas, que hoje não existe (tudo é importado de uma vez). Voltar ao topo resolve a percepção de "a tela abriu".

3. Jurisprudência: nada a fazer. O indicador de busca já existe e é suficiente.

## Detalhes técnicos

- Novo arquivo: `src/components/ScrollToTop.tsx`, usando `useLocation` e `useNavigationType` do react-router-dom.
- Alteração em `src/App.tsx`: um import e uma linha, ao lado de `PostAuthRedirect`.
- Sem mudanças em páginas individuais, sem mudanças de estilo, rotas, cores ou conteúdo.

## Verificação

- Rolar até o fim da home, abrir cada uma das quatro páginas pelo menu e confirmar que abrem no topo.
- Confirmar que voltar pelo navegador mantém a posição de leitura anterior.
- Confirmar que buscar na Jurisprudência não joga a página para o topo a cada busca.
