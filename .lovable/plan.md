# Base jurídica comum, ranking por fato decisivo e revisão de saída

Diagnóstico feito sobre o código e o banco atuais. Nada foi alterado.

## 1. Mapa do código atual

| Ferramenta | Função | Decisões do acervo | Súmulas | Legislação | Verificação de citações |
|---|---|---|---|---|---|
| Diagnóstico | `diagnostico-juridico/index.ts` (prompt inline, l. 60) | `fetchGroundingContext(situacao, 4)` + `buildGroundingBlock` | `fetchGroundingSumulas` | nenhuma | `buildCitationReport` (l. 157), exibido em `Diagnostico.tsx:596` |
| Petição | `generate-petition/index.ts` | `fetchGroundingContext(tipo_acao + fatos, 800 chars)` + `buildPrecedentsBlock` próprio (duplica `buildGroundingBlock`) | sim | `searchLegislation` (`_shared/legislation-search.ts`) | `buildCitationReport` (l. 304), passado a `PetitionResult` pelo `PeticaoStepperFlow.tsx:193` |
| Chat | `chat-juris/index.ts` (l. 137-139) | sim | sim | nenhuma | não existe |
| Análise de documentos | `analyze-legal-text/index.ts` | **não existe** | **não existe** | **não existe** | **não existe** |
| Busca pública | `search-jurisprudencia/index.ts` | RPCs diretos, lógica própria | sim | não | n/a |
| MCP | `mcp/index.ts` | RPC direto | sim | não | n/a |

Compartilhado: `_shared/grounding.ts` (busca vetorial `search_decisions_vector` limiar 0.35, com fallback FTS `search_decisions`; `classifyNatureza` em precedente/julgado/relacionado; `REGRAS_CITACAO`), `_shared/citation-check.ts`, `_shared/ai.ts`.

Duplicado ou ausente:
- Cada função escreve seu próprio prompt e suas próprias regras de fonte. A Análise acertou o Tema 1417 e a ANAC 400 porque estavam no próprio acórdão colado, não porque o sistema os conheça.
- Não existe em lugar nenhum do código uma base de temas do STF/STJ, normas setoriais (ANAC, ANS, Bacen) ou regras de prazo. A busca por "Tema", "Montreal", "ANAC" e "prescri" nas funções não acha nada útil.
- Acervo de súmulas: 9 vinculantes STF, 27 STJ, 6 TST.
- Ranking: só similaridade semântica ou relevância por palavra. Não considera tipo de decisão, presença de ementa nem fato decisivo.

## 2. Base de conhecimento jurídico comum

Novas tabelas no banco, leitura pública, escrita só por admin (mesmo padrão de `sumulas`):

- `temas_vinculantes`: tribunal, tipo (repercussão geral, repetitivo, IAC, IRDR), número, tese, situação (julgado, pendente, suspensão nacional), alcance (texto curto do que NÃO é alcançado, ex.: Tema 1417 não alcança fortuito interno), assuntos, fonte oficial, data de conferência.
- `normas_setoriais`: órgão (ANAC, ANS, Bacen, Anatel, Aneel), ato, artigos, resumo do dispositivo, assuntos, fonte, vigência.
- `regras_prazo`: assunto, regime (ex.: transporte aéreo internacional), tipo de pretensão (dano material, dano moral, repetição de indébito), prazo, fundamento (lei + tema), fonte. Uma linha por combinação, para que a resposta seja obrigada a separar regimes.
- `assuntos`: taxonomia única (transporte aéreo, bancário, saúde suplementar, consumo, trabalho...) com sinônimos, usada para ligar tudo.

Consumo: novo `_shared/legal-knowledge.ts` com `fetchLegalKnowledge(texto)` que classifica o assunto (palavras + uma chamada Flash-Lite curta), busca temas, normas e regras de prazo do assunto, e devolve um bloco único `CONHECIMENTO JURÍDICO CONFERIDO`. As quatro ferramentas (incluindo a Análise, que hoje não tem nada) chamam a mesma função. Regras de citação saem dos prompts individuais e passam a viver só em `grounding.ts`.

Manutenção: página admin para editar as tabelas, cada linha com fonte e data de conferência; carga inicial curada só com o que for conferido no site oficial (mesma política das súmulas). Sem assunto coberto, o bloco diz isso e o prompt proíbe afirmar prazo único.

`citation-check.ts` passa a conferir "Tema N do STF/STJ" contra `temas_vinculantes`.

## 3. Ranking de precedentes

Em `fetchGroundingContext`, recuperar 20-30 candidatos (vetorial + FTS) e reordenar em código:

1. Filtro duro: excluir `relacionado`; excluir decisão interlocutória e homologação como apoio; sentença sem ementa só como "caso análogo" e nunca com "julgou procedente pedido semelhante" se não houver `resultado` registrado.
2. Peso por tipo: acórdão > decisão monocrática de tribunal > sentença.
3. Fato decisivo: a mesma etapa de classificação do item 2 extrai do caso do usuário um conjunto curto de atributos por assunto (ex.: transporte aéreo: causa = manutenção, excludente = fortuito interno, voo internacional). Cada candidato recebe os mesmos atributos (extraídos uma vez na ingestão e guardados em nova coluna `fatos_decisivos jsonb`; backfill em lote para o acervo atual). Atributo contrário (meteorologia = fortuito externo) derruba o candidato; atributo igual soma pontos.
4. Tema vinculante: se o candidato cai em hipótese suspensa (`temas_vinculantes.situacao = suspensão`) e o caso do usuário não, ele sai.
5. Sinal de qualidade: ementa de 200+ caracteres e `source_url` somam pontos.

Saída mostra por que cada precedente entrou. Teste de aceitação: o caso do voo traz 149ee4f2 e não traz o TJMG de meteorologia nem a sentença TJES.

## 4. Investigação do acervo (números do banco)

- 6.710 decisões; 144 com ementa acima de 200 caracteres e `source_url`; 6.552 com ementa ausente ou abaixo de 50; 6.514 desses só têm `resumo_ia`.
- Por origem (registros, mediana e máximo do `full_text`): `datajud_fallback` 6.352 / 2.874 / 84.509; `datajud` 163 / 2.448 / 58.625; `scraping_tj_proprio` 105 / 516 / 2.095; `scraping_esaj` 46 / 886 / 2.974; `datajud_live` 38 / 4.752 / 15.059.
- Tipo de decisão: 5.068 sem tipo, 334 sentenças, 328 interlocutórias, 304 acórdãos.
- Causa do corte: não há limite na coluna. Os coletores de portal (`scrape-tj-proprio/index.ts:186`, mesmo padrão em `scrape-esaj`) cortam o conteúdo de cada página em 3.000 caracteres antes de pedir à IA para extrair a decisão. Por isso nenhum registro dessas origens passa de ~3.000. A 149ee4f2 é `scraping_tj_proprio`, 1.856 caracteres, termina em "reiteraç".
- 16 registros `scraping_tj_proprio` entre 1.700 e 3.000 caracteres terminam sem pontuação final (provável corte). A 6f15d005 (308) termina em frase completa: é só ementa, não é corte.
- Os registros DataJud não têm ementa porque o DataJud entrega metadados, não teor.

Correção: buscar o inteiro teor pela URL do documento (PDF/HTML do tribunal) em etapa separada, sem passar pela IA, gravando o texto completo; marcar `teor_completo boolean`. Reprocessar os 151 registros de portal.

## 5. Plano em fases

Bateria de teste fixa (3 casos, rodados no Diagnóstico, Análise, Petição e Chat, com resultado esperado escrito):
- Voo internacional cancelado por manutenção (prazos separados Montreal 2 anos / CDC 5 anos; Tema 1417 com alcance correto; ANAC 400 arts. 26-27; trazer 149ee4f2).
- Cobrança bancária indevida (repetição em dobro, art. 42 CDC e entendimento do STJ sobre má-fé; prazo; não citar súmula não conferida).
- Negativa de plano de saúde (normas ANS, rol, prazo; precedente de tribunal com ementa).

**Fase 1, interface e fluxo (risco baixo)**
- Remover emojis e ícones duplicados dos títulos de `Diagnostico.tsx` (l. 410, 422, 487...) e conferir `AnalysisResult.tsx`, `PetitionResult.tsx`, `chat-juris` (usa emojis 🟡🔴 no prompt).
- "Gerar petição para este caso": `Diagnostico.tsx:218` envia `state`, mas `Petition.tsx` não lê `location.state`. Ligar ao `peticaoPrefill` já existente.
- `Petition.tsx:43`: trocar "Juizado Especial" por "Juizado Especial Cível" e separar do grupo de varas.
- `LandingPage.tsx:43`: CTA da Análise vai para `/analise` (visitante é levado ao login com retorno).
- Análise: remover `prazo_estimado` do esquema (`analyze-legal-text` l. 491, 523) e da tela; "Pontos fracos" passa a dizer de qual parte.
- Relatório de citações da Petição existe no código; confirmar em tela que aparece no fim do fluxo em etapas.
- Pode quebrar: histórico antigo com `prazo_estimado`. Teste: Playwright nas quatro telas.

**Fase 2, revisão de saída (risco baixo-médio)**
- Novo `_shared/output-review.ts`: valor por extenso gerado em código a partir do número (não pela IA), checagem de datas e valores do texto contra os fatos informados, e uma passada Flash-Lite de concordância que só pode corrigir gramática. Aplicar em Petição e Análise.
- Pode quebrar: alteração indevida de texto jurídico. Teste unitário de extenso (480, 1.250,37...) e de fidelidade de datas.

**Fase 3, ranking (risco médio)**
- Filtros e pesos 1, 2, 4 e 5 do item 3 primeiro (sem nova coluna). Depois `fatos_decisivos` com backfill.
- Pode quebrar: menos precedentes por resposta; mais "não encontrei". Teste: bateria acima e testes de `grounding.ts` com candidatos fixos.

**Fase 4, base de conhecimento comum (risco médio)**
- Tabelas, admin, carga curada para os três assuntos da bateria, `legal-knowledge.ts` nas quatro ferramentas, verificação de temas.
- Pode quebrar: prompts maiores (custo e tempo), conteúdo desatualizado. Teste: bateria, e checagem de que todo tema citado está no bloco.

**Fase 5, acervo (risco maior)**
- Coleta do inteiro teor sem corte, reprocessamento dos registros de portal, coluna `teor_completo`.
- Pode quebrar: limites de tempo das funções e de tribunais. Teste: amostra de 20 registros comparada ao documento oficial.

## Detalhes técnicos

- Consultas usadas: contagens em `decisions` por `source`, `tipo_decisao`, `length(full_text)`, `length(ementa)`; `sumulas` por tribunal e tipo.
- `buildPrecedentsBlock` da Petição deve ser substituído por `buildGroundingBlock` para uma regra só.
- Todas as novas tabelas com RLS, GRANT de leitura a `anon`/`authenticated`, escrita via `has_role(..., 'admin')`.
- Regra arquitetural da base comum a registrar em `AGENTS.md` ao implementar.
