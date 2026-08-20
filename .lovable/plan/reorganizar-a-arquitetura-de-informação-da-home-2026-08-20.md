# Reorganizar a arquitetura de informação da home

Escopo: `src/pages/LandingPage.tsx` e `src/pages/calculators/CorrecaoMonetariaLanding.tsx`. Nada de lógica de calculadora, cotas, preços, pagamentos ou autenticação. `/planos` não é tocada. `LegalDisclaimer` permanece.

## 1. Faixa de prova compacta (substitui duas seções)

Saem as seções `id="fonte"` ("De onde vem o número") e "Lei 14.905/2024". Entra, logo abaixo da calculadora e ainda dentro do bloco cream, uma faixa de uma linha, `text-sm`, sem título e sem `py-20`, com três sinais separados por divisores:

- Séries oficiais do SGS/Banco Central
- Sincronizadas diariamente
- Lei 14.905/2024 aplicada, inclusive o mês de transição

No fim da faixa, link discreto "Como calculamos" → `/calculadoras/correcao-monetaria-juros-lei-14905`. No mobile a faixa empilha, sem divisores.

O texto longo da Lei 14.905/2024 (corte de 30/08/2024, mês de transição pro rata die, Res. CMN 5.171/2024, art. 406 §3º, art. 389 parágrafo único) e o parágrafo das séries com os códigos SGS (433, 188, 189, 4390, 29543) migram para a página dedicada da calculadora. Hoje essa página só passa `title/description/keywords/features` para o `CalculatorLanding`; o `CalculatorLanding` já aceita uma prop `content` para conteúdo editorial abaixo de "Como funciona" — os dois parágrafos entram por ali, sem alterar o componente.

## 2. Memória de cálculo: demonstrar em vez de descrever

Seção `id="memoria"` mantida, com `py-16` em vez de `py-20/24`. O parágrafo descritivo encolhe para uma frase e o peso vai para o artefato: um fragmento estático de tabela com 3 linhas (mês, índice, variação, fator acumulado, saldo corrigido), no formato visual da memória real, mais os dois botões de exportação (PDF e Word) mostrados como o produto os apresenta. É demonstração visual — os botões dentro da amostra não disparam exportação; quem exporta de verdade é a calculadora acima, que já tem o gancho de conta.

Sai o botão "Calcular agora" desta seção (permanece no hero e no CTA final).

## 3. Seção nova "Do fato ao fundamento" (substitui "E também")

Posição: depois da memória de cálculo, antes dos planos. Fundo navy, tipografia serif no display, gold nos marcadores — sem cores novas.

Estrutura: quatro etapas numeradas em sequência horizontal no desktop (conectadas por uma linha fina em gold, não cards com ícone em cima e parágrafo embaixo) e verticais no mobile. Ao lado da sequência, um trilho paralelo em gold/10 para o Chat, marcado como algo que atravessa as quatro etapas — não é um quinto card.

Redação verificada contra o que cada edge function realmente devolve:

| Etapa | Texto | Rota | Confere com |
|---|---|---|---|
| 1. Diagnóstico | "Descreva o caso em linguagem comum e receba o enquadramento jurídico, em texto sem jargão." | `/diagnostico` | `diagnostico-juridico`: prompt exige linguagem 100% acessível, saída estruturada, só cita jurisprudência do nosso banco |
| 2. Análise de documentos | "Cole a petição ou a decisão e veja pontos fracos, riscos processuais e a fundamentação que faltou." | `/analisar` (rota real confirmada na implementação) | `analyze-legal-text`: pontos fracos, fundamentação sugerida, riscos processuais, recomendações |
| 3. Consulta processual | "Consulte andamentos e decisões por tribunal, com o número CNJ." | `/jurisprudencia` | `search-jurisprudencia`: busca híbrida + consulta ao vivo; visitante vê 3 resultados |
| 4. Petição | "Informe fatos e pedidos; a peça sai montada, com a fundamentação inferida a partir do que você descreveu." | `/peticao` | `generate-petition`: infere fundamentos a partir de fatos/pedidos, estrutura fixa, só cita precedentes do banco |
| Chat (trilho) | "Tire dúvidas de legislação e jurisprudência em qualquer etapa." | `/chat` | `chat-juris`: resposta em streaming sobre legislação/jurisprudência |

Nenhuma dessas frases promete além do que a função entrega — não há ressalva pendente. Cada etapa é um link para a rota real (usuário deslogado cai no fluxo de auth já existente das rotas protegidas).

Restrição respeitada: essa é a única seção com tratamento elaborado; nenhuma animação nova nas outras.

## 4. Navegação do topo

`navSections` passa de `Calcular · Fonte dos dados · Memória de cálculo · Planos` para `Calcular · Recursos · Memória de cálculo · Planos`, com "Recursos" ancorando em `#recursos` (a seção nova). O menu mobile usa o mesmo array, então acompanha automaticamente.

## 5. Hero

Título e subtítulo inalterados. A linha de apoio passa a ser: "Sem cadastro para calcular. Petições, análise e diagnóstico na conta."

## Verificação

Typecheck, testes e captura de tela da home em desktop e mobile como visitante anônimo, conferindo a faixa compacta, a amostra de memória e o alinhamento do trilho do chat.
