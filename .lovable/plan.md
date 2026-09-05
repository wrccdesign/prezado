# Lote 1 — grounding verificável (auditoria antes de implementar)

## Achado que muda a prioridade do lote

A `search_decisions_vector` exige `d.ementa IS NOT NULL AND length(d.ementa) >= 50`. No acervo atual:

| Métrica | Linhas |
|---|---|
| total em `decisions` | 6.467 |
| com `embedding` | 6.466 |
| com `ementa` >= 50 caracteres | 47 |
| com `embedding` **e** `ementa` >= 50 | 46 |
| com `resumo_ia` >= 50 caracteres | 6.447 |
| com `resultado` preenchido | 2.497 |

Ou seja: a busca vetorial de grounding só enxerga 46 de 6.467 linhas (0,7%). O bloco com aspas vazias que você viu é o sintoma; a causa é dupla — o filtro da RPC e o mapeamento só de `ementa` no `grounding.ts`. A `search_decisions` (texto) já aceita `ementa OU resumo_ia`, então hoje quase todo grounding que funciona vem do fallback de texto.

Consequência para o plano: a Parte A precisa de uma migração na RPC vetorial, não só de mudança em TypeScript.

---

## PARTE A — Grounding com substância

**(a) O que já existe que não estava no seu levantamento**
- Ambas as RPCs já retornam todos os campos que você quer (`resumo_ia`, `resultado`, `resultado_descricao`, `temas_juridicos`, `tipo_decisao`, `source_url`). `orgao_julgador` só existe em `search_decisions`, não na vetorial.
- Ambas já excluem resultados de tramitação (`Em andamento`, `Distribuição` etc.) e decisões anteriores a 2015.
- `Diagnostico.tsx` já renderiza `citations` em "Fontes consultadas" (linhas ~505-545) e já as inclui no export via `buildDiagnosticoSections`, seção "Fontes consultadas" (linhas ~219-231) — `exportDocument.ts` é genérico (`ExportSection[]`), não conhece citação; não precisa mudar.
- `AnalysisResult.tsx` não recebe `citations` hoje.

**(b) Arquivos e RPCs**
- Migração: recriar `search_decisions_vector` com (i) `(ementa >= 50 OR resumo_ia >= 30)` no lugar do filtro só de ementa, (ii) novo parâmetro `only_julgados boolean DEFAULT false` que aplica `resultado IS NOT NULL`, (iii) `orgao_julgador` na saída. Parâmetro no fim e com DEFAULT mantém `search-jurisprudencia` e `chat-juris` funcionando sem alteração. Mesmo tratamento para `search_decisions` (`filter_only_julgados boolean DEFAULT NULL` como último argumento).
- `supabase/functions/_shared/grounding.ts`: ampliar `GroundingDecision`, mapear os campos novos, `buildGroundingBlock` usa `ementa ?? resumo_ia` e sempre imprime `resultado` e `temas_juridicos`.
- `supabase/functions/generate-petition/index.ts`: `onlyJulgados=true` na etapa `precedentes` e no modo rápido.
- `supabase/functions/diagnostico-juridico/index.ts`: mantém `false`, passa a devolver em cada citação um campo `natureza: "julgado" | "processo_relacionado"`.
- `src/pages/Diagnostico.tsx`: rótulo por item na lista e no texto exportado.

**Filtro na RPC ou no cliente:** na RPC. Filtrar depois da busca com `match_count` inflado degrada silenciosamente (a inflação é chute e o `LIMIT` é aplicado antes do filtro no banco), e como só 39% das linhas têm `resultado`, o resultado real seria instável. Com DEFAULT no parâmetro não há quebra de chamador.

**(c) Riscos de regressão**
- Recriar a RPC vetorial altera também `search-jurisprudencia` e `chat-juris`: passarão a ver 6.4k linhas em vez de 46. Ganho de recall, mas o texto exibido em Jurisprudência precisa cair para `resumo_ia` quando não há ementa — verificar `Jurisprudencia.tsx` antes de publicar.
- `resumo_ia` é texto gerado por IA. Injetá-lo como fonte no prompt exige rotulá-lo no bloco como "resumo gerado a partir dos metadados oficiais", senão o modelo passa a citar resumo como se fosse ementa.
- `DROP FUNCTION` + `CREATE` com assinatura nova: usar `CREATE OR REPLACE` não funciona ao adicionar parâmetro; é preciso `DROP FUNCTION ... (assinatura antiga)` na mesma migração, com GRANT de EXECUTE refeito.

**(d) Migrações:** 1 (recriação das duas RPCs + grants).

---

## PARTE B — Súmulas verificadas

**(a)** Não existe nada de súmulas no projeto: sem tabela, sem função, sem seed. `ingest-datajud` é o padrão de admin-only a copiar. `generateQueryEmbedding` existe em `_shared/embeddings.ts` (Voyage `voyage-law-2`, 1024 dims — a coluna `embedding` de `sumulas` precisa da mesma dimensão de `decisions`, a confirmar na migração).

**(b)** Migração com `sumulas` (+ GRANT SELECT para `anon`/`authenticated`, GRANT ALL para `service_role`, RLS com leitura pública e escrita só service role), índice único `(tribunal, tipo, numero)`, índice HNSW; RPC `search_sumulas_vector`; nova função `supabase/functions/ingest-sumulas/index.ts` + entrada em `supabase/config.toml`; `grounding.ts` ganha `fetchSumulas`.

**Confirmação pedida:** `chat-juris` usa `fetchGroundingContext` + `buildGroundingBlock` (linhas 138-144) e recebe a seção de súmulas automaticamente. `chat-decisao` **não** usa grounding: monta o contexto de uma decisão específica lida direto da tabela (linhas 33-68) — fica de fora. `analyze-legal-text` não injeta jurisprudência, só o dicionário estático de leis.

**(c) Riscos**
- Tabela vazia até você popular. Com zero linhas, a regra "só cite as listadas" na prática proíbe qualquer súmula — mudança de comportamento visível nas respostas. Aceitável e desejável, mas convém subir o seed no mesmo dia.
- Prompt cresce: com 3 súmulas o bloco ganha ~600 tokens por requisição em diagnóstico, petição e chat.

**(d) Migrações:** 2 (tabela + grants + RLS; RPC).

---

## PARTE C — Verificação pós-geração

**(a)** Não existe nada equivalente. `src/lib/citation.ts` formata, não verifica. Testes Deno seguem `custas-engine.test.ts` (std 0.224 `assertEquals`).

**(b)** `supabase/functions/_shared/citation-check.ts` (`extractCitations` pura + `verifyCitations`), `citation-check.test.ts`, retorno `citation_report` em `generate-petition` e `diagnostico-juridico`, bloco de UI em `PetitionResult.tsx` e `AnalysisResult.tsx`.

**(c) Riscos**
- Falso "não localizado": o acervo tem 6.4k processos de uma fatia do Judiciário. Um número CNJ correto que não esteja no banco seria marcado como não encontrado. Mitigação de texto: usar "não localizado no nosso acervo", nunca "inexistente" ou "inválido".
- Regex de artigo é ruidosa ("art. 5º, II" , "arts. 186 e 927"). Como artigo fica `nao_verificavel` nesta fase, um erro de extração só afeta a contagem exibida — manter a contagem discreta e não somar artigos no número de "verificados".
- `verifyCitations` adiciona 1-2 consultas ao banco por geração. Sem custo de IA.

**(d) Migrações:** nenhuma.

---

## Respostas diretas

- **RPCs suportam filtro por `resultado`?** Não. Nenhuma tem o parâmetro; as duas apenas excluem status de tramitação. Assinatura proposta sem quebra: parâmetro booleano com DEFAULT no fim da lista, chamadores atuais intactos.
- **`citations` chega ao PDF?** Sim, em `src/pages/Diagnostico.tsx`, `buildDiagnosticoSections`, seção "Fontes consultadas" (linhas ~219-231), consumida por `exportToPDF`/`exportToDOCX`. O rótulo Julgado / Processo relacionado precisa ser aplicado lá e na lista da tela.
- **Onde mais se monta prompt com jurisprudência?** `diagnostico-juridico` (bloco de grounding, 4 decisões), `chat-juris` (bloco de grounding, 5 decisões), `generate-petition` (bloco próprio de precedentes, 3 a 5), `chat-decisao` (uma decisão inteira, incluindo `full_text` e `resumo_ia`, sem grounding). `analyze-legal-text` não usa decisões.
- **Custo de embedding:** zero chamada a mais por requisição, se `fetchSumulas` receber o vetor já calculado por `fetchGroundingContext` em vez de gerar o seu. Implementado de forma ingênua seriam +1 chamada Voyage por requisição em diagnóstico, petição e chat. A verificação pós-geração não usa embedding.

---

## Ordem de execução sugerida

1. Parte A migração (RPCs) e `grounding.ts` — destrava 6.4k linhas hoje invisíveis. Publicar e conferir Jurisprudência e diagnóstico antes de seguir.
2. Parte A prompts, `onlyJulgados` na petição, rótulos na tela e no export.
3. Parte C (`citation-check` + testes + `citation_report` + UI) — independente da Parte B; artigos e súmulas não encontradas já ficam sinalizados.
4. Parte B (tabela, RPC, `ingest-sumulas`, seção no bloco), seguida do seed.

## Estimativa de arquivos

| Parte | Migrações | Edge functions | Frontend | Testes |
|---|---|---|---|---|
| A | 1 | 3 | 2 a 3 | 0 |
| B | 2 | 2 + config.toml | 0 | 0 |
| C | 0 | 3 | 2 | 1 |

Cerca de 16 arquivos, 3 migrações.
