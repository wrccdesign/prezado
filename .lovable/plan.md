# Esclarecer o resumo e as recomendações (e cuidar dos números)

## 1. Diagnóstico confirmado

Li o código de novo. As três observações estão certas:

- O esquema de resposta da análise não tem nenhum campo de valor financeiro. Os campos são `tipo_de_causa`, `resumo`, `pontos_fracos`, `fundamentacao_sugerida`, `legislacao_aplicavel`, `riscos_processuais`, `jurisdicao_competente`, `direcionamentos`, `portais_relevantes`, `complexidade`, `urgencia`, `prazo_estimado`, mais `itens_resolvidos` e `itens_mantidos`. Qualquer valor em dinheiro só pode aparecer solto dentro de um texto.
- O campo "Esclarecer este ponto" é montado por uma função que só é chamada dentro da lista de pontos fracos e da lista de riscos processuais. O bloco do Resumo mostra apenas o parágrafo, sem campo.
- **Recomendações Concretas tem o mesmo problema**: a lista é só numerada, sem nenhum campo de esclarecimento. Confirmado.

Um quarto ponto que o levantamento não mencionou e agrava tudo: na reanálise, o que é enviado de volta ao modelo é apenas a lista de riscos, a lista de pontos fracos e o tipo de causa. **O resumo anterior e as recomendações anteriores não são enviados.** Ou seja, mesmo que houvesse um campo de esclarecimento hoje, o modelo não teria o texto original ao qual a observação se refere. Isso precisa entrar junto.

## 2. O que será criado

Dois campos de esclarecimento no nível do bloco inteiro, não por frase:

- Um ao final do bloco **Resumo da Análise**: link discreto "Esclarecer o resumo", que abre uma caixa de texto.
- Um ao final do bloco **Recomendações Concretas**: link "Esclarecer as recomendações", idêntico em aparência.

Mesma aparência, mesmo tamanho de letra e mesmo comportamento dos campos já existentes (link discreto que vira caixa de texto; se já tem texto escrito, abre expandido). Limite de 1.500 caracteres, igual aos outros.

Textos de apoio dentro das caixas:
- Resumo: "Algo no resumo está impreciso? Aponte aqui, inclusive valores e cálculos."
- Recomendações: "Alguma recomendação não se aplica ao caso, ou algum valor está errado? Explique aqui."

O botão "Reanalisar com meus esclarecimentos" passa a contar esses dois campos junto com os demais, então escrever só no resumo já libera a reanálise. A frase de contagem acima do botão passa a somar os dois.

## 3. Atenção a números na rodada de refinamento

Sim, faz sentido, e é barato: entra só quando é refinamento, não polui a primeira análise. Texto exato a inserir na regra da rodada:

> ATENÇÃO A VALORES: se a rodada anterior citou qualquer número, valor em dinheiro, percentual, índice de correção, prazo em dias ou data, e o usuário apontou erro ou trouxe dado novo, recalcule a partir do dado do usuário e do texto atual. Não repita o número anterior por inércia. Se o texto não permite chegar a um valor confiável, diga isso de forma explícita em vez de estimar. Quando apresentar um valor, indique de onde ele saiu (trecho do texto, dado informado pelo usuário ou norma aplicável).

## 4. Detalhes técnicos

**`supabase/functions/analyze-legal-text/index.ts`**
- Novos campos opcionais no corpo: `esclarecimento_resumo` e `esclarecimento_direcionamentos`, texto livre, limitados a 1.500 caracteres pela função de corte já existente. Valor inválido é ignorado em silêncio, como os demais.
- `analise_anterior` passa a aceitar também `resumo` (até 3.000 caracteres) e `direcionamentos` (lista de textos, até 20 itens de 600 caracteres). Campos ausentes continuam funcionando.
- O bloco de iteração ganha duas seções, cada uma renderizada só se houver esclarecimento correspondente: o texto anterior do resumo (ou das recomendações) seguido da observação do usuário, com a instrução de reescrever o trecho pertinente e explicar a mudança no próprio resumo, sem criar campo novo de saída.
- A regra da rodada recebe o parágrafo de atenção a valores da seção 3.
- Nenhuma mudança no esquema de saída: sem campo novo, sem risco na rodada 1, histórico antigo intacto.

**`src/components/AnalysisResult.tsx`**
- Duas novas propriedades opcionais: valores e alteradores dos dois esclarecimentos de bloco.
- A função que monta o campo de esclarecimento ganha parâmetros de rótulo e texto de apoio, para ser reaproveitada nos dois blocos novos sem duplicar código.
- Campo posicionado ao final do conteúdo do bloco do Resumo e ao final do bloco de Recomendações, dentro do mesmo cartão.
- A contagem que habilita o botão de reanálise passa a incluir os dois.

**`src/pages/Index.tsx`**
- Dois estados novos, guardados junto com o restante na memória da aba (a mesma chave já usada), para sobreviver a recarregar a página.
- Na reanálise, envia os dois campos e acrescenta `resumo` e `direcionamentos` ao bloco da análise anterior.
- Ao concluir a reanálise, os dois campos são limpos junto com os demais.

**Sem mudança de banco, sem mudança de cota.** A reanálise continua consumindo a mesma regra de refinamentos incluídos no plano.

## 5. Limite honesto desta mudança

Isso faz o modelo reconsiderar o número quando o usuário aponta o erro. Não faz o sistema calcular valor: não há campo estruturado nem conferência de cálculo. Se você quiser que a análise produza valores conferíveis (com memória de cálculo, como nas calculadoras), isso é uma etapa separada e maior, que envolveria criar um campo estruturado de valores e ligá-lo ao motor de correção monetária já existente. Vale decidir depois, com esta etapa já no ar.
