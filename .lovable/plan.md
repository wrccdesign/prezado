# Correção de rota — estado atual e o que falta

Antes do plano, as duas confirmações pedidas.

## (a) Plano do backend

O backend deste projeto é gerenciado pela Lovable Cloud, instância **Tiny** (equivalente ao tier gratuito): **não há backup diário automático**. Qualquer migração deve ser aditiva. É exatamente por isso que a mudança do item A5 (não migrar `analyses`) é a decisão certa.

## (b) SQL — o que já foi executado na rodada anterior

A migração da rodada anterior já rodou. Verificado no banco agora:

```text
INSERT INTO public.unidades_fiscais (...) VALUES (2015..2023)
  ON CONFLICT (codigo, ano) DO NOTHING;      -- idempotente, 2024/25/26 intactas
CREATE TABLE public.calculos (...)
GRANT ... ON public.calculos TO authenticated / service_role
ALTER TABLE public.calculos ENABLE ROW LEVEL SECURITY
CREATE POLICY (select/insert/update/delete, todas escopadas em auth.uid())
CREATE TRIGGER update_calculos_updated_at BEFORE UPDATE ON public.calculos
```

Nenhum `UPDATE` ou `DELETE` em tabela existente. Estado conferido: `unidades_fiscais` com 12 anos (2015→2026, valores de 2024/25/26 preservados), `calculos` criada e vazia, `analyses` com 11 linhas — **intocada**. A parte de migrar linhas de `analyses` nunca chegou a ser executada, então o item A5 revisado já está atendido: nada a desfazer, nada a apagar.

## Itens da correção de rota — situação

| Item | Situação |
| --- | --- |
| A5 (não migrar) | Atendido. `calculos` criada, custas salva nela, `analyses` sem qualquer escrita |
| A3 (ON CONFLICT DO NOTHING) | Atendido, verificado no SQL aplicado |
| A6 (só comentário) | Atendido. Comentário de alerta no guard, mecânica inalterada |
| A1, A2, A4, A7 | Atendidos (11 testes Deno, litisconsórcio conservador com nota de fonte pendente, campo de data de recolhimento, texto da isenção corrigido) |
| Bloco B Etapa 1 (CustasCalc) | Atendido |
| Bloco B Etapa 2 | **Antecipado por engano — precisa de decisão** |

## O ponto que precisa da sua decisão

O fatiamento do Bloco B chegou depois de a rodada anterior já ter tocado as outras seis calculadoras. As alterações foram mínimas e mecânicas — em `CorrecaoCalc`, `PrazoCalc`, `RescisaoCalc`, `PensaoCalc`, `DateCalc` e `CpfCnpjCalc` foram adicionados apenas `className="h-11"` (alvo de toque de 44px) e `inputMode="decimal"` nos campos numéricos. Nenhuma lógica, cálculo, chamada de função ou texto foi alterado. Não houve extração de componente nem reestruturação de layout nessas seis.

Duas saídas:

1. **Manter** essas duas propriedades e considerar a Etapa 2 apenas iniciada — o refino real (cards de resultado, tabela→lista no mobile, máscara de moeda, hierarquia) continua reservado para depois da sua aprovação.
2. **Reverter** as seis para o estado anterior, deixando a Etapa 1 estritamente isolada em `CustasCalc`, e reaplicar tudo junto na Etapa 2.

## Padrões extraídos na Etapa 1 (pedido no fim do Bloco B)

Hoje os padrões vivem **dentro de `src/components/calculators/CustasCalc.tsx`**, ainda não em módulo compartilhado:

- Indicador de etapas 1·2·3
- Máscara de moeda BRL na exibição com valor numérico limpo no envio
- Card de resultado com hierarquia (valor dominante → ações → memória colapsada → avisos → base legal menor)
- Memória de cálculo que vira lista empilhada abaixo de `sm`
- Alvos de toque de 44px e botões full-width no mobile

**Proposta para fechar a Etapa 1**: extrair esses padrões para arquivos próprios antes de multiplicar —
`src/components/calculators/shared/CurrencyInput.tsx`, `StepIndicator.tsx`, `ResultCard.tsx`, `MemoriaList.tsx` e `src/lib/currency.ts` — refatorando apenas `CustasCalc` para consumi-los. Sem tocar nas outras seis. Assim a Etapa 2 vira substituição, não reescrita.

## Restrições respeitadas

Nada de pagamento, autenticação, cotas, IA ou jurisprudência é tocado em nenhuma das opções acima.
