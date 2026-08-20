# Custas — correções (Bloco A) e refino visual das calculadoras (Bloco B)

## Correção de premissa antes de tudo

Os testes existem, mas em outro caminho: `src/test/custas.test.ts`, com 13 casos rodando pelo vitest sobre o motor puro (piso, teto, 1% × 1,5%, execução, cumprimento, preparo, agravo 10/15 UFESPs, litisconsórcio, isenção, UFESP do mês do recolhimento). O que não existe é um arquivo em `supabase/functions/_shared/`. Proposta: manter a suíte no vitest (é o runner que já roda no projeto) e completar os casos exatos que você listou que ainda faltam (execução R$ 50.000, cumprimento R$ 80.000, preparo R$ 120.000, litisconsórcio revisado). Se preferir Deno em `custas-engine.test.ts`, digo e eu duplico lá.

## Bloco A

**A1 — Testes.** Completar `src/test/custas.test.ts` com os dez casos da sua lista, verificando explicitamente `piso_aplicado`, `teto_aplicado`, `motivo_isencao` e `regra_aplicada.aliquota`. Somar um teste que roda contra as linhas reais semeadas no banco (lidas em tempo de teste) para pegar divergência entre fixture e seed.

**A2 — Litisconsórcio.** Não altero a fórmula sem fonte. Passo: consultar o Portal de Custas do TJSP com 15 autores e comparar com o nosso R$ 384,20. Se o portal devolver R$ 768,40, troco para `Math.ceil(qtd_autores / 10)` e gravo a fonte no `observacoes` da regra. Se o portal não permitir simular sem processo (é o cenário provável), volto com o que consegui apurar da Lei 11.608/2003 e do regimento e pergunto antes de mudar — a fórmula fica como está até você decidir.

**A3 — UFESPs 2015–2023.** Migração semeando os anos que eu conseguir confirmar em decreto do Governador de SP, cada linha com `fonte_normativa` do decreto. Ano não confirmado fica de fora — nada inventado. Em paralelo, a mensagem de erro do motor passa a nomear a competência ausente ("UFESP de 2019 não cadastrada") em vez do texto genérico.

**A4 — Data de recolhimento na interface.** Campo opcional "Data prevista do recolhimento" na etapa 2, default = data do ato, enviado como `data_recolhimento`. Texto curto ao lado: a alíquota vem da data do ato; a UFESP, da data do recolhimento. O motor já suporta — é só expor.

**A5 — Tabela `calculos`.** Migração criando `public.calculos` (`id`, `user_id`, `tipo`, `titulo`, `inputs` jsonb, `resultado` jsonb, `environment`, `created_at`) com GRANTs e RLS por `auth.uid()`. O "Salvar cálculo" da custas passa a gravar nela. Migro os registros de cálculo já gravados em `analyses` (identificáveis pelo `file_name` fabricado) e os removo de lá.

**A6 — Modo convidado.** Mantenho o comportamento para `calculo` e acrescento comentário explícito no `calculo-guard.ts`: o contador em memória é por instância, zera em cold start e não serve para nenhuma ação que chame IA. Substituir por contagem em tabela com hash do IP mexeria em cota — se você quiser, faço; por padrão fica só o comentário.

**A7 — Texto da isenção.** Troca para: "Benefício da justiça gratuita já deferido. Pedido ainda pendente de decisão não dispensa o recolhimento." Só texto de interface; a fundamentação legal do motor não muda.

## Bloco B — visual, sem tocar em lógica

- **B1** Passada de consistência nas sete calculadoras: mesmo ritmo vertical entre blocos, mesma altura de input e label, mesmo botão primário, mesmo card de resultado, mesmo tratamento de texto auxiliar.
- **B2** Mobile: alvos de toque ≥ 44px, botões full-width no mobile e auto no desktop, `inputMode="decimal"` nos campos numéricos, memória de cálculo vira lista empilhada em tela estreita (sem tabela com overflow), zero scroll horizontal, padding lateral garantido.
- **B3** Indicador de etapas 1 · 2 · 3 na custas e cards de ato com altura uniforme na grade.
- **B4** Resultado reorganizado em: valor devido + ações (dominante) → memória colapsada → aviso de outras guias → emissão → base legal em texto menor.
- **B5** Máscara de moeda brasileira na exibição dos campos de valor, com número limpo no envio (formatação só na camada de apresentação).
- **B6** Checagem de contraste e foco visível em todos os interativos, inclusive os cards clicáveis da etapa 1.

Nenhuma edge function de pagamento, autenticação, cotas, IA ou jurisprudência é tocada. Se algum item do Bloco B exigir mudar comportamento, paro e pergunto.

## Ordem de execução

1. Migrações (UFESPs 2015–2023, tabela `calculos`) e mensagem de erro nomeando a competência.
2. A4, A5, A7 no `CustasCalc` + testes A1.
3. Verificação do portal para A2 — resultado reportado antes de qualquer mudança de fórmula.
4. Bloco B, calculadora por calculadora, com screenshots mobile e desktop no final.
