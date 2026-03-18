

## Plan: Add `orgao_julgador` to search results

### 1. Database migration — Update `search_decisions` function
Add `d.orgao_julgador` to the SELECT list in the `search_decisions` function, and update the RETURNS TABLE to include `orgao_julgador text`.

### 2. Frontend — `src/pages/Jurisprudencia.tsx`
- Add `orgao_julgador: string | null` to the `Decision` interface.
- Add `Gavel` to the lucide-react imports.
- Below the relator line (~line 305), add a conditional render for `orgao_julgador` with a Gavel icon, matching the existing style (`text-xs text-muted-foreground`).

No other files or logic changed.

