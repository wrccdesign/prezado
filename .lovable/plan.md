

# Plan: Create `orchestrate-scraping` edge function

## New file: `supabase/functions/orchestrate-scraping/index.ts`

**Input:** `{ tribunal?, query, size?, mode? }`
- `tribunal`: optional string or array. If omitted, processes all from `tj_scraping_config`.
- `query`: search terms (required)
- `size`: per-tribunal limit (default 20)
- `mode`: `"all"` (default), `"firecrawl_only"`, `"datajud_only"`

**Logic:**
1. Query `tj_scraping_config` to get all tribunals (or filter by `tribunal` param)
2. For each tribunal, determine which function to call based on `sistema` and `status`:
   - `sistema = 'esaj'` → call `scrape-esaj` (skip if `mode = "datajud_only"`)
   - `sistema = 'proprio'` + `status` in `('active', 'pending')` → call `scrape-tj-proprio` (skip if `mode = "datajud_only"`)
   - `status` in `('no_index', 'active_datajud')` → call `scrape-tj-fallback` (skip if `mode = "firecrawl_only"`)
3. Call each function **sequentially** via internal fetch to `SUPABASE_URL/functions/v1/{function-name}` with service role key auth
4. Collect results per tribunal into a report array
5. Return consolidated `{ total_ingested, total_skipped, total_errors, results: [{tribunal, function_called, ingested, skipped, errors, total_found}] }`

**Key implementation details:**
- Uses `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` for internal function calls
- Sequential processing with `for...of` loop
- 30s timeout awareness: wraps each call in try/catch, records errors gracefully
- If `mode = "datajud_only"`, always routes to `scrape-tj-fallback` regardless of config

## Config update: `supabase/config.toml`

Add:
```toml
[functions.orchestrate-scraping]
verify_jwt = false
```

## Testing

After deployment, invoke with `{ mode: "datajud_only", size: 10, query: "dano moral consumidor", tribunal: ["TJRJ", "TJBA", "TJPE"] }` and report the consolidated results.

