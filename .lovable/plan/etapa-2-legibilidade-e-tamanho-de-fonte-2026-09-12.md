# Etapa 2: legibilidade e tamanho de fonte

## Diagnóstico

O contraste já está adequado e não será alterado. O problema confirmado é tipográfico: conteúdo jurídico que exige leitura contínua aparece repetidamente em 12px e 14px.

A busca em `src/` encontrou:

| Classe | Tamanho atual | Ocorrências |
|---|---:|---:|
| `text-xs` | 12px | 112 |
| `text-sm` | 14px | 303 |
| **Total** |  | **415, em 82 arquivos** |

A contagem considera cada classe encontrada. Uma expressão responsiva como `text-xs sm:text-sm` entra uma vez em cada linha correspondente.

## Classificação por contexto

### A. Conteúdo que precisa ser lido

São os usos prioritários. Devem ficar em 16px, com altura de linha entre 1.6 e 1.7 quando houver texto contínuo.

Os arquivos com maior concentração confirmada são:

| Prioridade | Arquivo | Ocorrências pequenas no arquivo | Conteúdo afetado |
|---:|---|---:|---|
| 1 | `src/components/AnalysisResult.tsx` | 29 | resumo da análise, pontos, riscos, motivos, próximos passos e avisos jurídicos |
| 2 | `src/pages/Diagnostico.tsx` | 22 | explicação do caso, direito aplicável, custos, competência, urgência e citações |
| 3 | `src/components/petition/PeticaoStepperFlow.tsx` | 13 | ementas, resumos de precedentes e prévia da petição |
| 4 | `src/pages/Index.tsx` | 14 | texto extraído do documento, instruções e erros relevantes; a prévia está em 12px |
| 5 | `src/pages/MinutaDetalhe.tsx` | 6 | o corpo inteiro da minuta está em 14px |
| 6 | `src/pages/Jurisprudencia.tsx` | 9 | resumos de decisões e mensagens importantes |
| 7 | `src/pages/DecisaoDetalhe.tsx` | 8 | conversa sobre a decisão e metadados; ementa e resumo principal já usam 18px |
| 8 | `src/components/PetitionResult.tsx` | 2 | o corpo editável da petição está em 14px |

Outros casos relevantes aparecem em `History.tsx`, `CustasCalc.tsx`, `Conta.tsx` e `AdminIngestao.tsx`. Exemplos confirmados incluem texto integral de documento em 12px, justificativa de isenção em 14px e mensagens de erro em 12px.

### B. Rótulos e metadados secundários

A maior parte das 415 ocorrências pertence a este grupo: badges, datas, contadores, nomes de abas, legendas curtas, navegação, rodapé e controles. Aqui 14px continua aceitável, mas `.text-note` passará a 15px para melhorar a leitura geral. Os componentes compartilhados de botão, tabela, menu e badge não serão aumentados indiscriminadamente na primeira passagem, pois têm impacto amplo.

### C. Micro-labels onde 12px é defensável

`text-xs` permanece apenas quando o texto é curto, auxiliar e não contém informação jurídica que precise ser lida em sequência. Casos aceitáveis:

- número dentro de marcador circular;
- artigo de lei dentro de badge;
- selo curto, como estado ou destaque do plano;
- contador compacto;
- copyright e nota legal breve;
- comando auxiliar curto, como “ver mais”.

O rótulo de etapa em `PeticaoStepperFlow.tsx` hoje usa até 11px. Embora compacto, ele orienta o fluxo e não é micro-label puro. Deve subir para pelo menos 13px no padrão e ser verificado no celular.

## Escala tipográfica proposta

O projeto usa a escala padrão do navegador, com raiz de 16px. `text-xs` corresponde a 12px, `text-sm` a 14px e `text-base` a 16px. A escala editorial própria já mantém ementas e corpo serifado em 18px.

| Papel | Antes | Depois | Altura de linha | Regra de uso |
|---|---:|---:|---:|---|
| Micro-label | 11–12px | 12–13px | 1.35–1.4 | somente marcador, badge, contador e nota mínima |
| Nota e metadado | 14px | 15px | 1.5 | `.text-note`, legenda e metadado que precisa ser compreendido |
| Conteúdo curto | frequentemente 14px | 16px | 1.55–1.6 | descrição, item de análise, erro relevante e instrução |
| Conteúdo longo sans | 14–16px | 16px | 1.65 | diagnóstico, análise, petição editável e texto extraído |
| Conteúdo longo serif | 18px / 1.6 | 18px / 1.65 | 1.65 | ementa, decisão, fundamentação e leitura editorial |
| Título de bloco | frequentemente 16px | 18px | 1.3–1.35 | sobe junto para não empatar com o corpo de 16px |
| H3 | 20px / 1.3 | 20px / 1.3 | 1.3 | mantém distinção sobre títulos de bloco |
| H2 | 28–32px / 1.15 | 28–32px / 1.2 | 1.2 | mantém tamanho; abre levemente a entrelinha |
| H1 | 36–44px / 1.1 | 36–44px / 1.1 | 1.1 | mantém |
| Display da home | 40–56px | 40–56px | 1.05 | mantém |

A mudança principal não é aumentar tudo. É separar conteúdo de interface: conteúdo passa ao piso de 16px; notas passam a 15px; apenas micro-labels permanecem em 12–13px. Títulos de bloco que hoje têm 16px sobem para 18px, evitando que o novo corpo de 16px elimine a hierarquia.

## Controle A / A / A

**Recomendação: vale implementar nesta etapa.** Para advogados e magistrados mais velhos, o benefício é direto e maior que tentar encontrar um único tamanho ideal para todos.

A implementação é viável sem refatorar toda a aplicação porque quase toda a tipografia e o espaçamento usam `rem`. O controle pode aplicar uma classe no elemento `html`, persistida em `localStorage`:

| Nível | Raiz | Equivalência do corpo de 16px |
|---|---:|---:|
| Padrão | 100% | 16px |
| Grande | 106.25% | 17px |
| Maior | 112.5% | 18px |

O nível salvo deve ser aplicado antes da primeira renderização para evitar mudança visível ao abrir a página. O controle global pode ficar no menu de acessibilidade do cabeçalho, com três opções claramente nomeadas e estado selecionado acessível por teclado e leitor de tela.

**Esforço estimado:** pequeno para o mecanismo, cerca de meio a um dia; de um a dois dias adicionais para revisão visual das telas prioritárias nos três níveis e em celular/desktop. O trabalho total da etapa tende a 2–3 dias.

**Limite técnico:** alterar a raiz amplia também medidas em `rem`, como espaços, alturas e ícones. Isso ajuda a interface a acompanhar o texto, mas exige revisão visual. Valores literais em pixels, como o rótulo de 11px do stepper e a lateral fixa de 380px da decisão, não acompanham a escala e precisam de tratamento pontual. PDF e DOCX exportados não mudam, pois usam medidas próprias de documento.

## Ordem de aplicação por impacto

1. **Base tipográfica:** elevar `.text-note`, criar a altura de linha de leitura longa e preparar o controle A / A / A.
2. **Análise:** `Index.tsx` e `AnalysisResult.tsx`. Corrigir resultado, texto extraído, campos de esclarecimento e erros relevantes.
3. **Diagnóstico:** elevar todos os blocos narrativos e as citações, preservando badges como metadados.
4. **Petição:** `PetitionResult.tsx`, `PeticaoStepperFlow.tsx` e `MinutaDetalhe.tsx`. Priorizar o texto editável, a minuta e as ementas usadas na geração.
5. **Jurisprudência:** `Jurisprudencia.tsx` e `DecisaoDetalhe.tsx`. Manter o corpo serifado de 18px, elevar notas necessárias e revisar o painel de conversa.
6. **Passagem secundária:** histórico, calculadoras, conta e mensagens operacionais relevantes.
7. **Componentes compartilhados:** somente depois da revisão das telas, ajustar defaults de botão, tabela ou badge se ainda houver problema. Isso evita alterações globais sem necessidade.

## Verificação visual obrigatória

Testar cada tela prioritária em Padrão, Grande e Maior, no celular e no desktop.

- **Tabelas:** confirmar rolagem horizontal controlada, cabeçalhos legíveis, valores monetários inteiros e nenhuma coluna sobreposta.
- **Badges:** verificar quebra de linha, altura, textos jurídicos longos e alinhamento com ícones.
- **Botões:** conferir rótulos sem corte ou transbordamento, especialmente “Baixar PDF”, “Baixar DOCX” e ações de reanálise.
- **Stepper:** conferir nomes das etapas, círculos, conectores, estado ativo e uso em telas estreitas.
- **Ementas e resumos:** revisar `line-clamp-3` e `line-clamp-4`, pois a fonte maior mostra menos conteúdo antes das reticências.
- **Texto extraído:** conferir a prévia com documentos extensos, nomes longos e rolagem interna.
- **Petição e minuta:** confirmar largura de leitura, altura do campo, rolagem e ausência de linhas excessivamente longas.
- **Análise e Diagnóstico:** verificar listas, avisos, cartões lado a lado e títulos de bloco após o corpo subir para 16px.
- **Decisão:** conferir a lateral fixa de 380px no desktop e o painel de 75vh no celular.
- **Navegação:** verificar cabeçalho, menus, abas e rodapé nos três níveis.
- **Foco em 200%:** confirmar navegação por teclado, foco visível e ausência de conteúdo encoberto ou inacessível.
- **Persistência:** selecionar cada nível, recarregar, trocar de rota e confirmar que a escolha permanece sem salto visual.

## Escopo da implementação futura

A etapa altera apenas tipografia, altura de linha, controle de tamanho e correções de layout diretamente causadas pelo aumento. Não muda cores, conteúdo jurídico, documentos exportados, regras de negócio ou estrutura das telas.
