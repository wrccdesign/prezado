# Custo da IA: levantamento e proposta

## 1. Modelo usado hoje por função

Dois níveis definidos em um único lugar (`_shared/ai.ts`), com troca automática de modelo só quando o Google recusa por sobrecarga:

- Nível principal: `gemini-3.6-flash` (reserva `gemini-3.5-flash`)
- Nível leve: `gemini-3.5-flash-lite` (reserva `gemini-3.1-flash-lite`)

| Função | Nível hoje |
|---|---|
| scrape-esaj | principal |
| scrape-tj-proprio | principal |
| scrape-tj-fallback | leve |
| ingest-datajud | leve |
| search-jurisprudencia | leve |
| parse-document (leitura de arquivo) | leve |
| analyze-legal-text | leve nas palavras-chave, principal na análise |
| generate-petition | leve nas palavras-chave, principal na redação |
| diagnostico-juridico | principal |
| chat-juris, chat-decisao | principal |

Ou seja: duas das três funções de coleta já usam o modelo mais caro sem necessidade.

## 2. Frequência e volume da coleta

Há um agendamento ativo: segunda-feira, 04:00 UTC (01:00 em São Paulo), fase 2. Não há agendamento da fase 1.

Por execução: 8 tribunais, uma chamada de IA por tribunal, até 5 decisões pedidas em cada. Teto de 40 decisões e 8 chamadas de IA por semana, mais as reservas quando o Google recusa. O texto enviado é cortado em 25 mil caracteres por chamada, então a entrada é previsível: da ordem de 6 a 8 mil tokens por chamada, saída pequena.

O custo semanal da coleta é baixo. O que consome de verdade é o uso dos clientes (análise, petição, chat), não o cron.

## 3. Registro de consumo

A tabela `ai_usage` já grava, por chamada: função de origem, modelo usado, tokens de entrada, tokens de saída, usuário, ambiente e data. Isso atende ao que você pediu.

Falta o que permite ler custo sem cruzar tabelas na mão:
- Nível pedido (principal ou leve), para ver quando a reserva entrou em ação.
- Sucesso ou falha, com o código do erro. Hoje a chamada que falha não gera linha nenhuma, então uma semana inteira de erro aparece como consumo zero.
- Duração da chamada.
- Custo estimado em reais, calculado a partir dos tokens e de uma tabela de preço por modelo.

Proposta: acrescentar essas colunas e um card em administração com consumo por função e por dia dos últimos 30 dias.

## 4. Flash-Lite na coleta

Concordo, e é a mudança de maior efeito imediato: passar `scrape-esaj` e `scrape-tj-proprio` do nível principal para o leve, junto com `search-jurisprudencia` e `ingest-datajud`, que já estão lá. Extração de campos de uma ementa é tarefa estruturada, guiada por esquema fixo; não é redação.

Ficam no nível principal, sem mudança: redação de petição, análise jurídica, diagnóstico e os dois chats.

Risco a controlar: o modelo leve pode extrair menos campos ou errar formato. Por isso a troca vem com uma comparação antes de virar padrão: mesma consulta, mesmos tribunais, uma execução em cada nível, comparando número de decisões extraídas e campos preenchidos (número do processo, data, relator, ementa). Se o leve empatar, fica; se perder, volta ao principal só nas funções em que perdeu.

## Ordem de execução

1. Migração da `ai_usage` com as colunas novas e registro das falhas.
2. Troca de nível nas duas funções de coleta.
3. Execução comparativa entre os dois níveis e relatório do resultado no chat.
4. Card de consumo em administração.

Nada de pagamento, cota, texto do site ou conteúdo jurídico é tocado. Prompts e esquemas de extração ficam idênticos.

## Detalhes técnicos

Arquivos: `supabase/functions/_shared/ai.ts` (registro de falha, nível, duração, custo), `scrape-esaj/index.ts` e `scrape-tj-proprio/index.ts` (`model: "light"`), nova migração em `supabase/migrations` para as colunas de `ai_usage` (mantendo RLS e acesso apenas por serviço), e uma seção nova em `src/pages/AdminIngestao.tsx`.
