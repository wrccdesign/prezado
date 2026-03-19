

## Plan: Rebalance RRF weights in search-jurisprudencia

### Changes in `supabase/functions/search-jurisprudencia/index.ts`

**1. Increase vector similarity threshold (line 121)**
- Change `match_threshold: 0.25` → `match_threshold: 0.4`

**2. Apply weighted RRF with k constants (lines 146-170)**

Replace the current RRF merge logic:

- FTS score: `1 / (k_fts + rank)` where `k_fts = 30` (lower k = higher weight)
- Vector score: `1 / (k_vec + rank)` where `k_vec = 60` (higher k = lower weight)
- Vector-only results (no FTS match): only include if `similarity > 0.5`

```text
FTS results:    combined_score = 1 / (30 + idx)
Vector results: combined_score += 1 / (60 + idx)   [if already in map]
Vector-only:    only add if similarity > 0.5, score = 1 / (60 + idx)
```

### Files changed

1. `supabase/functions/search-jurisprudencia/index.ts` — RRF rebalancing + threshold bump

