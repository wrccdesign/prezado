# Etapa 2 (legibilidade): levantamento de estado

Só levantamento. Nada foi alterado.

## 1. Contagem atual

| | Auditoria anterior | Hoje | Queda |
|---|---|---|---|
| text-xs | 112 | 96 | -16 (14%) |
| text-sm | 303 | 246 | -57 (19%) |
| Total | 415 | 342 | -73 (17,6%) |

Novos utilitários em uso: `text-reading` 23 vezes, `text-note` 59 vezes, além de 12 usos diretos de `text-[0.9375rem]`.

Maiores concentrações restantes: CustasCalc 22, History 18, Conta 15, LandingPage 14, AppFooter 13, AppHeader 12, Planos 10, DiagnosticoLanding 10, CorrecaoCalc 10, AdminIngestao 9. Parte do total vem de componentes base do shadcn (sidebar, menubar, dropdown, command), que não são conteúdo de leitura.

## 2. Telas prioritárias

| Arquivo | Antes | Hoje (xs+sm) | Situação |
|---|---|---|---|
| AnalysisResult.tsx | 29 | 10 | Convertido. Conteúdo em `text-reading` (9) e `text-base` (8). Sobram badges, chips de citação, número do passo e um link de rodapé. |
| Diagnostico.tsx | 22 | 8 | Convertido. `text-reading` (8) e `text-base` (14). Sobram badges de urgência, dois inputs em `h-12 text-sm` e notas de rodapé em xs. |
| PeticaoStepperFlow.tsx | 13 | 3 | Convertido. Sobram um chip, um link "ver fonte" em xs e uma nota em xs. |
| Index.tsx | 14 | 5 | Convertido. O texto extraído do documento está em `text-base` 16px com entrelinha 1,65. Sobram rótulos de acordeão e linha de metadados do arquivo. |
| MinutaDetalhe.tsx | 6 | 2 | Corpo da minuta em `text-base`/1,65. Sobram o link de voltar e a lista lateral de links. |
| Jurisprudencia.tsx | 9 | 6 | Migrada para `text-note` (13 usos, 15px). Os 6 `text-sm` restantes são três gatilhos de filtro e três linhas de metadados de resultado. |
| DecisaoDetalhe.tsx | 8 | 2 | Migrada para `text-note` (7). Sobram um link e a linha de metadados. |
| PetitionResult.tsx | 2 | 0 | Corpo editável em `text-base` com entrelinha 1,65. Concluído. |

## 3. Controle A/A/A

- Fica no cabeçalho, como botão compacto "Aa" com menu, versão desktop e versão mobile. Como o cabeçalho é global, está disponível em todas as telas públicas e internas que o usam.
- Persiste em `localStorage` (`honorifico-font-scale`) e é aplicado em `src/main.tsx` antes do `createRoot`, portanto sem salto visual no carregamento.
- Acessibilidade presente: grupo com `aria-label="Tamanho do texto"`, `aria-label` por opção e rótulo do gatilho informando a seleção atual.

## 4. Títulos de bloco

Parcial. Os títulos editoriais (`text-h1/h2/h3`) estão acima de 16px, e telas como MinutaDetalhe, PeticaoStepperFlow, DecisaoDetalhe e Jurisprudencia já usam `text-lg` em títulos de bloco. Porém `CardDescription` do shadcn continua em `text-sm` (14px) e é usado 42 vezes; nos cartões em que o corpo subiu para 16px, a descrição ficou menor que o conteúdo que acompanha. Onde foi trocado por `text-[0.9375rem]` manualmente (Index, Conta, AnalysisResult) o problema não aparece.

## 5. Pendências, por impacto

1. Calculadoras: CustasCalc (22), CorrecaoCalc (10), PrazoCalc (7), PensaoCalc (4). São telas de leitura de resultado e memória de cálculo, ainda em 12/14px.
2. History (18) e Conta (15): listas e dados de cobrança, leitura frequente.
3. `CardDescription` padrão em 14px, 42 usos: subir a base para 15px resolveria em bloco.
4. LandingPage (14), Planos (10), DiagnosticoLanding (10), AppFooter (13): conteúdo público.
5. Painel do advogado: DashboardTab, ClientsTab, TemplatesTab, LawyerDashboard (23 somados).
6. Rótulo do stepper: está em `text-[0.8125rem]` (13px), já corrigido conforme o plano. Resta um rótulo em 11px em UsageSummary.
7. Verificação visual nos três níveis (padrão, grande, maior) em celular e desktop: feita apenas para o cabeçalho e o controle "Aa" após o último ajuste. Não há registro de varredura completa por tela nos três níveis.
8. Sobras pontuais nas telas prioritárias: badges, chips e linhas de metadados listados no item 2.

## 6. Regressões conhecidas

- Build atual: OK, sem erros.
- Nenhuma quebra registrada nas telas verificadas até aqui. Riscos ainda não verificados nos níveis grande/maior: `line-clamp-3` das ementas em Jurisprudencia (corta menos texto conforme a fonte cresce), badges com `px-3 py-1.5` em AnalysisResult e Diagnostico, gatilhos de filtro fixados em `h-10`/`h-12`, e a barra de etapas do stepper em telas estreitas.

## Próximo passo sugerido

Etapa 3: calculadoras e History/Conta, mais a base de `CardDescription`, seguida da varredura visual nos três níveis.
