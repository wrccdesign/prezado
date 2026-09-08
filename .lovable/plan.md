# Como o site aparece para as IAs (GEO) e o que melhorar

## Situação atual

O que já existe e funciona:

- `public/robots.txt` libera tudo, com link do sitemap.
- `public/sitemap.xml` com 26 endereços, espelhando `src/seo/routeMeta.ts`.
- `public/llms.txt` com resumo do produto e lista de páginas.
- Título, descrição, canônica e imagem social gerados no build para cada rota (plugin `static-route-meta`), então cada endereço tem cabeçalho próprio no HTML.
- JSON-LD estático em 5 rotas: correção monetária, prazo processual, diagnóstico, planos (com FAQ e Product) e trilhas de navegação.

As lacunas, em ordem de impacto:

1. **O texto das páginas não existe no HTML.** Só o cabeçalho é gerado no build; o conteúdo aparece depois, montado pelo navegador. Boa parte dos robôs de IA (os da OpenAI, Perplexity e Anthropic) não executa essa montagem, então eles leem uma página vazia com um bom título. Hoje é isso que mais limita a presença do site nas respostas de IA.
2. **Nenhuma regra explícita para os robôs de IA** no robots.txt. Ficam liberados pela regra geral, mas sem citação explícita nem menção ao llms.txt.
3. **llms.txt raso e desatualizado.** Não lista rescisão, pensão nem o comparativo, não tem datas, e não existe uma versão longa com as respostas em si.
4. **Dados estruturados incompletos.** Sem identidade da empresa nem caixa de busca no site, sem perguntas frequentes na maioria das páginas, sem marcação de "como calcular" nas calculadoras.
5. **Falta conteúdo em formato que a IA consegue citar:** resposta curta no topo da página, tabelas, glossário de termos, base legal explícita.
6. **Páginas de decisão** (`/decisao/:id`) ficam fora do sitemap e sem cabeçalho próprio, perdendo a cauda longa de busca.
7. Sitemap sem data de atualização (`lastmod`).

## O que proponho fazer

### Fase 1, base técnica (rápida, alto retorno)

- Reescrever `public/robots.txt` citando por nome GPTBot, OAI-SearchBot, ChatGPT-User, PerplexityBot, Perplexity-User, ClaudeBot, Claude-SearchBot, Google-Extended, Applebot-Extended e CCBot, todos liberados, e apontar o llms.txt.
- Ampliar `public/llms.txt`: incluir as rotas que faltam, a base legal de cada calculadora e a data da última revisão.
- Criar `public/llms-full.txt` com o conteúdo em si: o que cada calculadora faz, fórmula, fonte oficial do índice, perguntas frequentes com resposta completa e os termos do glossário.
- Acrescentar `lastmod` a cada endereço do sitemap.

### Fase 2, conteúdo legível sem navegador

Gerar, no build, o texto principal de cada rota pública dentro do HTML, para que o robô que não monta a página ainda leia a resposta.

- Cada rota de `routeMeta` ganha um resumo em texto (título, parágrafo de resposta direta, itens principais, perguntas e respostas), escrito uma vez em um arquivo de dados.
- O plugin do build injeta esse texto no HTML gerado; ao abrir no navegador, a aplicação assume normalmente e o bloco é substituído.
- Resultado: as IAs passam a ler conteúdo real em todas as páginas públicas, sem mudar a experiência de quem navega.

### Fase 3, dados estruturados completos

- Identidade da empresa e busca do site no HTML de todas as rotas.
- Perguntas frequentes marcadas nas páginas de calculadora que ainda não têm, mais comparativo e página inicial.
- Marcação de "passo a passo do cálculo" nas calculadoras, com a base legal citada.
- Trilha de navegação em todas as rotas internas.

### Fase 4, conteúdo que a IA cita

- Bloco de resposta direta no topo de cada landing de calculadora, com a regra e a fonte oficial em duas ou três linhas.
- Tabela de base legal por calculadora (dispositivo, o que determina, link oficial).
- Glossário jurídico em `/glossario`, com verbete curto e definido, entrando no sitemap e no llms.txt.
- Página "sobre os dados": de onde vem cada índice, com que frequência é atualizado, como conferir.

### Fase 5, páginas de decisão

- Cabeçalho próprio e dados estruturados por decisão, com sitemap gerado a partir das decisões já publicadas no banco.
- Avaliar limite de volume e frequência de atualização antes de ligar.

## Detalhes técnicos

- `vite.config.ts`, função `applyMeta`: além das metatags, injetar um bloco de conteúdo no `<div id="root">` (ou logo antes dele) a partir de um novo `src/seo/routeContent.ts`. A aplicação React sobrescreve esse conteúdo ao hidratar; nenhum estado do app muda.
- `src/seo/routeMeta.ts` continua a fonte única de metadados; o conteúdo textual fica separado para não inflar o arquivo.
- Dados estruturados novos entram pelo mesmo caminho `jsonLd` já existente, sem tocar em `SEO.tsx`.
- Verificação: `bun run build`, `bun run check:seo`, e uma leitura do HTML gerado com o JavaScript desligado, confirmando texto visível em cada rota.

## Ordem sugerida

Fases 1 e 2 numa rodada (é onde está o ganho real), fase 3 na seguinte, fases 4 e 5 depois, uma rota ou um lote por vez.
