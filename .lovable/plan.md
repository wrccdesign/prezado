# Redesign da hero da home

## Objetivo
Destacar a chamada "Dê-me os fatos, eu te dou o direito." / "Narre os fatos, eu te darei o direito" na hero da página inicial, mantendo o minimalismo e respeitando os tokens fixos do Honorífico (cores HSL, Source Serif 4 / Source Sans 3, container de 1120px, sem animações de entrada).

## Ritual de redesign

### 1. Capturar a hero atual
Screenshot do estado atual da hero em desktop (1280px) e mobile (375px) para servir de referência visual.

### 2. Travar o gosto visual com três opções
Apresentar três direções de tratamento tipográfico/composicional para a headline, todas dentro do design system:

- **A. Enfase por escala e medida** — headline em tamanho display maior, quebra em três linhas forçadas, medida ajustada para leitura confortável, espaço negativo generoso acima e abaixo.
- **B. Enfase por contraste de peso e cor** — primeira frase em navy, segunda frase em gold (o único elemento dourado da viewport além do CTA), mantendo o mesmo tamanho display.
- **C. Enfase por bloco tipográfico** — headline como bloco sólido alinhado à esquerda, com uma linha vertical gold fina à esquerda da headline, separando visualmente o título do restante do conteúdo.

As cores, fontes e raio permanecem travados. As três direções variam apenas em hierarquia, ênfase e composição.

### 3. Gerar e apresentar protótipos
Criar três protótipos renderizados da hero com cada direção. O usuário escolhe uma.

### 4. Implementar a direção escolhida
Aplicar a escolha em `src/pages/LandingPage.tsx`, ajustando:
- classes do H1 e parágrafo abaixo;
- espaçamentos internos da hero;
- relação entre coluna de texto e ficha de decisão à direita;
- responsividade (mobile e desktop).

Não alterar outras seções da home, nem o SEO do topo do arquivo.

### 5. Verificar
- `bun run build` sem erros.
- Screenshot da hero em desktop e mobile confirmando que a chamada se destaca e não quebra estranho.
- `bun run check:seo` continua passando.
