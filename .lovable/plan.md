

# Plan: Improve extraction prompt and tool schema for scrape-esaj

## Changes in `supabase/functions/scrape-esaj/index.ts`

### 1. Update `EXTRACTION_SYSTEM_PROMPT` (lines 18-29)
Add explicit rules:
- `numero_processo`: must be CNJ format (NNNNNNN-DD.AAAA.J.TT.OOOO)
- `data_decisao`: YYYY-MM-DD, return `null` if not found
- `orgao_julgador`: full name of chamber/turma, return `null` if not found -- NEVER return `<UNKNOWN>`
- `relator`: full name, return `null` if not found -- NEVER return `<UNKNOWN>`
- `ementa`: complete text
- `comarca`: city/comarca of origin, extract from process number or text, `null` if not found
- `url_decisao`: specific URL of the individual decision page (from the `--- RESULTADO DE: <url> ---` header), NOT a generic search URL

### 2. Update `EXTRACTION_TOOL` schema (lines 31-64)
Add two new fields to the tool's `properties`:
- `comarca`: `{ type: "string", description: "Comarca de origem" }`
- `url_decisao`: `{ type: "string", description: "URL específica da decisão" }`

Update `required` array to include `numero_processo`.

### 3. Update database mapping (lines 230-248)
- Map `dec.comarca` to `comarca` field
- Map `dec.url_decisao` to `source_url` instead of the hardcoded `searchUrl`
- Remove the hardcoded `searchUrl` variable (line 109)

### No database changes needed
The `decisions` table already has `comarca` and `source_url` columns.

