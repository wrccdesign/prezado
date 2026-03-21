

## Plan: Update `search_decisions` function

Apply the provided SQL to recreate the `search_decisions` function with the relaxed content filter — allowing results that have either a valid ementa (≥50 chars) OR a valid resumo_ia (≥30 chars), instead of requiring ementa only.

### What changes

The WHERE clause changes from:
```sql
AND d.ementa IS NOT NULL AND length(d.ementa) >= 50
```
to:
```sql
AND (
  (d.ementa IS NOT NULL AND length(d.ementa) >= 50)
  OR
  (d.resumo_ia IS NOT NULL AND length(d.resumo_ia) >= 30)
)
```

This ensures decisions with AI summaries but no ementa still appear in search results.

### Technical details

- Single migration with `CREATE OR REPLACE FUNCTION` for `search_decisions`
- All other filters remain unchanged (date ≥ 2015, no `<UNKNOWN>`, no procedural results)
- No frontend changes needed — the card already has a fallback for missing ementa

