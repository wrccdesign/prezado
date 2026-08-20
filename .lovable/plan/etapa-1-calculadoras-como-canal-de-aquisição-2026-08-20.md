# Etapa 1 — Calculadoras como canal de aquisição

## Situação verificada agora

- `PLAN_LIMITS` hoje tem `calculo`: 5 (free) / 150 (profissional) / 500 (escritório). A trava de rajada (`BURST_LIMIT_PER_HOUR = 30`) é separada e vale para todas as ações.
- Os três endpoints de cálculo (`calcular-atualizacao`, `calcular-prazo`, `calcular-custas`) já usam `requireQuotaOrGuest("calculo", …)`: ou seja, **já aceitam visitante anônimo**, com limite de 3 usos/24h por IP. Esse contador vive num `Map` em memória do isolate — não é confiável (zera em cold start, não é compartilhado entre instâncias).
- A rota `/calculadoras` **não** é protegida; nenhuma calculadora exige login no frontend.
- Exportação (PDF/Word) hoje existe **apenas na calculadora de Custas TJSP**. As outras seis (Correção, Prazo, Rescisão, Pensão, CPF/CNPJ, Datas) não exportam nada — só mostram resultado na tela. "Salvar no histórico" também só existe em Custas (tabela `calculos`).
- Backfill: 1.960 decisões ainda sem embedding, de 6.446 no total.

## O que vou fazer

### 1. Cálculo ilimitado
- Remover `calculo` de `PLAN_LIMITS` nos três planos e tratar a ação como isenta de cota mensal em `checkRateLimit` (sem cair na regra de "ação desconhecida = negada", que é o comportamento atual para ações fora da tabela).
- Manter a trava de 30/hora intacta para usuários logados.
- Nenhuma outra ação é tocada.

### 2. Limite por IP confiável para anônimos
- Substituir o contador em memória por contagem persistente: nova tabela `anon_usage` (hash SHA-256 do IP + ação + timestamp), sem RLS pública, acessível só por `service_role`.
- Limite: 30 requisições por hora por IP nos endpoints de cálculo (mesmo teto dos logados). Excedeu → 429 com mensagem clara.
- Alteração restrita a `_shared/calculo-guard.ts` e aos três endpoints de cálculo. Nenhuma outra edge function muda de comportamento.

### 3. Gancho de conversão na exportação
- Custas TJSP: os botões Exportar PDF / Word / Salvar ficam visíveis para visitante, mas ao clicar sem sessão abrem um convite para criar conta grátis (com retorno para a calculadora depois do cadastro). O resultado e a memória de cálculo continuam 100% visíveis na tela.
- Como as outras seis calculadoras ainda não exportam nada, nelas o gancho vira apenas "Salvar no histórico" (mesmo tratamento: visível, exige conta). A exportação da memória de cálculo nas demais calculadoras fica para a Etapa 3 — confirme se prefere antecipá-la.

### 4. Vitrine coerente
- `/planos`: a linha "Cálculos jurídicos / mês" passa a "Cálculos jurídicos — ilimitado" nos três planos.
- Ajustar apenas números de cota incoerentes onde aparecerem; sem reescrita de marketing.
- `UsageSummary` / `/conta`: cálculo deixa de aparecer como cota consumível e passa a exibir "ilimitado".

### 5. Autodesativação do backfill
- No fim da execução, quando a consulta não encontrar mais decisões sem embedding, a função chama `cron.unschedule('backfill-embeddings-5min')` via SQL com service role e registra isso no log. O cron se apaga sozinho ao terminar os 1.960 restantes.

## Custo do backfill na Voyage

`ai_usage` registra 81 chamadas e 246.467 tokens de entrada para `backfill-embeddings` (≈4.480 decisões já vetorizadas). A `voyage-law-2` custa US$ 0,12 por milhão de tokens:

- Já gasto: ~US$ 0,03
- Restante estimado (1.960 decisões): ~US$ 0,01
- **Total do backfill: menos de US$ 0,05**

## Fora de escopo

Pagamentos, autenticação, ingestão, cotas das ações de IA (search, chat, diagnóstico, análise, documento, petição) e textos de marketing ficam intocados.
