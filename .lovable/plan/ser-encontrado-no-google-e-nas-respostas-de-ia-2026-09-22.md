# Ser encontrado: no Google e nas respostas de IA

## O que a pesquisa mostra (dados Semrush, mercado Brasil)

Demanda por "IA jurídica", por mês:

| Busca | Volume | Dificuldade |
|---|---|---|
| minuta ia | 33.100 | não medida |
| juridico ai | 22.200 | não medida |
| jus ia | 18.100 | não medida |
| jusbrasil ia | 8.100 | não medida |
| ia para advogados | 3.600 | alta (62) |
| ia juridica | 2.900 | alta (65) |
| chatgpt juridico | 1.600 | baixa (23) |
| inteligencia artificial juridica | 720 | alta (65) |

Quase todo o volume de "IA jurídica" no Brasil é marca: as pessoas procuram o produto do Jusbrasil ("jus ia", "minuta ia"). Disputar isso de frente é caro e lento.

Demanda por problema concreto, onde o Honorífico já tem página:

| Busca | Volume | Dificuldade |
|---|---|---|
| jurisprudencia | 27.100 | média (46) |
| calculo rescisão trabalhista | 14.800 | baixa (26) |
| petição inicial modelo | 2.400 | baixa (26) |
| calculadora correção monetária | 2.400 | média (45) |
| modelo de petição | 1.600 | baixa (29) |

Aqui há volume alto com concorrência baixa, e o site já tem a ferramenta que responde. É por aqui que se entra.

O Semrush ainda não tem dados do honorifico.com.br, o que é normal em domínio novo com pouca autoridade. O Search Console confirma: 1 página indexada, 23 na fila.

Sobre as IAs: as perguntas do tipo "qual a melhor IA jurídica" têm volume pequeno na busca (40/mês), mas é exatamente esse tipo de pergunta que as pessoas fazem ao ChatGPT e ao Claude. Aparecer na resposta depende de duas coisas: existir uma página que compare opções com critério, e existir muita citação do nome em sites que os modelos leem.

## Estratégia em uma frase

Ganhar tráfego pelas ferramentas (cálculo, modelo, jurisprudência), e usar esse tráfego para construir a autoridade que faz o nome aparecer quando alguém pergunta a uma IA qual ferramenta jurídica usar.

## Plano

### Rodada 1, capturar quem já busca ferramenta

Páginas novas, cada uma com resposta no topo, ferramenta funcionando, base legal citada e perguntas frequentes:

- Calculadora de rescisão: desdobrar em páginas por situação (demissão sem justa causa, pedido de demissão, acordo do art. 484-A, justa causa, término de contrato de experiência). São as buscas de verdade dentro dos 14.800.
- Correção monetária: páginas por índice (IPCA, INPC, IGP-M, Selic, Taxa Legal) e por uso (débito judicial, aluguel, contrato).
- Modelos de minuta: cada página ganha o modelo visível na íntegra, não só a descrição.
- Jurisprudência: páginas por tema com decisões reais já no acervo, com link para a fonte.

### Rodada 2, as páginas que a IA cita

- `/comparativo` reescrito como comparação honesta e datada: o que cada tipo de ferramenta faz, quando cada uma serve, incluindo os casos em que o Honorífico não é a escolha. IA cita quem compara com critério, não quem se elogia.
- `/glossario` com verbetes curtos e definidos, cada um ligado à calculadora ou modelo do tema.
- "Sobre os dados": origem de cada índice, frequência de atualização, como conferir. É a página que sustenta a frase "cita a fonte ou diz que não encontrou".
- Uma página por pergunta que as pessoas fazem às IAs: "o que é IA jurídica", "IA jurídica alucina?", "posso usar ChatGPT para petição?".

### Rodada 3, ser legível pelas IAs

- `llms.txt` e `llms-full.txt` atualizados a cada rodada, com as páginas novas, datas e as respostas em si.
- Dados estruturados completos: identidade da empresa, perguntas frequentes em todas as páginas, passo a passo de cálculo nas calculadoras, trilha de navegação.
- Resumo citável no topo de cada página: duas a três linhas que respondem a pergunta e podem ser copiadas inteiras por um modelo.
- Sitemap com data real de alteração em todas as rotas, e páginas de decisão entrando no mapa.

### Rodada 4, autoridade fora do site

Sem menção externa, nenhuma IA aprende o nome. Frentes, por ordem de retorno:

- Perfil no Reddit (r/brasil, r/advocacia), respondendo a dúvidas reais de cálculo com o link da calculadora. Os modelos leem Reddit intensamente.
- Verbetes e respostas em fóruns jurídicos e no Quora em português.
- Ficha nos diretórios de ferramentas de IA (nacionais e internacionais).
- Um estudo próprio por trimestre, com dado que só o Honorífico tem (por exemplo, divergência entre tribunais na aplicação da Lei 14.905). Dado original é o que gera link.

### Medição

Mensal: páginas indexadas e cliques no Search Console; posição das palavras da tabela acima; e um teste manual perguntando ao ChatGPT, Claude, Perplexity e Gemini "qual a melhor IA jurídica brasileira" e "como calcular correção monetária pela Lei 14.905", anotando se o Honorífico aparece.

## Detalhes técnicos

- Páginas novas seguem o padrão já existente: entrada em `src/seo/routeMeta.ts`, texto em `src/seo/routeContent.ts` (injetado no HTML pelo plugin do build, legível sem JavaScript), componente reaproveitando `CalculatorLanding` ou `MinutaDetalhe`.
- Dados estruturados pelo caminho `jsonLd` já usado; sem tocar em `SEO.tsx`.
- `public/sitemap.xml`, `public/llms.txt` e `public/llms-full.txt` atualizados ao fim de cada rodada.
- Sem alteração em banco, pagamentos, autenticação, cotas, cores ou tipografia.

## Ordem sugerida

Rodada 1 primeiro, uma família de páginas por vez (rescisão, depois correção, depois modelos, depois jurisprudência). Rodadas 2 e 3 na sequência. A rodada 4 é trabalho contínuo, fora do código, e posso preparar os textos.
