# Reforma visual de /jurisprudencia

Avaliação da proposta e plano de execução. A proposta é compatível com o sistema visual e não exige tocar em lógica.

## a) Tema escuro

Não há tema escuro ativo em rota nenhuma, pública ou logada. `tailwind.config.ts` define `darkMode: ["class"]`, mas nada adiciona a classe `dark` ao `<html>`: não existe `ThemeProvider`, nem toggle, nem classe no `index.html`. A única referência a `next-themes` está em `src/components/ui/sonner.tsx`, que chama `useTheme()` sem provider e cai no padrão. Ou seja, as 6 variantes `dark:` em `Jurisprudencia.tsx` são código morto e podem sair com segurança.

## b) /decisao/:id

Sim, `DecisaoDetalhe.tsx` segue o visual antigo: `Card`, `Badge`, cores `bg-green-100`/`bg-red-100`/`bg-amber-100` com variantes `dark:`, `Sparkles` no assistente, `Scale` no estado vazio, `bg-muted`. Também tem 6 ocorrências `dark:`.

Recomendação: entra no mesmo lote, mas como segunda etapa dentro da mesma entrega, com escopo reduzido: fundo creme, tipografia da escala, resultado como texto em vez de badge colorido, remoção de ícones decorativos e das classes `dark:`. O painel do assistente de IA (chat lateral) fica só com ajuste de tipografia e cor; a lógica de mensagens não muda. Se preferir manter o lote pequeno, dá para fazer só `/jurisprudencia` agora, aceitando uma descontinuidade visível ao clicar num resultado.

## c) Card para article dentro do Link

Sem risco. O `Link` externo (`<Link to={/decisao/${d.id}} className="block">`) permanece; só o filho `Card` vira `<article>`. Os handlers internos já fazem `e.preventDefault()` e `e.stopPropagation()`:
- "Ver mais" e "Copiar nº CNJ" chamam ambos;
- `handleCopyCitation` chama ambos;
- "Ver no tribunal" é um `<a>` com `stopPropagation`, e como o clique não é impedido o browser abre o `target="_blank"` sem seguir o `Link` pai.

Esse comportamento independe do elemento usado. Um ponto de HTML a observar: `<a>` dentro de `<a>` é inválido. Isso já existe hoje com o "Ver no tribunal" dentro do `Link`. Como estamos mexendo na marcação, vale corrigir: manter o `Link` só no título/ementa em vez de envolver o bloco inteiro, e deixar as ações fora dele. Isso remove a necessidade de `preventDefault` nos botões e torna o markup válido, sem tocar em nenhuma função de dados.

## d) Arquivos tocados e dependências

Estimativa: 2 arquivos (3 se contar o teste visual).

1. `src/pages/Jurisprudencia.tsx` — bloco de busca em creme, H1/parágrafo da escala, input branco com borda `cream-dark`, botão dourado, "Filtros avançados" como link sublinhado, selects com estilo claro (`bg-white border-cream-dark`) no lugar de `bg-white/10 border-white/20`, resultados em `<article class="border-t border-cream-dark pt-5">`, ementa em serif, número CNJ em mono, ações como links de texto, "Provido"/"Improcedente" como texto em `text-navy/70`, "Andamento processual" e "Interior" entre parênteses, bloco de IA sem `Sparkles` com alternativas como links separados por vírgula, aviso de visitante em `bg-white border border-cream-dark rounded-lg p-5`, estado vazio sem `Scale`, remoção das classes `dark:`. `Loader2` permanece. Imports de ícones ficam reduzidos a `Loader2` e `Check`.
2. `src/pages/DecisaoDetalhe.tsx` — mesma linguagem, conforme o item b.

Não há componente compartilhado de badge de tribunal: `resultadoColor` é uma função local em cada uma das duas páginas, então ambas somem junto com os badges. `formatCitation` em `src/lib/citation.ts` não é visual e não muda. `AppHeader`/`AppFooter` já estão no novo padrão.

Intocados: `handleSearch`, quotas, `notifyUsageConsumed`, toasts, leitura de `?q=` com o `useEffect` guardado por ref, filtros e chamadas de edge function.

## Ponto que precisa da sua decisão

O `Link` envolvendo o resultado inteiro: mantenho como está (bloco clicável, `<a>` aninhado inválido) ou passo o link para o título e a ementa, deixando as ações fora? A segunda opção é o HTML correto e melhora acessibilidade, mas muda a área de clique.

## Validação

`bunx tsgo --noEmit`, `bun run build`, screenshot de `/jurisprudencia` com resultado real e de `/decisao/:id`, e grep por `dark:`, `Card`, `Badge`, `font-bold`, `font-semibold`, `rounded-full` nos arquivos tocados.
