# Cota da reanálise: o modelo mais justo e escalável

## A prática do mercado

Produtos de IA por assinatura cobram a **tarefa**, não cada ida e volta dentro dela. Refinar o mesmo caso é a mesma tarefa: o usuário não deve pagar por ter discordado de um apontamento. Cobrar cada rodada cria um incentivo errado (o usuário evita corrigir) e foi exatamente o que fez o advogado migrar para o concorrente.

Do outro lado, reanálise é chamada de IA real e precisa de teto, senão vira porta de abuso.

## Recomendação: cota por caso, com rodadas incluídas

Uma análise = 1 unidade de cota, e ela já inclui um número de reanálises do mesmo caso:

| Plano | Análises por mês | Reanálises incluídas por análise |
|---|---|---|
| Gratuito | 3 | 1 |
| Profissional | 40 | 5 |
| Escritório | 150 | 10 |

Regras:

- A reanálise só é gratuita quando é do mesmo caso, na mesma sessão de trabalho.
- Passando das rodadas incluídas, a próxima reanálise consome 1 unidade de análise e a contagem de rodadas recomeça. Nada trava de forma abrupta: o usuário é avisado antes.
- A trava de rajada por hora, que já existe, continua valendo e é o que protege contra uso automatizado.
- Nova análise, com texto diferente, sempre consome 1 unidade, como hoje.

Por que esta é a escolha certa aqui: é justa (o erro de calibração da nossa IA não custa ao usuário), é previsível (o custo continua amarrado a casos por mês, que é o que o usuário entende) e é escalável (o teto de custo por caso é conhecido: no pior cenário, 6 chamadas no Profissional).

### O que o usuário vê

No bloco de reanálise: "Refinamentos deste caso: 1 de 5 incluídos". Ao esgotar: "As próximas reanálises deste caso contam como uma nova análise."

## Alternativas descartadas

- **Cada rodada custa 1**: hoje é assim. No Gratuito o usuário tem 3 rodadas na vida útil do mês, então nem chega a experimentar o refinamento. Foi a causa do problema relatado.
- **Reanálise ilimitada**: custo aberto e sem defesa, com o modelo mais caro do produto.
- **Cota separada "reanalise"**: mais um número para o usuário entender e mais uma linha em todos os painéis de consumo, sem ganho real de justiça.

## Detalhes técnicos

- `supabase/functions/_shared/rate-limit.ts`: adicionar `ANALISE_FREE_ROUNDS: Record<plan, number>` junto de `PLAN_LIMITS`, exportado para reuso.
- `supabase/functions/analyze-legal-text/index.ts`: o `checkRateLimit("analise", ...)` passa a ser condicional. Quando o corpo traz `analise_anterior` e `rodada <= 1 + rodadas incluídas do plano`, a chamada não grava em `usage_tracking` (mas a trava de rajada continua sendo verificada). Acima disso, cobra normal. A resposta passa a devolver `rodadas_incluidas` e `rodadas_usadas` para a interface.
  - Anti-abuso sem tabela nova: a contagem de rodadas vem do cliente, então o servidor limita o valor de `rodada` (já sanitizado, teto 10) e exige `analise_anterior` não vazia; a trava por hora impede repetição em massa.
- `src/pages/Index.tsx`: guarda `rodada` (já implementado) e repassa o contador para o resultado.
- `src/components/AnalysisResult.tsx`: texto "Refinamentos deste caso: X de Y incluídos" e aviso quando a próxima rodada passa a consumir cota.
- `src/pages/Planos.tsx` e a tabela de limites: incluir a linha "reanálises incluídas por caso".
- Sem migração de banco. `usage_tracking` continua registrando só o que é cobrado.

## Ordem de execução

1. Constante de rodadas incluídas em `rate-limit.ts`.
2. Cobrança condicional e novos campos de resposta em `analyze-legal-text`.
3. Contador e avisos na interface do resultado.
4. Linha nova na tabela de planos.
5. Teste manual: três rodadas seguidas no Gratuito e no Profissional, conferindo o consumo em Conta.
