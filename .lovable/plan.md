# Análise jurídica iterativa (esclarecer e reanalisar)

Hoje cada análise começa do zero: `analyze-legal-text` recebe só `{ text, file_name }`, então uma petição revisada seis vezes devolve os mesmos riscos seis vezes. O objetivo é permitir que o usuário esclareça cada risco ou ponto fraco e receba uma nova análise que se posiciona item a item: mantido (com motivo) ou resolvido (reconhecendo o esclarecimento).

## Parte 1 — Backend (`supabase/functions/analyze-legal-text/index.ts`)

Novos campos **opcionais** no corpo da requisição:

```jsonc
{
  "text": "…",              // já existe
  "file_name": "…",         // já existe
  "rodada": 2,              // opcional, default 1
  "analise_anterior": {      // opcional
    "riscos_processuais": ["…"],
    "pontos_fracos": ["…"],
    "tipo_de_causa": "…"
  },
  "esclarecimentos": [       // opcional
    { "item_original": "texto exato do item", "esclarecimento": "o que o usuário respondeu" }
  ],
  "texto_alterado": true     // opcional: sinaliza que o texto também mudou
}
```

Validação: `rodada` inteiro 1–10; `esclarecimentos` no máximo 20 itens, cada `esclarecimento` até 1.500 caracteres; `analise_anterior` só aceita os arrays de strings (ignorar o resto), cada item até 600 caracteres. Qualquer campo inválido é descartado silenciosamente e a chamada roda como primeira rodada.

Bloco adicional no prompt, injetado apenas quando `analise_anterior` existe:
- lista numerada dos riscos e pontos fracos anteriores, com o esclarecimento correspondente quando houver;
- regra: para **cada** item anterior o modelo deve decidir MANTER ou RESOLVER; é proibido repetir um item sem se posicionar;
- quando `texto_alterado` for verdadeiro, instruir a conferir no texto novo se o ponto de fato foi corrigido, e não confiar só na alegação;
- esclarecimento que apenas discorda sem apoio no texto mantém o item, com o motivo explicitado.

Dois campos novos no schema da tool `legal_analysis` (não obrigatórios, para não quebrar a rodada 1):

```jsonc
"itens_resolvidos": [ { "item": "texto do item anterior", "motivo": "por que o esclarecimento resolve" } ],
"itens_mantidos":   [ { "item": "texto do item anterior", "motivo": "por que o esclarecimento não resolve" } ]
```

A resposta passa a devolver `{ result, input_text, rodada }`. Na rodada 1 esses arrays vêm vazios e a UI não mostra a seção.

Nota sobre grounding: essa função continua sem `grounding.ts`, usando só o dicionário estático de legislação. Isso não bloqueia a iteração (o ganho vem de o modelo enxergar a rodada anterior), mas significa que um risco "mantido" continua sem citação verificada de jurisprudência. Fica registrado como melhoria futura separada.

## Parte 2 — Frontend

Arquivos: `src/components/AnalysisResult.tsx` (exibição e captura dos esclarecimentos), `src/pages/Index.tsx` (estado e chamada — é esta a página da Análise; `Analise.tsx` não existe), `src/types/analysis.ts` (tipos).

- Cada item de "Riscos Processuais" e "Pontos Fracos" ganha um botão discreto "Esclarecer este ponto" que abre um campo de texto abaixo do item. O texto fica em estado local, indexado pelo texto do item.
- Com pelo menos um esclarecimento preenchido, aparece uma barra fixa no fim do resultado: "Reanalisar com meus esclarecimentos" e um link "Editar o texto antes de reanalisar".
- Caminho (a) só esclarece: reenvia o mesmo `analyzedText` com os esclarecimentos.
- Caminho (b) edita o texto e esclarece: o link volta ao formulário com o texto carregado e os esclarecimentos preservados em estado; ao reanalisar, envia o texto novo, os esclarecimentos e `texto_alterado: true`.
- Nova seção no topo do resultado, só a partir da rodada 2: "Pontos que você esclareceu", com duas listas — resolvidos (com o motivo do aceite) e mantidos (com o motivo). Selo "Rodada N" ao lado do título do resultado.
- O histórico continua gravando o objeto de resultado inteiro, então os campos novos aparecem em `History.tsx` sem alteração.

## Parte 3 — Cota (decisão sua)

Toda reanálise é uma chamada de IA real (duas, na verdade). Hoje o plano Gratuito tem 3 análises/mês, Profissional 40, Escritório 150. Se cada rodada custar 1, seis revisões consomem o mês inteiro do Gratuito e 15% do Profissional.

| Opção | Como funciona | Prós | Contras |
|---|---|---|---|
| A. Cada rodada custa 1 | Nada muda no `rate-limit.ts` | Simples, honesto com o custo, zero código | Gratuito esgota na 3ª rodada; pode reproduzir a frustração que originou o pedido |
| B. Primeira reanálise grátis, demais custam 1 | Pular `checkRateLimit` quando `rodada === 2` | Curva de teste boa, custo controlado | Precisa de controle anti-abuso (senão todo mundo manda "rodada 2") |
| C. Janela de refinamento: até N reanálises por análise original sem cota | Contar rodadas por `analysis_session_id`, N=3 no Profissional, 1 no Gratuito | Melhor experiência, alinhado com o feedback do advogado | Exige rastrear a sessão no servidor, mais código |
| D. Cota separada `reanalise` com limite próprio | Nova chave em `PLAN_LIMITS` (ex.: free 3, profissional 60) | Não come a cota de análises novas; mensurável | Mais um número para o usuário entender |

Recomendação, se quiser uma: **D**, com a UI mostrando "reanálises restantes" junto ao botão. É previsível, não penaliza quem revisa muito e mantém o custo visível. Mas a decisão é sua — nada será implementado antes de você escolher.

## Parte 4 — Persistência

Proposta mais simples que resolve: manter as rodadas em estado do React em `src/pages/Index.tsx` (`rodada`, `esclarecimentos`, `analiseAnterior`), com espelho em `sessionStorage` sob uma chave por aba. Isso sobrevive a recarregar a página e a trocar de aba em "Meu caso", e não exige migração.

Nada muda na tabela `analyses`: os campos novos entram dentro do JSON de `result`, que já é `jsonb`. Se a opção C ou D de cota for escolhida, aí sim entra uma coluna `session_id uuid` em `analyses` ou a contagem por `usage_tracking` com a ação `reanalise` — decidimos junto com a Parte 3.

## Parte 5 — Riscos de regressão

- **Retrocompatibilidade**: sem os campos novos, o prompt, o schema e a resposta ficam idênticos à versão atual. A rodada 1 não muda em nada.
- **Schema da tool**: os dois campos novos não entram em `required`, senão o modelo passa a inventar conteúdo na rodada 1.
- **Tamanho do prompt**: texto de 15.000 caracteres mais análise anterior mais esclarecimentos pode se aproximar do limite; truncar os itens anteriores e limitar a 20 esclarecimentos evita erro de contexto.
- **Correspondência de itens**: o modelo pode reescrever o texto do item, quebrando o casamento com o esclarecimento. Mitigação: numerar os itens no prompt e pedir que `itens_resolvidos`/`itens_mantidos` repitam o texto original; no frontend, casar por índice quando o texto não bater.
- **Histórico**: análises antigas não têm os campos novos; a UI precisa tratar ausência sem quebrar.
- **Cota**: mudança em `rate-limit.ts` afeta todas as funções que a usam; qualquer alteração deve ser aditiva (nova chave), nunca alterar as existentes.

## Ordem de execução sugerida

1. Você decide a opção de cota (Parte 3).
2. Backend: campos opcionais, validação, bloco de prompt, schema, resposta com `rodada`. Publicar e testar a chamada antiga sem parâmetros novos.
3. Tipos em `src/types/analysis.ts`.
4. `AnalysisResult.tsx`: campo de esclarecimento por item, botão de reanálise, seção "Pontos que você esclareceu".
5. `Index.tsx`: estado das rodadas, `sessionStorage`, os dois caminhos (só esclarecer / editar e esclarecer).
6. Se a cota escolhida exigir: ajuste em `rate-limit.ts` e contador na UI.
7. Teste manual com uma petição real: rodada 1, esclarecer dois riscos, rodada 2, confirmar que os resolvidos somem e os mantidos trazem motivo.
