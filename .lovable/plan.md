# Etapa 2 — Reescrever a landing e alinhar /planos

Pré-requisito conferido: a Etapa 1 está no ar. `calculo` saiu do `PLAN_LIMITS` (ilimitado em todos os planos, só a trava de 30/h), as funções de cálculo aceitam visitante sem login com limite por IP persistido, e o gancho de exportação já existe (`useGuestExportGate`, hoje ligado só na calculadora de Custas). O texto "sem cadastro" pode ir ao ar.

## Landing (`src/pages/LandingPage.tsx`)

Hero reescrito com o texto fornecido, sem alteração de nada além de texto/estrutura:

- Título: "Cálculos e prazos com fonte oficial, prontos para anexar."
- Subtítulo: o parágrafo fornecido (BCB, feriados forenses, custas TJSP, memória em PDF/Word com base legal).
- Botão primário "Calcular agora" → âncora para a calculadora embutida logo abaixo do hero.
- Botão secundário "Ver planos" → `/planos`.
- Sai o selo "IA Jurídica Brasileira", sai o mock de "Consulta Processual — Ao Vivo" e saem os três números do hero (33 tribunais / 6k+ processos / 100% dados oficiais).

Logo abaixo do hero: a calculadora de Correção Monetária real (`CorrecaoCalc`) renderizada e funcionando, sem cadastro. É o mesmo componente da página `/calculadoras`, não uma imitação.

Blocos 1, 2 e 3 com o texto fornecido, exatamente como escrito (origem dos índices SGS com os códigos, Lei 14.905/2024 e mês de transição, memória de cálculo como produto).

Bloco 4 "E também" como lista secundária, sem destaque de vitrine: prazos, custas TJSP, consulta processual e de andamentos, petições e análise com IA.

Removidos da landing, por prometerem mais do que entregamos ou por serem do eixo antigo:
- Seção inteira de jurisprudência/"33 Tribunais e Cortes" com o contador animado de 6.400 processos e a consulta ao vivo na tabela `decisions`.
- Grade de 6 "funcionalidades" e a seção "Como funciona" em 4 passos (texto genérico do eixo antigo).
- CTA final "O direito nunca foi tão acessível" / "democratizar o acesso ao direito" → vira um CTA seco com os mesmos dois botões do hero.
- Âncoras do menu ajustadas para as seções que passam a existir.

Mantidos: navbar, identidade visual (navy/gold, Playfair/DM Sans), animações de reveal, cards de planos da landing, rodapé e `LegalDisclaimer` onde já aparece.

Público-alvo do texto passa a ser o advogado. A seção "Para quem" (Advogados / Cidadãos) é o único ponto onde isso ainda conflita — proposta: manter só o card de Advogados, com os bullets reescritos a partir do Bloco 4. Se preferir remover a seção inteira ou manter os dois cards, me diga.

## /planos (`src/pages/Planos.tsx`)

- Texto de apoio deixa claro que as calculadoras são livres e ilimitadas em todos os planos, e que a assinatura compra IA (petições, análise, diagnóstico, chat), histórico salvo e volume de consulta.
- A linha duplicada de calculadoras ("Calculadoras (prazo, correção, ...)" com "✓") é fundida na linha "Cálculos jurídicos — Ilimitado", que já existe.
- Conferência 1:1 com `rate-limit.ts`: consulta 20/400/1500, chat 10/200/800, diagnóstico 1/60/200, análise 3/40/150, documento 5/80/300, petição 0/60/200, cálculo ilimitado. Preços e ciclos não mudam.

## SEO

- `LandingPage`: título "Cálculos e prazos jurídicos com fonte oficial — Honorífico"; descrição liderando por correção monetária pelo Banco Central, prazos e custas, com memória de cálculo em PDF/Word.
- `index.html`: `<title>`, `meta description`, `og:title`/`og:description` alinhados ao mesmo eixo.
- `public/llms.txt`: resumo reescrito para o eixo de cálculos; jurisprudência desce para apoio; a lista de páginas passa a citar as landings de calculadoras já existentes.
- `SEO.tsx` em si não precisa de mudança estrutural (já suporta imagem absoluta e JSON-LD); só os valores passados por página mudam.

## Detalhes técnicos

- Arquivos tocados: `src/pages/LandingPage.tsx`, `src/pages/Planos.tsx`, `index.html`, `public/llms.txt`.
- `CorrecaoCalc` é importado direto na landing. Ele já chama `calcular-atualizacao`, que aceita visitante anônimo desde a Etapa 1.
- Consistência do gancho de conversão: hoje `CorrecaoCalc` exporta PDF/Word sem exigir conta (o gate só está em `CustasCalc`). Se a calculadora vai para a home como isca, proponho aplicar nela o mesmo `useGuestExportGate` — mudança de UI apenas, sem tocar na lógica de cálculo. Confirme se quer isso nesta etapa ou na Etapa 3.
- Não serão tocados: pagamentos, cotas de IA, autenticação, lógica das calculadoras, ingestão, preços.
- Verificação ao final: typecheck, testes, e screenshot da landing (desktop e mobile) com a calculadora renderizada e funcionando.
