

# Plan: Create `scrape-tj-proprio` edge function

## New file: `supabase/functions/scrape-tj-proprio/index.ts`

Clone the pattern from `scrape-esaj/index.ts` with these differences:

1. **URL mapping**: Replace `ESAJ_URLS` with `TJ_PROPRIO_URLS` containing all 21 tribunals (TJRJ, TJMG, TJRS, TJPR, TJSC, TJBA, TJPE, TJMA, TJPA, TJMT, TJAL, TJSE, TJPB, TJPI, TJES, TJTO, TJRO, TJAC, TJAP, TJRR, TJDF) with their respective domain URLs.

2. **System prompt**: Adapt to say "portal de jurisprudência do tribunal" instead of "e-SAJ". Same extraction rules (CNJ format, null for missing fields, no `<UNKNOWN>`).

3. **Firecrawl Search query**: Build as `site:{domain} {query} acórdão ementa` using the hostname from the URL mapping (same approach as scrape-esaj).

4. **Source field**: Use `"scraping_tj_proprio"` instead of `"scraping_esaj"`.

5. **External ID prefix**: Use `tjproprio_` instead of `esaj_`.

6. **Error/log messages**: Reference `scrape-tj-proprio`.

Everything else identical: same `EXTRACTION_TOOL` schema, same `sanitizeDate`, same Anthropic call with `claude-sonnet-4-20250514`, same upsert logic, same `tj_scraping_config` update.

## Config update: `supabase/config.toml`

Add:
```toml
[functions.scrape-tj-proprio]
verify_jwt = false
```

## Testing

After creation, invoke the function for TJRJ, TJMG, TJRS, TJPR, TJSC with `query: "dano moral consumidor", size: 3` and report results.

