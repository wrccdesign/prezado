# Levantamento: recortes reais para "Do fato ao fundamento"

Só levantamento, nada será implementado. Aprovar este documento não altera código.

## 1. Telas por etapa

| Etapa | Rota e arquivo | Estado mais representativo | Dados necessários |
|---|---|---|---|
| Diagnóstico | `/diagnostico` (`DiagnosticoRoute` em `src/App.tsx:111`), `src/pages/Diagnostico.tsx` | Resultado (`useState<Diagnostico>`, interface na linha 24) com citações (`Citation`, linha 36) e `CitationReport` | Objeto `Diagnostico` + lista de citações do acervo + relatório de citação |
| Análise de documentos | `/analise` (protegida, `src/pages/MeuCaso.tsx`), resultado em `src/components/AnalysisResult.tsx` | Relatório: tipo de causa, pontos fracos, fundamentação sugerida, riscos | `LegalAnalysis` (`src/types/analysis.ts`) |
| Consulta processual | `/jurisprudencia`, `src/pages/Jurisprudencia.tsx` | Lista de decisões de uma busca | `Decision` (linha 17): tribunal, CNJ, data, ementa, temas, source_url |
| Petição | `/peticao` (protegida, `src/pages/Petition.tsx`), resultado em `src/components/PetitionResult.tsx` | Peça gerada formatada | `text`, `petitionType`, `citationReport` opcional |

Observação: o CTA "Análise de documentos" em `LandingPage.tsx` aponta para `/auth`, não para `/analise`.

## 2. Viabilidade por opção

- (a) Estático tipo HeroConsole: leve, sem rede, controle total do recorte. Risco: diverge do produto quando a tela real mudar.
- (b) Imagem: rápida de fazer. Risco: peso, texto ilegível no mobile, desatualiza, ruim para SEO e acessibilidade.
- (c) Componente real com mock: fiel ao produto. Risco: `AnalysisResult` e `PetitionResult` têm cerca de 24 KB e 19 KB, puxam toasts, exportação, timbre e callbacks; o resultado do Diagnóstico não é componente separado (está dentro da página), então não dá para reutilizar sem refatorar.

Recomendação técnica: (a) nas quatro, reaproveitando os tipos reais (`LegalAnalysis`, `Decision`) para reduzir divergência.

## 3. Registros reais disponíveis

- Consulta processual: sim. 6.710 decisões, 144 com ementa acima de 200 caracteres e `source_url`. Mesma fonte do HeroConsole.
- Análise de documentos: existem 21 registros em `analyses` (ex.: f3adee2d..., 09/10/2026). São documentos de usuários: usar exige anonimização (LGPD) e, idealmente, autorização. Alternativa: rodar uma análise nova sobre uma decisão pública do acervo.
- Petição: 14 em `petitions`, mesmo problema de dado de usuário. Mesma alternativa: gerar uma peça a partir de caso público.
- Diagnóstico: o resultado não é salvo no banco (a página só grava em `usage_tracking`). Não há registro real; exigiria rodar um diagnóstico novo com caso fictício ou público e congelar a saída.

Conclusão: só a Consulta processual tem dado real pronto. As outras três precisam de saída real gerada por nós sobre caso público, ou de exemplo fictício declarado.

## 4. Estrutura do HeroConsole

`src/components/landing/HeroConsole.tsx`: array fixo `casos` (4 itens, copiados à mão da tabela `decisions`, com tribunal, CNJ, ementa, `destaque`, relatoria, `sourceUrl`, `ferramenta`), array `memoria` fixo, abas `role="tablist"` com `useState` do caso ativo, ficha `article` com faixa de fonte, botão copiar CNJ, ementa com `<mark>`, mini tabela e rodapé com link oficial. Sem consulta ao banco em tempo de execução.

## 5. Números agregados verificáveis (consultados hoje)

| Número | Valor | Origem |
|---|---|---|
| Decisões no acervo | 6.710 | `select count(*) from decisions` |
| Tribunais com decisões | 33 | `count(distinct tribunal)` em `decisions`; também RPC `list_tribunais()` |
| Última sincronização BCB | 17/10/2026 09:00 UTC (referência mais recente 01/10/2026) | `max(sincronizado_em)` / `max(data_ref)` em `indices_economicos` |
| Súmulas | 42 | `sumulas` |
| Por tribunal com últimos 7 dias | disponível | RPC `admin_decisions_por_tribunal()` (só admin) |

Onde aparecem hoje: nenhum desses números é exibido no site público. Só o painel `/admin/coleta` mostra contagens por tribunal. A landing de correção monetária cita os códigos SGS e "sincronizadas diariamente" sem data.
Ponto de atenção: `decisions` e `indices_economicos` têm leitura pública restrita por RLS; exibir contagem ao visitante exigiria função pública só de agregados ou número fixado no build.
