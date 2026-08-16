# Calculadoras Jurídicas v2 — Correção Monetária oficial (BCB) e Prazo Processual v2

Substituir as taxas médias inventadas da Correção Monetária por índices oficiais do Banco Central e implementar o regime da Lei 14.905/2024. Depois, evoluir o Prazo Processual com feriados reais, matéria processual, recesso e distinção disponibilização × publicação.

## Parte 1 — Correção Monetária com dados reais

### 1.1 Tabela `indices_economicos`
Campos: `codigo_indice`, `data_ref` (1º dia do mês), `valor_percentual numeric(18,8)`, `fator numeric(20,10)`, `fonte` (default 'BCB/SGS'), `codigo_sgs`, `sincronizado_em`.
- UNIQUE (codigo_indice, data_ref) + índice (codigo_indice, data_ref)
- GRANT SELECT para `anon` e `authenticated`; GRANT ALL para `service_role`
- RLS ligado: policy de leitura pública; nenhuma policy de escrita (grava só via service role)

### 1.2 Edge function `sync-indices`
Consome o SGS público do BCB (sem chave), séries: 433 ipca, 188 inpc, 189 igpm, 4390 selic_mensal, 29543 taxa_legal.
- Paginação obrigatória em janelas de no máximo 10 anos (limite da API desde 26/03/2025)
- Backfill 01/01/1994 → hoje para preços/Selic; `taxa_legal` a partir de 30/08/2024
- Upsert por (codigo_indice, data_ref); nunca apaga histórico
- Falha de uma série não aborta as demais; 3 tentativas com backoff; retorna resumo por série (inseridos/atualizados/erros)
- Protegida por `requireServiceRole` (padrão de `_shared/auth.ts`), `verify_jwt = false` no config.toml
- Cron diário via `pg_cron`/`pg_net` (mesmo padrão de `cron-ingest`), mais um backfill inicial executado após o deploy

### 1.3 Edge function `calcular-atualizacao`
Entrada: valor, data_inicial, data_final, indice, pro_rata, regime_juros, taxa_juros_mensal, juros_data_inicial/final, multa_percentual, multa_incide_sobre_juros, honorarios_percentual. Validação com Zod; exige usuário autenticado.

Regime dividido em dois blocos somados:
- Até 29/08/2024 — correção pelo índice escolhido + juros conforme `regime_juros` (1% a.m. a partir de 11/01/2003; 0,5% a.m. antes)
- A partir de 30/08/2024 — correção pelo IPCA (série 433, art. 389 p.ú. CC) + juros pela Taxa Legal (série 29543, art. 406 §1º CC); mês com Taxa Legal negativa conta como zero (art. 406 §3º)

Ponto crítico travado por teste: a Taxa Legal (29543) é apurada com IPCA‑15 do mês anterior (Res. CMN 5.171/2024) e o art. 389 usa o IPCA cheio (433) — séries distintas, uma nunca deriva nem substitui a outra.

Correção = produtório de (1 + variação/100) mês a mês; `pro_rata` aplica proporção por dias nos meses parciais das pontas. Juros da Taxa Legal são simples, acumulados mês a mês, sem capitalização.

Retorno: totais + memória de cálculo linha a linha `{ mes_ref, indice_utilizado, variacao_percentual, fator_do_mes, fator_acumulado, saldo_corrigido, juros_do_mes, juros_acumulados, regime }`. Meses faltantes na base são devolvidos explicitamente em `meses_faltantes` — nunca estimar nem interpolar.

### 1.4 Componente `src/components/calculators/CorrecaoCalc.tsx`
Remover a implementação inline de `Calculators.tsx` e importar o novo componente no mapa `calcComponents`. Padrão visual dos demais (shadcn, igual a `PrazoCalc.tsx`).
- Campos: valor, datas, índice, pro‑rata, regime de juros, taxa fixa, datas próprias de juros (bloco colapsável), multa %, "multa incide também sobre os juros", honorários %
- Resultado: cards Valor Corrigido / Juros / Multa / Honorários / TOTAL + tabela expansível com a memória mês a mês
- Exportar memória em PDF/Word reaproveitando `src/lib/exportDocument.ts`
- Rodapé: fonte "Banco Central do Brasil (SGS)" com a data da última sincronização lida da tabela, e a base legal aplicada (arts. 389 e 406 do CC, redação da Lei 14.905/2024) — substitui o disclaimer de "taxas médias estimadas"
- Todo cálculo no servidor; o cliente só monta o payload e renderiza

## Parte 2 — Prazo Processual v2

### 2.1 Tabela `feriados`
Campos: `data`, `tipo` ('nacional'|'estadual'|'municipal'|'forense'), `uf`, `codigo_ibge`, `tribunal`, `descricao`, `fonte_normativa`, `created_at`. Índices em (data) e (uf, data). SELECT público; escrita só service role.
Seed: nacionais 2024–2028 (fixos + móveis pela mesma rotina de Páscoa já existente) e estaduais de SP, RJ, MG, RS, PR, BA, DF.

### 2.2 Edge function `calcular-prazo`
Entrada: data_referencia, tipo_data ('disponibilizacao'|'publicacao'), materia ('civel'|'penal'|'trabalhista'), dias, contagem, uf, codigo_ibge, tribunal.
- Disponibilização → publicação no primeiro dia útil seguinte (art. 224 §§2º/3º CPC; art. 4º §§3º/4º Lei 11.419/2006); contagem começa no dia útil seguinte à publicação
- Cível e trabalhista em dias úteis (art. 219 CPC; art. 775 CLT); penal em dias corridos
- Recesso 20/12–20/01 suspende prazo cível (art. 220 CPC); não se aplica ao penal
- Prorrogação para o primeiro dia útil seguinte (art. 224 §1º)
- Feriados consultados na tabela: nacionais + estaduais da UF + municipais do IBGE + forenses do tribunal
- Retorno: vencimento + lista de todos os dias excluídos com o motivo de cada um

### 2.3 Interface `PrazoCalc.tsx`
Adicionar seletor de UF, seletor de matéria e toggle explícito "disponibilização no DJe ou publicação?". Mantidos: export .ics com alarmes, aviso de conferência no tribunal, base legal. A tabela de "feriados nacionais no período" é substituída pela lista completa de dias excluídos com motivo. Cálculo passa a vir da edge function.

## Fora de escopo
Sem conversores, QR Code, câmbio, índices internacionais, PRICE/SAC, aluguéis. Sem alterações em auth, paywall, Paddle, jurisprudência, petições, schema existente, `RescisaoCalc` ou `PensaoCalc`.

## Ordem de execução
1. Migração `indices_economicos` → `sync-indices` + cron + backfill
2. `calcular-atualizacao` + teste do IPCA×Taxa Legal → `CorrecaoCalc.tsx`
3. Migração `feriados` + seed → `calcular-prazo` → UI do `PrazoCalc.tsx`
