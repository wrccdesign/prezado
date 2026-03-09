
# Implementação de UI Responsiva com Burger Menu

## Problema Identificado
O `AppHeader.tsx` atual tem múltiplos botões em linha horizontal (linhas 48-105) que causam problemas em telas menores:
- Em mobile/tablet, os botões saem da tela ou se sobrepõem
- Não há versão mobile do menu de navegação
- O header não é responsivo

## Solução Proposta

### 1. Refatorar `src/components/AppHeader.tsx`
**Implementar design responsivo com:**
- **Desktop**: Menu horizontal atual (mantido para `md:` e acima)
- **Mobile/Tablet**: Burger menu usando componente `Sheet` do shadcn

**Estrutura:**
```typescript
// Desktop navigation (hidden em mobile)
<nav className="hidden md:flex items-center gap-2">
  {/* botões atuais */}
</nav>

// Mobile burger menu (visível só em mobile)
<Sheet>
  <SheetTrigger asChild>
    <Button variant="ghost" size="icon" className="md:hidden">
      <Menu className="h-5 w-5" />
    </Button>
  </SheetTrigger>
  <SheetContent side="right">
    {/* Navigation items verticais */}
  </SheetContent>
</Sheet>
```

### 2. Melhorar Responsividade Geral
**Identificar e corrigir:**
- Cards e grids que não se adaptam bem em mobile
- Textos que podem quebrar mal
- Botões que ficam muito pequenos ou grandes
- Espaçamentos inconsistentes

### 3. Componente de Navegação Móvel
**Criar uma lista vertical de navegação para o drawer:**
- Logo e profile badge no topo
- Items de menu empilhados verticalmente
- Botão "Sair" no final
- Fechar drawer automaticamente ao navegar

### 4. Testar Responsividade
**Verificar em diferentes tamanhos:**
- Mobile portrait (375px)
- Mobile landscape (667px) 
- Tablet (768px)
- Desktop (1024px+)

## Arquivos Modificados
- `src/components/AppHeader.tsx` (refatoração completa)
- Possíveis ajustes em páginas específicas se identificados problemas adicionais

## Imports Adicionais Necessários
- `Sheet, SheetContent, SheetTrigger` do shadcn
- `Menu` ícone do lucide-react
