

## Adicionar acesso à página de Planos

### Problema
A página `/planos` existe e funciona, mas não há nenhum link para ela na navegação. O usuário logado não consegue encontrá-la.

### Solução

**1. Adicionar "Planos" no header de navegação (`AppHeader.tsx`)**
- Adicionar item `{ path: "/planos", label: "Planos", icon: Crown }` ao array `navItems` como item secundário (sem `primary: true`)
- Importar o ícone `Crown` do lucide-react

**2. Atualizar links da Landing Page (`LandingPage.tsx`)**
- Verificar se os cards de preço na landing page linkam para `/planos` (e não apenas mostram preço estático)

**3. Verificar redirecionamento de rate limit**
- Confirmar que as páginas que redirecionam para `/planos` ao atingir limite (Chat, Diagnóstico, Petição) estão funcionando

### Resultado
O usuário logado verá "Planos" no menu (desktop: barra de nav; tablet/mobile: menu lateral) com ícone de coroa, levando à página de checkout com os 3 planos.

