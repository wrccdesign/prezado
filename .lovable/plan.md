# Reestruturação do /comparativo

Avaliação da proposta e plano de execução. A proposta é defensável e reduz risco jurídico: sai o subjetivo ("Preço acessível", "100% Brasileiro"), entra o verificável.

## a) Riscos técnicos e de SEO

Estado atual verificado:
- `src/seo/routeMeta.ts` tem entrada para `/comparativo`: título "Comparativo de ferramentas — Honorífico" e descrição citando JusBrasil, Advbox e assistentes generalistas. `ogImage` é o padrão (TODO de OG própria).
- O `<SEO />` da página passa título/descrição próprios, mas `SEO.tsx` dá precedência ao `routeMeta`, então o que vale no HTML estático e no runtime é o do `routeMeta`.
- `src/seo/faqData.ts` não tem entrada para `/comparativo`.
- `public/sitemap.xml` já lista a rota; nada muda ali.

Riscos e o que muda junto:
- Manter a URL e não mexer no `title`/`description` do `routeMeta` mantém o histórico de indexação. Se ajustarmos a descrição para refletir as novas categorias, é mudança pequena e segura; o título pode permanecer.
- Nomear concorrentes em texto de página é comparação factual e continua permitido, desde que cada célula descreva um fato público ou uma limitação genérica. Para reduzir exposição: os cabeçalhos de coluna são categorias, com o exemplo entre parênteses, e as células sobre terceiros descrevem a categoria, não a empresa.
- Corrigir a linha errada (Jus IA linka o acervo do próprio Jusbrasil, não o CNJ) é obrigatório.
- Sem FAQ na página, nenhum JSON-LD novo. Se quiser, dá para adicionar depois; não faz parte deste plano.
- `scripts/check-jsonld.mjs` não cobre `/comparativo`, então nada quebra lá.

## b) Extrair `fonteRows` para componente compartilhado

Sim, vale. `fonteRows` hoje vive dentro de `LandingPage.tsx` com cinco linhas e a nota "coluna da esquerda é ilustrativa". Duplicar em duas páginas garante divergência futura.

Objeção única: o componente deve aceitar props para título, parágrafo e o link final, porque a home encerra com "Consultar processos" e o comparativo pode não querer o mesmo. Dados (`fonteRows`) e marcação da tabela ficam dentro; contexto vem de fora.

## c) Células que o código sustenta

Verificado no código:
- Origem do precedente CNJ/DataJud: sustentado (consulta processual e ficha do hero usam registro real com `source_url`).
- Link para conferir na fonte: sustentado ("Ver no tribunal" / "Ver fonte no CNJ").
- Diz quando não encontra decisão: sustentado pela regra de grounding já aplicada.
- Cálculo com série oficial do Banco Central e memória de cálculo: sustentado (séries SGS, `CorrecaoCalc`, `CustasCalc`).
- Petição a partir dos fatos: sustentado (`generate-petition`, fluxo em etapas).
- Exportação em PDF e Word: sustentado nos dois casos. `PetitionResult.tsx` exporta PDF (jsPDF) e DOCX (docx, com timbre), e a memória de cálculo exporta PDF e DOCX por `src/lib/exportDocument.ts`. Ou seja, a célula pode dizer "petição e memória de cálculo em PDF e Word".

Ressalvas de redação, não de fato:
- Nas colunas de terceiros, evitar afirmar ausência categórica. Usar formulações de categoria: "não se aplica", "sem vínculo com registro oficial do Judiciário", "acervo próprio da plataforma". São descrições de categoria, não auditoria de produto.
- Uma célula que eu não sustentaria como está: qualquer afirmação sobre o que ChatGPT, Claude ou Gemini fazem hoje com plugins ou navegação. A linha "origem do precedente" para IA generalista deve dizer "vem do modelo, sem registro oficial vinculado", sem prometer que nunca acessam nada.

## d) Arquivos tocados

Estimativa: 4.

1. `src/components/FonteTable.tsx` (novo) — dados `fonteRows` e tabela, com props de título, parágrafo, nota e link opcional.
2. `src/pages/LandingPage.tsx` — remove `fonteRows` e o markup da tabela, passa a usar `FonteTable`.
3. `src/pages/Comparativo.tsx` — reescrita: `AppHeader`, fundo creme, tabela de 4 colunas por categoria com células em texto, segunda seção com `FonteTable`, CTA final em navy "Comece pelo caso que está na sua mesa agora.", `AppFooter`. Remove hero com gradiente, botões pill, ícones de status, "Nossos Diferenciais" e o botão de compartilhar.
4. `src/seo/routeMeta.ts` — ajuste apenas da descrição de `/comparativo` para refletir as categorias. Título mantido.

Sem mudanças em cobrança, autenticação, cálculos, sitemap ou JSON-LD.

## Validação

`bunx tsgo --noEmit`, `bun run build` (26 rotas) e screenshot de `/comparativo` contra a checklist da seção 5 do project knowledge.
