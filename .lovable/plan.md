# Validação do JSON-LD no HTML estático

Criar uma checagem automatizada que confirma quais blocos JSON-LD realmente aparecem no HTML gerado no build (sem depender do JavaScript), para as rotas mais importantes.

## O que será verificado

| Rota | Blocos esperados |
| --- | --- |
| `/planos` | Organization, WebSite, Product, BreadcrumbList, FAQPage |
| `/diagnostico` | Organization, WebSite, BreadcrumbList, SoftwareApplication |
| `/calculadoras/correcao-monetaria-juros-lei-14905` | Organization, WebSite, BreadcrumbList, SoftwareApplication, FAQPage |
| `/calculadoras/prazo-processual` | Organization, WebSite, BreadcrumbList, SoftwareApplication, FAQPage |

Além dos `@type`, a checagem valida:
- JSON parseável em todos os blocos (nenhum quebrado por escape);
- presença de `@context` igual a `https://schema.org`;
- `FAQPage` com pelo menos uma pergunta e todas com `acceptedAnswer.text` não vazio;
- `BreadcrumbList` terminando na URL da própria rota;
- `<title>`, `<meta name="description">` e `<link rel="canonical">` coerentes com `src/seo/routeMeta.ts`.

## Como será entregue

- Novo script `scripts/check-jsonld.mjs`: lê `dist/<rota>/index.html`, extrai os `<script type="application/ld+json">`, compara com o esperado derivado de `src/seo/routeMeta.ts` e imprime um relatório por rota (OK / faltando / inesperado), saindo com código 1 em caso de falha.
- Novo script em `package.json`: `"check:seo": "node scripts/check-jsonld.mjs"` (exige `bun run build` antes; o script avisa se `dist` não existir).
- Teste `src/test/jsonld.test.ts` cobrindo a mesma expectativa a partir de `ROUTE_META`, para rodar em `bunx vitest run` sem precisar de build.

## Detalhes técnicos

O script roda em Node puro, sem dependências novas. A lista de rotas verificadas fica em uma constante no topo do arquivo, fácil de estender. Nenhuma alteração em `vite.config.ts`, `routeMeta.ts`, textos de FAQ, cobrança, autenticação ou cálculos.

## Validação

Executar `bun run build` seguido de `bun run check:seo` e reportar o resultado por rota.
