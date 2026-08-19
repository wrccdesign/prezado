# Refinar hierarquia visual, espaçamento e responsividade da página de Análise

Escopo: apenas `src/pages/Index.tsx` (rota `/`). Nenhum texto, rota, função, chamada de IA ou tabela é alterada. Cores continuam vindo dos tokens existentes (primary, muted, gold/navy via tema).

## O que muda

**Cabeçalho da página**
- Título com a fonte serifada da marca (Playfair, já global em h1) e escala mais clara: `text-2xl sm:text-3xl lg:text-4xl`, com subtítulo em `max-w-2xl` para melhor ritmo de leitura.
- Espaçamento vertical padronizado (`py-8 sm:py-12`), evitando o salto atual entre mobile e desktop.

**Card de entrada**
- Hierarquia interna: título do card em peso maior e descrição em uma linha separada com espaçamento consistente; `space-y-5` no conteúdo em vez de `space-y-4` para respirar melhor.
- Textarea: altura responsiva (`min-h-[180px] sm:min-h-[240px]`) e `text-sm sm:text-base` para leitura confortável no mobile de 430px.

**Barra de ações (upload / progresso / arquivo)**
- No mobile os controles passam a empilhar em largura total (`w-full sm:w-auto`), eliminando quebras irregulares.
- A barra de progresso ocupa a linha inteira abaixo do botão no mobile, em vez de disputar espaço lateral.
- O chip do nome do arquivo ganha truncamento (`truncate max-w-full`) para nomes longos não estourarem a largura.

**Botão principal**
- Continua largura total, mas com destaque maior de hierarquia (fica visualmente como única ação primária, o upload permanece secundário/outline).

**Bloco de preview do texto extraído**
- Espaçamentos internos e área de rolagem ajustados (`max-h-[240px] sm:max-h-[320px]`), avisos com melhor separação.

**Tela de resultado (mesmo arquivo)**
- Mesmo ritmo de espaçamento e escala tipográfica do título, para as duas telas parecerem a mesma página.

## Componentes compartilhados

`AppHeader`, `AppFooter`, `LegalDisclaimer`, `AnalysisResult`, `Card`, `Button` são usados em várias páginas — **não serão alterados**. Todo o ajuste fica em classes utilitárias dentro de `Index.tsx`.

## Validação

Após implementar, verifico via Playwright em 430x786 (mobile) e 1280x900 (desktop) com screenshots, e relato exatamente o que foi modificado.
