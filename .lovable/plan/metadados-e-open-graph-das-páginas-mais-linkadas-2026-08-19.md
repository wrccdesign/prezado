# Metadados e Open Graph das páginas mais linkadas

Objetivo: melhorar como Home, Jurisprudência e Planos aparecem no Google e quando o link é colado em WhatsApp, Instagram, LinkedIn e anúncios.

## Ponto importante antes de tudo

O site é uma SPA (Vite + React). Os robôs de preview social (WhatsApp, LinkedIn, Facebook) leem **apenas** o `index.html` estático — eles não executam JavaScript. Ou seja:

- O que aparece hoje ao compartilhar **qualquer** URL do site é sempre o título/descrição/imagem do `index.html`.
- Tags por rota (via Helmet) funcionam para o Google (que executa JS) e melhoram CTR na busca, mas **não** mudam a prévia social por página.

Então o plano faz duas coisas: deixa o preview social único do site muito melhor, e deixa os metadados por rota corretos para busca/anúncios. Preview social diferente por página só com renderização no servidor — dá para fazer migrando o app para o template mais novo da Lovable ([o que a migração traz](https://lovable.dev/blog/building-apps-using-tanstack-start)); nada obrigatório agora.

## O que será feito

### 1. Componente SEO ganha suporte a imagem e tags completas
`src/components/SEO.tsx` passa a aceitar uma prop `image` e emitir também:
`og:image`, `og:image:width/height`, `og:image:alt`, `og:site_name`, `og:locale` (pt_BR), `twitter:card=summary_large_image`, `twitter:image`. Se nenhuma imagem for passada, usa a imagem padrão do site.

### 2. Imagens Open Graph 1200×630
Três imagens de compartilhamento na identidade Honorífico (azul #0F2744 / dourado #C9860A, Playfair + DM Sans), geradas e versionadas no projeto:

- Home — marca + "IA jurídica brasileira"
- Jurisprudência — "Busca de jurisprudência em 33 tribunais"
- Planos — "Planos a partir de R$ 49/mês"

A imagem da Home também substitui a atual do `index.html` (hoje é um screenshot hospedado no Google Storage, com texto ilegível em miniatura).

### 3. Títulos e descrições reescritos para CTR

| Página | Título (até ~60 car.) | Descrição (até ~155 car.) |
| --- | --- | --- |
| Home (visitante) | Honorífico — IA Jurídica Brasileira | Analise documentos, gere petições e pesquise jurisprudência de 33 tribunais. Comece grátis, sem cartão. |
| Home (logado) | Análise Jurídica com IA — Honorífico | (mantém, ajustada ao limite) |
| Jurisprudência | Busca de Jurisprudência com IA — 33 Tribunais | Pesquise precedentes pelo conceito jurídico, não só por palavra-chave. Decisões de 33 tribunais brasileiros. Busca grátis. |
| Planos | Planos e Preços — Honorífico | Gratuito, Profissional (R$ 49/mês) e Escritório. 7 dias grátis no Profissional, sem cartão. Pagamento em reais. |

Também corrige "27 tribunais" para 33 na página de Jurisprudência (a Home já usa 33).

### 4. JSON-LD por rota
- Jurisprudência: `WebSite` + `SearchAction` (ativa a caixa de busca do Google) e `BreadcrumbList`.
- Planos: `Product` com `Offer` em BRL para os três planos e `BreadcrumbList`.
- Home: mantém o `SoftwareApplication` atual, com `aggregateRating` removido (não temos avaliações reais).

## Detalhes técnicos

- Arquivos alterados: `src/components/SEO.tsx`, `src/pages/LandingPage.tsx`, `src/pages/Index.tsx`, `src/pages/Jurisprudencia.tsx`, `src/pages/Planos.tsx`, `index.html`.
- Imagens novas em `src/assets/` e cópia servível em `public/og/` (o `og:image` precisa de URL absoluta: `https://honorifico.com.br/og/...jpg`).
- `canonical` e `og:url` continuam auto-referenciando cada rota — sem alteração de comportamento.
- Nenhuma mudança em banco, autenticação, cotas ou pagamentos.
- Depois da publicação, previews antigos ficam em cache nas redes; para forçar atualização, usar o depurador de links de cada plataforma.
