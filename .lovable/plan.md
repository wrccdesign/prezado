# Histórico: texto original e salvamento sob controle do usuário

## Como funciona hoje (verificado)

- Ao clicar em "Analisar Texto", a função de análise grava automaticamente um registro na tabela `analyses` do banco (Lovable Cloud), com: texto original (até 50 mil caracteres), nome do arquivo e o resultado da IA.
- O registro fica salvo **para sempre**, até você apagar manualmente pelo ícone de lixeira no Histórico. Só você enxerga os seus registros.
- Espaço hoje: 12 análises ocupando cerca de 216 kB no total. É irrisório — mesmo com milhares de análises isso não chega perto de um limite de custo.
- O texto original **já está salvo** no banco; a tela de detalhe do Histórico simplesmente não o exibe.

## O que muda

### 1. Mostrar o texto original no Histórico
Na tela de detalhe de uma análise, adicionar um bloco recolhível "Texto analisado" acima do resultado, com o conteúdo original em fonte monoespaçada, rolagem própria e botão de copiar. Nos cards da lista, manter o resumo como está.

### 2. Salvar só o que o usuário quiser
Deixar de gravar automaticamente. Novo fluxo na Home:

```text
Analisar Texto  ->  resultado na tela  ->  botão "Salvar no histórico"
                                          (vira "Salvo no histórico" após clicar)
```

- A função de análise passa a devolver o resultado sem gravar.
- Na tela de resultado, ao lado dos botões de exportar, entra o botão "Salvar no histórico"; ele grava texto original, nome do arquivo e resultado, e some/desabilita depois de salvo.
- Um aviso discreto abaixo do resultado: "Esta análise não fica salva a menos que você clique em Salvar."
- Análises já existentes no histórico permanecem intactas.

### 3. Diagnóstico
O Diagnóstico não grava nada hoje, então segue sem mudança. Se quiser o mesmo botão "Salvar" lá, é só dizer — precisa de tabela nova.

## Detalhes técnicos

- `supabase/functions/analyze-legal-text/index.ts`: remover o `insert` em `analyses`; devolver o texto normalizado junto do resultado.
- `src/components/AnalysisResult.tsx`: nova prop opcional (texto original + callback de salvar) para renderizar o botão e o estado "salvo".
- `src/pages/Index.tsx`: guardar o texto usado na análise e fazer o insert em `analyses` a partir do cliente (as políticas de acesso já permitem inserir apenas os próprios registros).
- `src/pages/History.tsx`: renderizar `input_text` no detalhe com bloco recolhível e botão copiar.
- Sem migração de banco; sem alteração de cotas (a análise continua consumindo cota no momento da análise, não no salvamento).
