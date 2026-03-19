

## Plan: UI hierarchy fix + filter junk results

### Ajuste 1 — Card hierarchy in `src/pages/Jurisprudencia.tsx`

Restructure each result card (lines 271-392):

- **Top of card**: badges row — tribunal, resultado, comarca_pequena (Interior), date — unchanged layout, already correct
- **Ementa as hero**: move ementa up to right after badges, increase to `text-sm font-medium leading-relaxed text-foreground` with `line-clamp-3`
- **Processo number**: move below ementa, `text-xs font-mono text-muted-foreground`
- **Relator + orgao_julgador**: small text below processo, same line or stacked, `text-xs text-muted-foreground`
- **Comarca highlight**: if `comarca_pequena === true`, add a visible `MapPin` + comarca name near relator area

Concrete card structure:
```
[Badges: TJSP | Provido | Interior | 2º Grau]     [date]
Ementa text with line-clamp-3, prominent...
Proc. 1234567-89.2024.8.26.0001
Rel. Des. Fulano · 3ª Câmara Cível · Comarca X/SP
[Ver mais] [Citar] [Fonte]
```

### Ajuste 2 — SQL filter in `search_decisions` function

New migration to recreate `search_decisions` adding 3 WHERE conditions:

```sql
AND d.ementa IS NOT NULL
AND length(d.ementa) >= 50
AND (d.resultado IS NULL OR d.resultado NOT IN ('Em andamento', 'Distribuição', 'Em Andamento / Distribuição'))
```

This filters at the database level so junk results never reach the client.

### Files changed

1. `src/pages/Jurisprudencia.tsx` — card layout restructure
2. New Supabase migration — updated `search_decisions` function

