# Fase 4, último lote: planos e calculadoras

Inventário do que existe hoje e proposta de execução. Nada de lógica de cálculo, fonte oficial ou gate de exportação muda.

## 1. Arquivos no escopo

Páginas
- `src/pages/Planos.tsx` (461 linhas)
- `src/pages/Calculators.tsx` (101)
- `src/pages/calculators/CorrecaoMonetariaLanding.tsx`, `PrazoProcessualLanding.tsx`, `CustasTjspLanding.tsx`, `RescisaoTrabalhistaLanding.tsx`, `PensaoAlimenticiaLanding.tsx`, `CpfCnpjLanding.tsx`, `OperacoesDatasLanding.tsx` (53 a 106 linhas cada)

Componentes
- `src/components/calculators/CalculatorLanding.tsx` (moldura de todas as landings)
- `src/components/calculators/CorrecaoCalc.tsx`, `CustasCalc.tsx`, `PrazoCalc.tsx`, `PensaoCalc.tsx`, `RescisaoCalc.tsx`, `DateCalc.tsx`, `CpfCnpjCalc.tsx`
- `src/components/calculators/shared/ResultCard.tsx`, `StepIndicator.tsx`, `MemoriaList.tsx`, `CurrencyInput.tsx`, `GuestExportGate.tsx`

Não existe página "Como calculamos" no código; nenhuma rota com esse nome em `src/seo/routeMeta.ts`. O papel dela hoje é o bloco "Como funciona" dentro de `CalculatorLanding`.

## 2. Ocorrências por arquivo

Contagem por padrão (Card, Badge, uppercase, tracking-wider, font-bold, font-semibold, rounded-full, gradiente, bg-primary, bg-navy, text-white, dark:, animate-, seta, travessão, "advogado", "cidadão"):

```text
arquivo                          Card Bdg upp trk bold semi pill grad bgpri navy white dark anim seta trav adv cid
Planos.tsx                         5   2   0   0   3    5    0    0    1    0     0    0    1    0    6   2   0
Calculators.tsx                    7   0   0   0   1    2    0    0    2    0     0    0    0    2    1   0   0
CalculatorLanding.tsx              8   0   0   0   1    3    1    0    2    0     0    1    0    2    2   1   1
CorrecaoCalc.tsx                   6   0   1   0   1    1    0    0    1    0     0    3    1    0    5   0   0
CustasCalc.tsx                     6   0   0   0   0    0    0    0    0    0     0    0    2    3    6   0   0
PrazoCalc.tsx                      4   0   0   0   1    0    0    0    0    0     0    4    1    0    3   0   0
PensaoCalc.tsx                     4   0   0   0   1    2    0    0    2    0     0    1    0    0    3   0   0
RescisaoCalc.tsx                   2   0   0   0   2    0    0    0    1    0     0    2    0    0    1   2   0
CpfCnpjCalc.tsx                    2   0   0   0   0    1    0    0    0    0     0    3    0    0    0   0   0
DateCalc.tsx                       2   0   0   0   0    1    0    0    0    0     0    0    0    0    1   0   0
shared/ResultCard.tsx              2   0   1   0   1    0    0    0    1    0     0    0    0    0    1   0   0
shared/StepIndicator.tsx           0   0   0   0   0    0    1    0    2    0     0    0    0    0    0   0   0
shared/MemoriaList.tsx             0   0   0   0   0    0    0    0    0    0     0    0    0    0    1   0   0
shared/CurrencyInput.tsx           0   0   0   0   0    0    0    0    0    0     0    0    0    0    1   0   0
shared/GuestExportGate.tsx         0   0   0   0   0    0    0    0    0    0     0    0    0    0    1   0   0
CorrecaoMonetariaLanding.tsx       0   0   0   0   0    2    0    0    0    0     0    0    0    0    3   0   0
PrazoProcessualLanding.tsx         0   0   0   0   0    2    0    0    0    0     0    0    0    0    1   0   0
CustasTjspLanding.tsx              0   0   0   0   0    4    0    0    0    0     0    0    0    0    5   0   0
RescisaoTrabalhistaLanding.tsx     0   0   0   0   0    3    0    0    0    0     0    0    0    0    4   1   0
PensaoAlimenticiaLanding.tsx       0   0   0   0   0    3    0    0    0    0     0    0    0    0    5   0   0
CpfCnpjLanding.tsx                 0   0   0   0   0    2    0    0    0    0     0    0    0    0    3   1   0
OperacoesDatasLanding.tsx          0   0   0   0   0    2    0    0    0    0     0    0    0    0    2   0   0
```

Observações que a contagem não mostra
- Nenhum gradiente, nenhum `text-white`, nenhum `bg-navy` em qualquer arquivo do lote. Fundo de seção problemático é só `bg-primary`/`bg-primary/5`.
- `Calculators.tsx` usa grade de sete cards com ícone decorativo em quadrado colorido acima do título; é o caso mais claro de card repetido para conteúdo não comparável.
- `CalculatorLanding.tsx` concentra os piores tells: chips `rounded-full bg-primary/10` com as keywords de SEO, três cards laterais, `CheckCircle` ao lado de cada benefício, botão "Ver todas" com `ArrowRight`, `prose dark:prose-invert`, e o texto "para advogados, estudantes de Direito e cidadãos", que se dirige ao leitor pelo rótulo.
- `ResultCard.tsx` usa `uppercase tracking-wide` no rótulo e `font-bold` no valor: corrigir aqui conserta as sete calculadoras de uma vez.
- `StepIndicator.tsx` usa `rounded-full` em bolinhas de etapa; é sinal de progresso, será convertido para números com linha, sem pílula.
- `Planos.tsx` tem `animate-` (uma transição de entrada), `Badge` "Mais popular", ícones `Crown`/`Building2`/`User` ao lado do nome do plano e `—` dentro da própria tabela de features.
- Travessões nos textos de página são copy real (não só SEO) e entram na limpeza.

## 3. Travessões em SEO

- `src/seo/routeMeta.ts`: 29 ocorrências, quase todas no padrão `Título — Honorífico` e em descrições com aposto.
- `src/seo/faqData.ts`: 4 ocorrências, dentro de respostas.

Regra de substituição, sem mudar sentido: em título, `X — Honorífico` vira `X | Honorífico` (separador de marca já usado em parte das rotas) ou dois pontos quando for aposto explicativo; em descrição e resposta de FAQ, travessão vira vírgula quando é aposto, dois pontos quando introduz lista, ponto quando separa duas frases. Cada troca revisada uma a uma, mantendo o limite de 60 caracteres no título e 160 na descrição, e depois `bun run check:seo` e os testes de JSON-LD.

## 4. Riscos verificados

- Tabela de planos: os dados estão duplicados, não compartilhados. `src/pages/LandingPage.tsx` tem seu próprio `const plans` (nome, preço, features resumidas) e `src/pages/Planos.tsx` tem outro `const plans` mais o array `features` com as cotas por mês. Preço e cotas precisam ser conferidos entre os dois arquivos no mesmo prompt; a unificação em um módulo compartilhado é possível, mas fica fora deste lote para não misturar refatoração com visual.
- `GuestExportGate.tsx`: é um hook, não componente visual. Só lê `user` do `AuthContext` e dispara um toast com `ToastAction` para `/auth`. Nada a mudar além, no máximo, do texto do toast (contém um travessão). O gate em si fica intacto.
- Formulários shadcn: `Input`, `Select`, `Button`, `Table` já herdaram as fontes e o raio de 0.5rem da Fase 1, então tipografia e cantos já estão corretos sozinhos. Falta o que é classe local no arquivo: `Card` como moldura, `bg-primary/5` como fundo de bloco de resultado, `font-bold` no valor, rótulo em caixa alta, ícones ao lado de título e altura/contraste dos campos em fundo creme (hoje muitos campos herdam `bg-background` genérico em vez de branco com borda `cream-dark`).

## 5. Execução proposta

Quatro prompts, agrupados por semelhança:

1. Base compartilhada: `shared/ResultCard.tsx`, `shared/StepIndicator.tsx`, `shared/MemoriaList.tsx`, `shared/CurrencyInput.tsx`, texto do toast em `GuestExportGate.tsx`. Efeito imediato nas sete calculadoras.
2. Moldura e vitrine: `CalculatorLanding.tsx` e `Calculators.tsx`. Sai a grade de cards com ícone, entram lista e tabela; saem chips pílula, `CheckCircle`, seta e `prose dark:`; a frase "para advogados, estudantes e cidadãos" é reescrita falando da situação.
3. Corpo das sete calculadoras: `CorrecaoCalc`, `CustasCalc`, `PrazoCalc`, `PensaoCalc`, `RescisaoCalc`, `DateCalc`, `CpfCnpjCalc`. Remoção de `Card`, `dark:`, `animate-`, `font-bold`/`semibold` e travessão; tabela real onde hoje há lista de memória.
4. Planos e SEO: `Planos.tsx` (Card, Badge, ícones de plano, animação, travessões da tabela) mais os travessões de `routeMeta.ts` e `faqData.ts`, com `check:seo` e testes de JSON-LD ao final. As sete landings de calculadora, que só têm `font-semibold` em `h2` e travessões de copy, entram junto porque são edições de uma linha cada.

Ao final de cada prompt: typecheck, build, grep dos tells nos arquivos tocados e screenshot das rotas afetadas.

Estimativa de créditos: prompts 1 e 4 pequenos, 2 médio, 3 o maior (cerca de 2.150 linhas somadas). Ordem de grandeza total de 8 a 12 créditos, sendo o prompt 3 metade disso; se o orçamento apertar, o prompt 3 pode ser dividido em duas metades (Correção e Custas primeiro; Prazo, Pensão, Rescisão, Datas e CPF/CNPJ depois).
