

# Plano: Corrigir Contraste do Botão na Landing Page

## Problema

O botão "Ver Funcionalidades" na hero section aparece todo branco porque o `variant="outline"` do componente Button aplica `bg-background` (cream) — sobre o fundo navy, fica sem contraste e visualmente quebrado.

A landing page **já está aparecendo** corretamente para visitantes não logados. O problema é apenas visual no botão.

## Correção

### `src/pages/LandingPage.tsx` — Linha ~185

Remover `variant="outline"` e usar classes manuais para o botão transparente sobre fundo escuro:

```tsx
// De:
<Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 text-base">

// Para:
<Button size="lg" className="bg-transparent border border-white/20 text-white hover:bg-white/10 text-base">
```

Isso remove o `bg-background` injetado pelo variant e garante fundo transparente com borda branca sutil — exatamente como no print de referência.

## Escopo
- Apenas 1 linha alterada em `LandingPage.tsx`
- Nenhuma outra alteração

