

# Implementation Plan: e-SAJ Scraper + TJ Config Table

All pre-requisites are met. Both `ANTHROPIC_API_KEY` and `FIRECRAWL_API_KEY` are available as secrets.

## Item 4 — New edge function `scrape-esaj/index.ts`

Create `supabase/functions/scrape-esaj/index.ts`:

1. Receives `{ tribunal, query, size }` — validates tribunal is one of TJSP/TJCE/TJAM/TJMS/TJRN
2. Maps tribunal to e-SAJ base URL
3. Calls **Firecrawl scrape API** (`https://api.firecrawl.dev/v1/scrape`) with the full search URL including query params (`dados.buscaInteiroTeor`, `pesquisarPor=ementa`, `tipoDecisao=A`), getting markdown back
4. Sends scraped markdown to **Anthropic Messages API** (`https://api.anthropic.com/v1/messages`) with `claude-sonnet-4-20250514` using tool_use to extract an array of decisions
5. Anthropic tool format uses `input_schema` (not OpenAI's `parameters`):
   ```typescript
   tools: [{
     name: "extract_decisions",
     description: "...",
     input_schema: { type: "object", properties: { decisions: { type: "array", items: { ... } } } }
   }]
   ```
6. For each extracted decision, upserts into `decisions` with `onConflict: 'numero_processo'`, `source: 'scraping_esaj'`
7. Returns `{ ingested, skipped, errors, total_found }`

**Config:** Add `[functions.scrape-esaj] verify_jwt = false` to `supabase/config.toml`.

## Item 5 — Migration: `tj_scraping_config` table

Create table and seed all 27 TJs:
- 5 e-SAJ (TJSP, TJCE, TJAM, TJMS, TJRN) with `sistema = 'esaj'`
- 1 PJe (TJGO) with `sistema = 'pje'`
- 21 remaining with `sistema = 'proprio'`

Enable RLS with public SELECT only.

## Item 6 — Test

Deploy `scrape-esaj`, then call it with `{ tribunal: "TJSP", query: "dano moral consumidor", size: 5 }` and report results.

## Files created/edited
1. `supabase/functions/scrape-esaj/index.ts` — new
2. `supabase/config.toml` — add `[functions.scrape-esaj]` entry
3. Migration SQL — `tj_scraping_config` table + 27 TJ seed rows

No changes to `ingest-datajud` or any other existing code.

