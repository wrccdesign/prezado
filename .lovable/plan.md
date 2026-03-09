

# Plano: Adicionar Footer nas Páginas Internas

## O que será feito

Criar um componente `src/components/AppFooter.tsx` reutilizável com informações úteis e o crédito WRCC Design, e incluí-lo em todas as 7 páginas internas que já usam o `AppHeader`.

## Componente AppFooter

- Fundo: `#060e1a` (mesmo do footer da landing page)
- Borda superior dourada sutil
- Layout: 3 colunas no desktop, stack no mobile
  - **Plataforma**: links para Análise, Petição, Chat, Calculadoras
  - **Recursos**: links para Diagnóstico, Histórico, Painel Advogado
  - **Sobre**: texto breve "JurisAI — Inteligência Artificial Jurídica Brasileira"
- Linha inferior: "© 2026 JurisAI. Todos os direitos reservados."
- Última linha: "Desenvolvido por WRCC Design" com link para `https://www.wrcc.design` (abre em nova aba)

## Páginas que receberão o footer

Adicionar `<AppFooter />` antes do fechamento do `</div>` principal em:
1. `Index.tsx`
2. `Diagnostico.tsx`
3. `Petition.tsx`
4. `Chat.tsx`
5. `Calculators.tsx`
6. `LawyerDashboard.tsx`
7. `History.tsx`

## Nada mais será alterado
- Landing page já tem seu próprio footer (apenas adicionarei o link WRCC lá também)
- Rotas, lógica e banco de dados intactos

