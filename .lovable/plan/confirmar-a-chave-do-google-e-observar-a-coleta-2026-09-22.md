# Confirmar a chave do Google e observar a coleta

A chave nova é de um projeto com faturamento ativo, e a coleta de teste já voltou a extrair decisões. Falta apenas confirmar que não sobrou nenhum sinal de nível gratuito e acompanhar uma execução completa.

## O que fazer

1. Ler os registros das funções de coleta e de análise procurando qualquer menção a limite de nível gratuito ou a chave inválida. Se aparecer, aviso e abro o formulário seguro para trocar a chave.
2. Disparar uma coleta completa de teste e conferir, no registro de execuções, quantas decisões entraram por tribunal.
3. Se ainda houver tribunais com zero decisões por sobrecarga do Google, registrar quais foram e propor a próxima medida (espera maior entre tribunais ou coleta em horário de menor demanda).

## Fora de escopo

Pagamentos, cotas, textos do site e banco de dados permanecem intocados. Nenhuma alteração de modelo de IA nem de prompts.

## Detalhes técnicos

Leitura de `edge_function_logs` de `scrape-esaj`, `scrape-tj-proprio` e `scrape-tj-fallback`; consulta a `cron_ingest_log` pela execução mais recente. As tentativas já estão em três por modelo, com esperas de 2, 6 e 12 segundos e limite de 60 segundos por chamada.
