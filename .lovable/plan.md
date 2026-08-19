# Auditoria de veracidade da landing page

Nenhum arquivo de produto foi alterado. Abaixo o diagnóstico verificado em código e em banco.

## 1. O que é `datajud_fallback`

Origem única: `supabase/functions/scrape-tj-fallback/index.ts`.

- Linha 149: consulta real à API pública do CNJ — `https://api-publica.datajud.cnj.jus.br/{endpoint}/_search`, com busca por `assuntos.nome` e `classeProcessual.nome`.
- Linhas 206-217: monta `rawText` **apenas** com classe, número, tribunal, grau, órgão julgador, lista de `movimentos` e lista de `assuntos`.
- Linhas 222-244: envia esse texto ao Claude (`claude-sonnet-4`) com a tool `extract_metadata`, que preenche `resumo_ia`, `temas_juridicos`, `resultado` etc.
- Linha 284: grava `source: "datajud_fallback"`.

Conclusão: **não é seed nem dado sintético inventado do zero** — a base factual vem do CNJ. Mas o texto interpretativo (`resumo_ia`, `resultado`, `argumentos_principais`) é inferido por IA a partir de metadados de andamento, não de teor decisório.

## 2. DataJud entrega processo, não decisão — confirmado

A API pública do CNJ expõe metadados processuais (número, classe, assunto, órgão, movimentos CNJ). Não retorna ementa nem inteiro teor, e o código confirma isso: não há campo de teor no `rawText`, e o resultado é visível no banco.

Amostra real de `full_text` de um registro `datajud_fallback`:

```text
Processo: 81216773720238050001
Tribunal: TJBA
Grau: JE
Órgão Julgador: 2ª VSJE DA FAZENDA PÚBLICA (VESPERTINO)
Movimento (2023-09-13): Distribuição - sorteio: 2
Movimento (2023-11-14): Petição - Contestação: 45
```

E o `resumo_ia` correspondente descreve movimentação ("foi distribuído em 13/09/2023 e teve diversos movimentos, incluindo contestação, petições e conclusões").

**Chamar esses 6.352 registros de "jurisprudência" na landing page seria incorreto.** São consultas processuais enriquecidas.

## 3. `source_url` — pior do que o suspeitado

Há 6.421 URLs distintas e o `termo=` **está preenchido** com o número CNJ. O problema é outro: o domínio é sempre o STJ (linha 275 do fallback; mesma lógica em `ingest-datajud/index.ts` linha 107), mesmo para processos de TJRS, TJBA, TJPB, TJSE. Um processo estadual não existe na busca processual do STJ — o link abre, mas nunca encontra a decisão.

Opções:
- **(a) montar link real por tribunal** a partir do número CNJ: exige mapa de URL de consulta por tribunal (33 tribunais, padrões e-SAJ / PJe / Projudi / eproc diferentes, alguns com CAPTCHA). Esforço médio-alto e cobertura parcial; muitos portais não aceitam deep-link direto.
- **(b) remover o link e não prometer fonte clicável** (exibir só o número CNJ, copiável). Esforço baixo, honesto, sem link quebrado.

Viável agora: **(b)**, com (a) aplicado só onde o deep-link é estável (e-SAJ TJSP, PJe consulta pública de alguns TJs) numa etapa posterior.

## 4. Busca semântica nos registros sem embedding

- `search_decisions_vector` exige `embedding IS NOT NULL` **e** `ementa >= 50 caracteres`. Hoje só **31 registros** passam nesse filtro. Ou seja, a busca vetorial praticamente não opera sobre a base.
- `search_decisions` (FTS em português sobre ementa + full_text + resumo_ia) aceita **6.118 registros**, pois basta `resumo_ia >= 30`.
- O merge RRF em `search-jurisprudencia/index.ts` combina os dois, então o resultado real é ~99% busca textual.

O usuário **não percebe** a diferença explicitamente, mas percebe o sintoma: os resultados trazem resumo de andamento em vez de tese jurídica. Anunciar "busca semântica" hoje é enganoso.

## 5. Número real exibível

| Métrica | Valor |
|---|---|
| Registros totais | 6.429 |
| Com ementa preenchida | 40 (36 com ≥50 caracteres, 35 com >200) |
| Elegíveis à busca vetorial | 31 |
| Com teor decisório de verdade (ementa vinda de scraping/manual) | **36** |
| Verificados (`verified = true`) | 6 |
| Processos consultáveis (metadados CNJ) | 6.429, em 33 tribunais / 23 UFs / 610 comarcas |

O único número honesto para "jurisprudência com ementa" é **36**. O número honesto para "processos consultáveis" é 6.429.

## 6. Duas rotas

### ROTA A — corrigir a base antes da copy agressiva

O que seria necessário:
- STF e STJ possuem APIs/portais com ementa estruturada — melhor custo/benefício inicial.
- TJs: portais de jurisprudência (e-SAJ `cjsg`, PJe/JPe, eproc) — o projeto já tem `scrape-esaj` e `scrape-tj-proprio`, hoje com 30 registros somados; a arquitetura existe, falta escala e resiliência a CAPTCHA/bloqueio.
- Reprocessar embeddings só sobre registros com ementa (`backfill-embeddings` já existe).
- Ajustar `search_decisions` para separar "jurisprudência" de "consulta processual" (filtro por presença de ementa).

Esforço: alto. Precisa de ingestão contínua, tratamento de bloqueio, custo de IA para resumo e de embeddings.
Volume realista em 30 dias: **5 a 20 mil ementas**, concentradas em STJ/STF e 3-5 TJs grandes — não os 33 tribunais atuais, e com cobertura fraca no interior. Ou seja, "interior coberto" continuaria falso por mais tempo.

### ROTA B — copy honesta e ainda competitiva, hoje

Posicionamento: **plataforma de trabalho jurídico**, não acervo de jurisprudência.

O que o produto realmente entrega e pode ser afirmado sem risco:
- Consulta processual unificada em 33 tribunais / 23 UFs / 610 comarcas, com dados oficiais do CNJ (DataJud) e resumo de andamento gerado por IA — esse é um diferencial real e verificável.
- Calculadoras com dados oficiais do Banco Central e Lei 14.905/2024 (correção monetária, prazo processual, rescisão, pensão) — 100% sustentável.
- Análise de caso e diagnóstico jurídico por IA, com linguagem adaptada a cidadão ou advogado.
- Geração de petições e biblioteca de minutas.
- Base de jurisprudência **em construção**, exibida como "em expansão", sem número inflado.

Ajustes mínimos de veracidade que acompanham a copy:
- Trocar "6.429 decisões" por "6.429 processos consultáveis" em `src/pages/LandingPage.tsx` e `src/pages/Index.tsx`.
- Não usar "busca semântica" como headline enquanto só 31 registros têm vetor útil.
- Remover ou desativar o `source_url` genérico do STJ na exibição (`src/pages/Jurisprudencia.tsx`, `src/pages/DecisaoDetalhe.tsx`), mostrando o número CNJ copiável.
- Rotular resultados sem ementa como "Andamento processual" em vez de "Decisão".

## Recomendação

**ROTA B agora, ROTA A como trilha paralela.** Subir copy agressiva sobre uma base de 36 ementas expõe o produto a desmentido imediato pelo primeiro advogado que testar — e advogado testa. A Rota B já tem argumentos fortes e verdadeiros (cobertura processual nacional real + dados oficiais do BCB + IA), e libera a Rota A para ser vendida daqui a 30-60 dias, quando o acervo justificar as palavras.

## Arquivos envolvidos

- `supabase/functions/scrape-tj-fallback/index.ts` — origem dos 6.352 registros
- `supabase/functions/ingest-datajud/index.ts` — mesma lógica de `source_url`
- `supabase/functions/search-jurisprudencia/index.ts` — merge RRF FTS + vetorial
- `search_decisions` / `search_decisions_vector` (funções no banco) — filtros de elegibilidade
- `src/pages/LandingPage.tsx`, `src/pages/Index.tsx` — números exibidos
- `src/pages/Jurisprudencia.tsx`, `src/pages/DecisaoDetalhe.tsx` — link de fonte e rótulo dos resultados

Diga se aprova a Rota B para eu escrever a copy e aplicar os ajustes de veracidade listados.
