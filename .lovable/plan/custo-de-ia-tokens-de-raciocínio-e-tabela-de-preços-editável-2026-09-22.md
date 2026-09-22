# Custo de IA: tokens de raciocínio e tabela de preços editável

Dois ajustes sobre o registro de consumo já em produção.

## 1. Tokens de raciocínio

Hoje o registro guarda só entrada e saída. O Google cobra os tokens de raciocínio como saída, então o custo atual sai subestimado nos modelos que raciocinam.

- Passar a ler o campo de tokens de raciocínio devolvido pela API em cada chamada (incluindo o total do fluxo em tempo real) e gravá-lo em uma coluna própria.
- Somar raciocínio aos tokens de saída no cálculo do custo.
- Mostrar o número separado no quadro de consumo, para ficar claro quanto do gasto vem de raciocínio.

## 2. Preços em tabela, não no código

- Nova tabela de preços por modelo: nome do modelo, preço de entrada e preço de saída por milhão de tokens em dólar, vigência e observação. Preenchida com os valores da página oficial de preços do Gemini.
- O cálculo passa a consultar essa tabela; se um modelo não estiver cadastrado, a chamada é registrada com custo zero e marcada como "modelo sem preço", visível no admin.
- O custo é gravado em dólar. A conversão para reais acontece só na exibição, usando uma cotação configurável.
- Tela no admin para editar os preços e a cotação, com uma linha por modelo. Só administrador vê e altera.

## 3. O que muda no quadro de consumo

Colunas por função: chamadas, falhas, tokens de entrada, tokens de saída, tokens de raciocínio, custo em dólar e custo em reais pela cotação do momento. Aviso no topo quando houver chamadas com modelo sem preço cadastrado.

## Fora de escopo

Pagamentos, cotas de uso, textos do site e conteúdo jurídico. Nenhuma alteração de modelo usado por função.

## Detalhes técnicos

- Migração: coluna `reasoning_tokens` e `cost_usd` em `ai_usage` (mantendo `cost_brl` já existente para histórico); nova tabela `ai_model_prices` (model, input_usd_per_mtok, output_usd_per_mtok, effective_from, notes) com GRANT para `authenticated`/`service_role`, RLS de leitura para autenticados e escrita apenas para admin via `has_role`; nova tabela ou linha de configuração para a cotação USD/BRL editável.
- `supabase/functions/_shared/ai.ts`: remover `PRICE_USD_PER_MTOK` e `USD_BRL`; carregar preços da tabela com cache em memória por instância; extrair `completion_tokens_details.reasoning_tokens` (e equivalente no chunk final do stream); custo = entrada×preço_in + (saída+raciocínio)×preço_out, gravado em `cost_usd`.
- `ai_usage_summary`: agregar `reasoning_tokens` e `cost_usd`, sinalizar modelos sem preço.
- `src/pages/AdminIngestao.tsx`: novas colunas no quadro e seção de edição de preços e cotação.
- Preços iniciais carregados de ai.google.dev/gemini-api/docs/pricing para os quatro modelos em uso (gemini-3.6-flash, gemini-3.5-flash, gemini-3.5-flash-lite, gemini-3.1-flash-lite).
