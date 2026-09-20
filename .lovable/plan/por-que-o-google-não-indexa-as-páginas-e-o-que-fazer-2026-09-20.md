# Por que o Google não indexa as páginas, e o que fazer

## O que o Search Console está dizendo

- A página inicial está indexada e é a versão escolhida pelo Google. No último mês: 17 aparições na busca e 1 clique, com posição média 20.
- 23 páginas em "Descobertas, no momento não indexadas": o Google conhece o endereço pelo mapa do site, mas ainda não gastou tempo para visitar. Isso é fila de rastreamento, não erro. É o padrão em site novo, com poucos links de fora e páginas curtas.
- 3 páginas em "Página com redirecionamento": são endereços com www, que o site redireciona para a versão sem www. Isso está correto e não precisa de conserto.

Verifiquei no ar: robots libera tudo, cada página entrega título, descrição e um texto próprio já no HTML, e o redirecionamento de www funciona. Ou seja, nada está bloqueando. O que falta é motivo para o Google priorizar a visita.

## O que proponho fazer

### 1. Sinalizar frescor no mapa do site
Hoje o mapa do site não informa data de atualização. Vou incluir a data de última alteração real de cada página e manter o mapa e as rotas em sincronia automaticamente, para que o Google saiba o que mudou.

### 2. Dar mais substância às páginas em fila
As páginas de modelos e de calculadoras entregam hoje um parágrafo curto no HTML. Vou ampliar esse texto para uma versão completa e útil: o que é, quando usar, base legal citada, passo a passo e perguntas frequentes. Página com resposta real é o que faz o Google sair da fila e indexar.

Prioridade, pelas buscas que já trazem aparições:
1. Reclamação trabalhista, procuração ad judicia, notificação extrajudicial (já aparecem na busca, posições 18 a 76)
2. Demais modelos de minutas
3. Calculadoras de rescisão, pensão e custas

### 3. Ligar as páginas entre si
Criar links contextuais entre páginas relacionadas (cada modelo aponta para a calculadora do mesmo tema e vice-versa) e dar destaque ao mapa do site no rodapé. Página sem link interno tem pouca chance de ser rastreada.

### 4. Pedir indexação das prioritárias
Depois das melhorias publicadas, reenviar o mapa do site e acompanhar semana a semana quantas saíram da fila.

## Detalhes técnicos

- `public/sitemap.xml` ganha `lastmod` por rota, derivado de data real de alteração do conteúdo, nunca da data do build.
- `src/seo/routeContent.ts` é ampliado por rota; o texto continua injetado no HTML pelo plugin de build (`vite.config.ts`), sem mudar a experiência de navegação.
- Links internos entram nos componentes de landing existentes (`MinutaDetalhe.tsx`, `CalculatorLanding.tsx`), sem alterar rotas, cores, tipografia ou regras de negócio.
- Nenhuma mudança em banco, pagamentos ou autenticação.

## Ordem sugerida

Rodada 1: itens 1 e 3 (rápidos), mais os três modelos prioritários do item 2. Rodada 2: restante dos modelos. Rodada 3: calculadoras.
