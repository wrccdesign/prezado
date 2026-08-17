# Calculadoras Jurídicas — Mapeamento dos sites de referência e quick wins

## O que já existe no Prezado.ai

Atualmente temos **4 calculadoras** implementadas:

1. **Rescisão Trabalhista** — verbas rescisórias (saldo, férias, 13º, aviso, FGTS).
2. **Pensão Alimentícia** — estimativa com base na renda.
3. **Correção Monetária e Juros** — índices oficiais do BCB/SGS (IPCA, INPC, IGP-M, Selic, Taxa Legal) + regime da Lei 14.905/2024, pró-rata, multa, honorários, memória mês a mês, export PDF/Word.
4. **Prazo Processual** — feriados nacionais/estaduais/forenses, recesso forense, distinção disponibilização × publicação, matéria cível/penal/trabalhista, export .ics.

Nenhuma calculadora foi removida nas últimas atualizações — apenas substituímos taxas estimadas por dados oficiais.

## O que os sites de referência têm

### PrazoFácil (prazofacil.com.br)
- Prazo Processual com **município, tribunal e vara** em cascata.
- Distinção **processo físico vs. eletrônico**.
- Correção Monetária com índices históricos (INPC, IGP-M, IPCA, IPCA-E, ORTN, SELIC, TR, Poupança) e juros simples/compostos.
- Central de Juros/Financiamento e operações com datas.
- Utilitários: validador de CPF/CNPJ, gerador de QR Code, conversor de áudio.
- Informativos dos tribunais (feriados, instabilidades, mudanças de prazo).

### DrCalc (drcalc.net)
- Correção Monetária com dezenas de índices históricos (IGP-DI, CUB, Cesta Básica, TR, ORTN etc.).
- **Débito Judicial** com Lei 14.905/2024 (similar à nossa Correção Monetária).
- **Desapropriação** (correção + juros de indenização).
- Cálculos financeiros: PRICE, SAC, SACRE, SFH, série de pagamentos.
- **Câmbio/Moedas** (conversão de moedas estrangeiras).
- Operações com datas e conversores diversos.
- Cadastro/login para salvar planilhas (.htm).

## O que falta no Prezado.ai (gaps)

| # | Gap | Referência | Esforço | Impacto |
|---|-----|-----------|---------|---------|
| 1 | Prazo Processual não usa município/tribunal/vara (campos já existem no backend) | PrazoFácil | Baixo | Alto |
| 2 | Correção Monetária não oferece juros compostos nem mais índices históricos | DrCalc/PrazoFácil | Médio | Alto |
| 3 | Não há validador de CPF/CNPJ | PrazoFácil | Baixo | Médio |
| 4 | Não há calculadora de operações com datas (diferença, soma, decimal) | PrazoFácil/DrCalc | Baixo | Médio |
| 5 | Não há calculadora de juros/PRICE/SAC/SFH | DrCalc | Médio | Médio |
| 6 | Não há calculadora de desapropriação | DrCalc | Médio | Baixo/Médio |
| 7 | Não há conversor de moedas | DrCalc | Baixo | Médio |
| 8 | Não há página de informativos/feriados dos tribunais | PrazoFácil | Médio | Alto (SEO) |
| 9 | Não há landing pages SEO individuais para cada calculadora | Ambos | Baixo | Alto (SEO) |

## Plano — Quick wins primeiro

### Fase 1 (quick wins — backend já pronto ou baixo esforço)

#### 1.1 Aprimorar Prazo Processual
- Expor no frontend os campos que o backend `calcular-prazo` já aceita: `codigo_ibge` (município), `tribunal` e `vara/unidade`.
- Adicionar toggle **processo físico vs. eletrônico** e ajustar a data de publicação conforme o tipo.
- Adicionar seletor em cascada: UF → Município → Tribunal → Vara.
- Criar seed de feriados **municipais** e **forenses** para os principais tribunais (TJs, TRFs, TRTs) — reaproveitar tabela `feriados` existente.

#### 1.2 Aprimorar Correção Monetária
- Adicionar toggle **juros simples vs. compostos**.
- Expandir índices disponíveis: IPCA-E, TR, Poupança (já temos IPCA, INPC, IGP-M, Selic, Taxa Legal).
- Adicionar campo de **data de citação** para cálculo de débito judicial puro.

#### 1.3 Nova calculadora: Validador de CPF/CNPJ
- Componente simples com validação algorítmica client-side.
- Exportar resultado formatado / desformatado.

#### 1.4 Nova calculadora: Operações com Datas
- Diferença entre datas, soma/subtração de dias, conversão dias → anos/meses/dias.
- Útil para prescrição, decadência e prazos administrativos.

#### 1.5 SEO — Landing pages por calculadora
- Criar rotas públicas: `/calculadoras/prazo-processual`, `/calculadoras/correcao-monetaria`, `/calculadoras/rescisao-trabalhista`, `/calculadoras/pensao-alimenticia`.
- Cada uma com título, descrição, H1, JSON-LD `SoftwareApplication` e link para a calculadora interativa.
- Atualizar `sitemap.xml` e `robots.txt`.

### Fase 2 (médio esforço)

#### 2.1 Calculadora de Juros / PRICE / SAC / SFH
- Nova calculadora com abas: juros simples/compostos, PRICE, SAC, SACRE.
- Cálculo local + tabela amortização exportável PDF/Excel.

#### 2.2 Calculadora de Desapropriação
- Correção monetária + juros de indenização (regra específica da desapropriação).
- Pode reaproveitar motor da Correção Monetária com índices adicionais.

#### 2.3 Conversor de Moedas
- Integração com BCB/SGS ou API de câmbio para conversão histórica.
- Reaproveitar infra de sincronização de índices.

### Fase 3 (SEO e conteúdo)

#### 3.1 Página de Informativos / Feriados dos Tribunais
- Listar feriados forenses, instabilidades e mudanças de prazo por tribunal.
- Pode usar `tj_scraping_config` e `feriados` como base.

#### 3.2 Conteúdo educativo
- Criar páginas-guia: "Como calcular correção monetária na Lei 14.905/2024", "Como contar prazo processual", etc.
- Linkar com as calculadoras correspondentes.

## Fora de escopo inicial

- QR Code, conversor de áudio e utilitários não-jurídicos (baixa prioridade).
- Sistema de cadastro para salvar planilhas (depende de decisão de produto/engajamento).

## Ordem de execução sugerida

1. Fase 1.1 — Prazo Processual com município/tribunal/vara.
2. Fase 1.2 — Correção Monetária com juros compostos + índices extras.
3. Fase 1.3 — Validador CPF/CNPJ.
4. Fase 1.4 — Operações com Datas.
5. Fase 1.5 — Landing pages SEO.
6. Fase 2 — Calculadoras financeiras (PRICE/SAC, desapropriação, câmbio).
7. Fase 3 — Informativos e conteúdo.

## Como testar

- Verificar se os campos de município/tribunal aparecem corretamente no Prazo Processual.
- Conferir cálculo com feriado municipal/forense conhecido.
- Testar exportação .ics, PDF e Word.
- Validar landing pages no Google Rich Results Test e verificar canonical/og tags.
