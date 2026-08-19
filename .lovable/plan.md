# Review de prontidão para tráfego real (visitante anônimo)

Tudo abaixo foi verificado com requisição real (curl com a chave pública) e navegação sem sessão no preview. Nada foi alterado.

## O que já está OK

- Leitura pública do banco funciona sem login: `decisions` (200), `feriados` (200), `indices_economicos` (200) e a função de busca `search_decisions` (200). Não há RLS bloqueando conteúdo público indevidamente.
- Páginas `/decisao/:id`, `/modelos-de-minutas` e `/comparativo` carregam completas para anônimo (verificado).
- Calculadoras de CPF/CNPJ e de datas são 100% locais — funcionam sem login.
- `/planos` carrega e os botões "Assinar" estão clicáveis para anônimo (levam ao cadastro).

## Problemas encontrados

### 1. Busca de jurisprudência quebrada para visitante anônimo — CRÍTICO
Causa raiz: a edge function `search-jurisprudencia` exige sessão (`requireQuota`), mas a rota `/jurisprudencia` é pública e está no sitemap com prioridade alta. Ao buscar sem login, a página mostra o toast vermelho "Erro na busca — Unauthorized" e "Nenhuma decisão encontrada" (reproduzido no navegador).
Impacto: crítico. É a página principal de anúncio/SEO; o visitante vê um erro técnico e sai.
Correção proposta: liberar uma prévia sem login — permitir a busca para anônimo com resultado limitado (ex.: 3 resultados, sem expansão por IA e sem consumo de cota), e substituir o toast de erro por um bloco de conversão ("Crie sua conta grátis para ver todos os resultados"). Alternativa mais conservadora: manter o bloqueio, mas trocar o erro por um convite de cadastro antes mesmo de chamar o backend.

### 2. Calculadoras de prazo e correção monetária quebradas para anônimo — CRÍTICO
Causa raiz: `calcular-prazo` e `calcular-atualizacao` também exigem sessão, mas as landings `/calculadoras/prazo-processual` e `/calculadoras/correcao-monetaria-juros-lei-14905` são públicas e indexadas. Testado: clicar em "Calcular" sem login retorna "Erro no cálculo — Unauthorized".
Impacto: crítico. São páginas feitas exatamente para captar tráfego orgânico.
Correção proposta: permitir N cálculos por visitante anônimo (contados por IP na função, sem gravar em `usage_tracking`) e, após isso, exibir CTA de cadastro. Alternativa: exigir login, mas com aviso claro ("Entre para calcular") antes do clique, em vez de erro.

### 3. Textos com estatísticas imprecisas — ALTO
Causa raiz: a home afirma "27 tribunais" (em 4 lugares) e "5k+ decisões indexadas". Os números reais no banco são 33 tribunais distintos e 6.429 decisões.
Impacto: alto (risco de propaganda enganosa e de o número ficar desatualizado).
Correção proposta: ajustar para "33 tribunais" e "6 mil+ decisões", ou tornar dinâmico via contagem no banco. Nenhum depoimento falso ou contagem de membros fabricada foi encontrado — a home não usa testemunhos.

### 4. Cabeçalho de app aparece para visitante anônimo — ALTO
Causa raiz: `/planos`, `/jurisprudencia`, `/calculadoras`, `/modelos-de-minutas`, `/decisao/:id` renderizam o `AppHeader` completo, com "Análise / Diagnóstico / Petição", menu de conta e "Sair", mesmo sem sessão. Os links levam a rotas protegidas e chutam o visitante para `/auth`.
Impacto: alto (confusão e abandono; o visitante não vê "Entrar / Cadastrar").
Correção proposta: no `AppHeader`, quando não há usuário, mostrar navegação pública (Jurisprudência, Calculadoras, Modelos, Planos) e os botões "Entrar" e "Cadastrar", ocultando menu de conta, cotas e "Sair".

### 5. Card do plano gratuito com botão morto para anônimo — MÉDIO
Causa raiz: em `/planos`, o plano do visitante é considerado `free`, então o card Gratuito mostra "Plano atual" desabilitado em vez de "Criar conta grátis" (confirmado: botão `disabled`).
Impacto: médio (perde a conversão mais fácil da página).
Correção proposta: só tratar como "plano atual" quando houver usuário logado; para anônimo, exibir "Criar conta grátis" apontando para `/auth`.

### 6. Sitemap com rotas protegidas — MÉDIO
Causa raiz: `sitemap.xml` inclui `/diagnostico`, `/peticao`, `/chat`, `/historico`, `/painel-advogado`, `/conta` — todas redirecionam para login, gerando páginas de baixo valor no índice.
Impacto: médio (desperdício de crawl e possível "soft 404").
Correção proposta: remover as rotas protegidas do sitemap ou criar landings públicas específicas para diagnóstico e petição.

### 7. `/admin/ingestao` acessível a qualquer usuário logado — MÉDIO
Causa raiz: a rota usa apenas `ProtectedRoute`, sem checagem de papel; as funções de ingestão exigem service role, então os botões falham.
Impacto: médio (exposição de tela interna e botões mortos).
Correção proposta: restringir por papel de administrador (tabela de papéis dedicada) ou remover a rota do build público.

### 8. Limpeza de código — BAIXO
Causa raiz: `src/components/Citations.tsx` não é importado em nenhum lugar (verificado por busca no projeto inteiro).
Impacto: baixo.
Correção proposta: remover o arquivo. Nenhum outro componente candidato foi confirmado como órfão — todos os demais verificados têm referência ativa.

## Ordem sugerida de execução

1. Itens 1 e 2 (páginas de maior tráfego funcionando sem login).
2. Itens 4 e 5 (cabeçalho público e CTA de cadastro).
3. Itens 3 e 6 (números corretos e sitemap).
4. Itens 7 e 8 (endurecimento e limpeza).

## Detalhes técnicos

- Backend: novo modo "convidado" em `_shared/calculo-guard.ts` (função `allowGuest`), com limite por IP em memória/tabela leve; aplicado em `search-jurisprudencia`, `calcular-prazo` e `calcular-atualizacao`. Sem alteração de RLS — o acesso público já funciona.
- Frontend: `AppHeader` passa a ler `useAuth()` e renderizar dois conjuntos de navegação; `Jurisprudencia.tsx` e as calculadoras tratam 401/limite de convidado com bloco de conversão em vez de toast de erro; `Planos.tsx` corrige o rótulo do card gratuito.
- Conteúdo: ajuste dos números em `LandingPage.tsx` e do texto em `SEO`/meta description que cita 27 tribunais.

Confirme quais itens devo aplicar (todos ou um subconjunto) antes de qualquer alteração.
