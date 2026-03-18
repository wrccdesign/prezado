

## Plan: Add `orgao_julgador` to decision detail page

### File: `src/pages/DecisaoDetalhe.tsx`

1. **Interface** (~line 41): Add `orgao_julgador: string | null` to the `Decision` type.

2. **Import** (~line 19): Add `Gavel` to the lucide-react import.

3. **Render** (~line 239, after the relator span): Add conditional rendering:
```tsx
{decision.orgao_julgador && (
  <span className="flex items-center gap-1">
    <Gavel className="h-3.5 w-3.5" />
    {decision.orgao_julgador}
  </span>
)}
```

No other files changed.

