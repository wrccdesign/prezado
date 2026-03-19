

## Plan: Fix empty-ementa cards + add date filter

### Root cause

The `search_decisions` FTS function correctly filters `ementa IS NOT NULL AND length >= 50`. But `search_decisions_vector` has NO such filter — vector results without ementa get merged into the final result set, producing empty cards.

### Changes

**1. Migration: Update `search_decisions_vector` + add date filter to both functions**

Add to `search_decisions_vector` WHERE clause:
```sql
AND d.ementa IS NOT NULL
AND length(d.ementa) >= 50
AND d.numero_processo IS NOT NULL
AND d.numero_processo NOT LIKE '%<UNKNOWN>%'
```

Add to BOTH functions:
```sql
AND (d.data_decisao IS NULL OR d.data_decisao >= '2015-01-01')
```

**2. Frontend: Show fallback text when ementa is missing (defensive)**

In `src/pages/Jurisprudencia.tsx` line 309, add an else branch so cards without ementa show `"Ementa não disponível"` in muted italic — as a safety net in case edge cases slip through.

### Files changed

1. New migration — recreate both `search_decisions` and `search_decisions_vector` with the additional filters
2. `src/pages/Jurisprudencia.tsx` — add fallback text for missing ementa

