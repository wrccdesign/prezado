# Corrigir contraste do botão "Entrar como Cidadão"

## Problema
Na seção "Para quem" da landing page, o botão **"Entrar como Cidadão"** (card de Cidadãos) está com texto claro sobre fundo claro, ficando ilegível em mobile/desktop. O botão usa `variant="outline"` do shadcn Button, que aplica `bg-background` do tema; sobre o card escuro (`bg-white/5` em fundo navy), o background claro do tema quebra o contraste.

## Solução
Ajustar o botão para forçar fundo transparente e manter texto branco legível:

- Substituir `variant="outline"` por implementação explícita no `className`.
- Aplicar `bg-transparent border-white/20 text-white hover:bg-white/10` para garantir contraste sobre o card escuro.
- Preservar o comportamento/link existente (`asChild`, `<Link to="/auth">`).

## Escopo
- Arquivo: `src/pages/LandingPage.tsx`
- Linha-alvo: botão "Entrar como Cidadão" (~linha 489).
- Não alterar textos, rotas, funcionalidades ou outros componentes.

## Verificação
- Reabrir a landing page no preview mobile.
- Confirmar que o texto "Entrar como Cidadão" é legível (contraste branco sobre fundo escuro/translúcido).
- Confirmar que o hover permanece visível.
