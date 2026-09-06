# Diagnóstico: por que o bloco de verificação de citações não apareceu

## Resumo

Nada está quebrado na lógica de verificação. Ela funciona com o texto real. A causa provável é que, às 14:00:56 UTC, a versão publicada da função de petição ainda era a anterior à que passou a devolver o relatório de citações. A partir das 14:03 de hoje a função foi republicada e já contém o relatório, então uma nova petição deve mostrar o bloco. Isso ainda precisa ser confirmado com uma geração nova.

## Evidências, item por item

### 1. Logs das 14:00 a 14:02
Não existem. A base de logs só retém registros a partir de 14:07:19 de hoje (verificado agrupando por fonte: o registro mais antigo em qualquer fonte é 14:07:19). Não há nenhuma linha de `generate-petition` no período pedido, portanto não há como confirmar nem "buildCitationReport failed" nem "verifyCitations query failed" nem stack trace. Ausência de log aqui não é evidência de ausência de erro.

### 2. Versão implantada às 14:00:56
Não há histórico de deploy consultável. O que dá para afirmar:
- No código-fonte, `buildCitationReport` entra na função de petição no commit d7c9f0a, 05/09 23:18:24 UTC, e continua presente em todos os commits posteriores (fa05579 14:02:45 e a2c58cb 14:03:07 de hoje).
- Os commits de hoje 14:02–14:03 (súmulas) tocaram a função, ou seja, ela foi republicada depois da geração das 14:00:56.
- Os modelos usados na execução (`gemini-3.5-flash-lite` na extração de palavras-chave às 13:59:36 e `gemini-3.6-flash` na geração às 14:00:56) são idênticos nas duas versões candidatas, então não servem para distinguir qual estava no ar.

Conclusão por eliminação (ver item 5): como a lógica devolve 4 itens com o texto real e como nenhum caminho de erro consegue produzir `citation_report` nulo ou vazio nessa situação, a hipótese consistente é que a versão no ar às 14:00:56 ainda não retornava o campo.

### 3. Chamada antes do `return`
Correta e única. Na função de petição existe um só `return` de sucesso do estágio final, na linha 295, e a linha 293 imediatamente anterior chama `buildCitationReport`. Os `return` anteriores (linhas 147, 157, 165) são dos estágios de preparação (enquadramento, fundamentação, precedentes), que por definição não geram texto. O modo rápido (sem `approved_*`) e o modo em etapas convergem para o mesmo trecho final. A execução de hoje foi o modo rápido: houve chamada do modelo leve de extração de palavras-chave às 13:59:36, o que só acontece nesse modo.

### 4. Permissões de leitura
Sem bloqueio. `service_role` tem SELECT em `decisions` e em `sumulas` (confirmado por `has_table_privilege`). Em `decisions` há inclusive política pública de leitura; em `sumulas`, leitura liberada para anônimo e autenticado, escrita só para o sistema. A função usa a chave de serviço, que ignora RLS de qualquer forma.

### 5. Teste direto com o texto real
Executado localmente. A extração devolve exatamente 4 itens: o processo 08217539020248190209 e três artigos (`art. 14 da Lei nº 8.078/1990`, `art. 927 da Lei nº 10.406/2002`, `art. 6º, inciso VIII, da Lei nº 8.078/1990`). O relatório final fica: 1 verificado, 0 não encontrados, 3 não verificáveis, exatamente o esperado.

Observação: `art. 186` não é capturado isoladamente, porque a expressão exige que o artigo esteja colado à lei; ele aparece como "art. 186 e do art. 927 da Lei nº 10.406/2002" e só o segundo casa. Isso reduz de 4 para 3 os artigos citados, não afeta o aparecimento do bloco.

Confirmação no banco: a decisão 08217539020248190209 existe em `decisions` (TJRJ) e tem apenas resumo de metadados, sem ementa. A petição gravada às 14:00:56.761 contém esse número.

## Por que a hipótese de erro em tempo de execução não se sustenta

`buildCitationReport` só devolve nulo se algo lançar fora dos blocos internos. A consulta a `decisions` já está protegida por try/catch próprio: se ela falhasse, o relatório sairia com os 4 itens, o processo como "não localizado", e o bloco apareceria mesmo assim. E `items` vazio exigiria extração vazia, que o teste refuta. Ou seja, com a versão nova no ar o bloco apareceria em qualquer cenário de falha.

## Verificação que falta (uma única etapa, quando você autorizar)

Gerar uma petição nova agora, no mesmo caminho, e observar se o bloco aparece. Se aparecer, o caso está encerrado como defasagem de publicação. Se não aparecer, o próximo passo é ler os logs imediatamente após a geração, dentro da janela de retenção, procurando falha na montagem do relatório.

Nenhuma alteração de código foi feita.
