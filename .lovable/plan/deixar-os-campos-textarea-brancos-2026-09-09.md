# Deixar os campos textarea brancos

## Objetivo
Tornar o fundo de todos os campos `<Textarea>` branco, mantendo o restante do estilo (borda, foco, tipografia) intacto e respeitando os tokens do tema.

## Alterações
1. **Tokens de cor** (`src/index.css`)
   - Adicionar `--input-background: 0 0% 100%` no `:root`.
   - Adicionar `--input-background` no `.dark` apontando para a superfície escura padrão do tema, para não quebrar o modo escuro.

2. **Tailwind** (`tailwind.config.ts`)
   - Registrar a cor `input-background: "hsl(var(--input-background))"` no objeto `colors`, ao lado de `input`.

3. **Componente** (`src/components/ui/textarea.tsx`)
   - Trocar `bg-background` por `bg-input-background`.
   - Manter `ring-offset-background` e todos os estados de foco/desabilitado.

## Validação
- Rodar `bun run build` para confirmar que não há regressão de typecheck/build.
- Capturar screenshots dos principais pontos com textarea (Chat, Petição, Diagnóstico/Meu caso) para confirmar fundo branco.
- Verificar visualmente que o estado de foco e o modo escuro continuam consistentes.

## Escopo
Apenas o componente `Textarea`. Se o usuário quiser estender para inputs de linha única, isso será tratado em ajuste separado.
