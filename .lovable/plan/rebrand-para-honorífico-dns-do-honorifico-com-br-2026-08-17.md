# Rebrand para Honorífico + DNS do honorifico.com.br

## 1. DNS (você faz no registrador)

Os 4 registros abaixo ainda não existem — por isso o domínio está parado há ~3h e a Paddle reprovou a revisão.

| Tipo | Nome | Valor |
|---|---|---|
| A | `honorifico.com.br` (ou `@`) | `185.158.133.1` |
| TXT | `_lovable.honorifico.com.br` (ou `_lovable`) | `lovable_verify=4937a588b8d69c3fad29878ee433e60e0c1973c4fc6dc66bd50d9d6abd4cf5f0` |
| A | `www.honorifico.com.br` (ou `www`) | `185.158.133.1` |
| TXT | `_lovable.www.honorifico.com.br` (ou `_lovable.www`) | `lovable_verify=65a2ffcb270a373417ccbcef5c144e44735a1389b7cfa3e6a13a54633d4f7001` |

Depois da propagação o domínio fica Active e o site pode ser reenviado à Paddle.

## 2. Novo logo

- Subir as duas versões enviadas como assets do projeto: versão preta (para fundo claro) e versão branca (para fundo escuro).
- Criar um componente `Logo` que escolhe a variante conforme o fundo/tema, garantindo contraste WCAG AA (marca dourada + texto preto sobre claro; marca dourada + texto branco sobre escuro).
- Aplicar em: cabeçalho (`AppHeader`), rodapé (`AppFooter`), landing page, páginas legais e telas de auth.
- Atualizar `alt` de todas as imagens para "Honorífico".
- Gerar novo favicon a partir do símbolo "H" e substituir o atual.

## 3. Texto do site

Substituir toda menção a "Prezado.ai" / "Prezados.AI" pelo novo nome **Honorífico** (~153 ocorrências), nos arquivos:

- Frontend: LandingPage, AppHeader, AppFooter, Auth, Chat, Diagnostico, Petition, Planos, Conta, History, Jurisprudencia, Calculators, Comparativo, ModelosMinutas, MinutaDetalhe, LawyerDashboard, Index, ResetPassword, PetitionResult, LegalPageLayout, SEO, calculadoras.
- Páginas legais: Termos, Privacidade, Reembolso (mantendo "Wrcc Design" / CNPJ como entidade vendedora).
- Dados: `src/data/minutas.ts`.
- Backend (prompts das edge functions): chat-decisao, chat-juris, generate-petition, analyze-legal-text — o assistente passa a se apresentar como Honorífico.
- SEO/estáticos: `index.html` (title, description, og/twitter), `sitemap.xml`, `robots.txt`, `llms.txt`, JSON-LD (nome da organização).

URLs em canonical/og/sitemap continuam em `prezado.lovable.app` até o domínio ficar ativo; troco para `https://honorifico.com.br` num segundo passo, assim que o DNS propagar (evita canonical apontando para domínio morto).

## 4. Fora do escopo agora

- Renomear o slug `prezado.lovable.app` (opcional — posso fazer se quiser).
- Reenviar à Paddle: só depois do domínio Active.

## Detalhes técnicos

- Logos via `lovable-assets` (pointer `.asset.json`), exceto o favicon, que vai como arquivo real em `public/`.
- Componente `src/components/Logo.tsx` com prop `variant="auto" | "light" | "dark"`, usando tokens do design system (sem cores hardcoded).
- Substituições de texto feitas por revisão arquivo a arquivo, não `sed` cego, para não quebrar identificadores como `office_logo_url` nem chaves de storage.
