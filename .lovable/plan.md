

# Plan: Switch scrape-esaj from Firecrawl Search to Firecrawl Scrape

## Problem
The current approach uses `Firecrawl Search` (Google-indexed results), which fails for poorly indexed tribunals like TJMS and TJRN.

## Solution
Use `Firecrawl Scrape` directly on the e-SAJ search results page URL with query parameters.

## Changes in `supabase/functions/scrape-esaj/index.ts`

### 1. Update URL mapping (lines 10-16)
Change `ESAJ_URLS` to include full search URL templates with query parameters:

```text
TJSP → https://esaj.tjsp.jus.br/cjsg/consultaCompleta.do?dados.buscaInteiroTeor={query}&pesquisarPor=ementa&tipoDecisao=A
TJCE → https://esaj.tjce.jus.br/cjsg/consultaCompleta.do?dados.buscaInteiroTeor={query}&pesquisarPor=ementa&tipoDecisao=A
TJAM → https://consultasaj.tjam.jus.br/cjsg/consultaCompleta.do?dados.buscaInteiroTeor={query}&pesquisarPor=ementa&tipoDecisao=A
TJMS → https://esaj.tjms.jus.br/cjsg/consultaCompleta.do?dados.buscaInteiroTeor={query}&pesquisarPor=ementa&tipoDecisao=A
TJRN → https://esaj.tjrn.jus.br/cjsg/consultaCompleta.do?dados.buscaInteiroTeor={query}&pesquisarPor=ementa&tipoDecisao=A
```

### 2. Replace Firecrawl Search with Scrape (lines 112-172)
- Build the full URL by replacing `{query}` with the encoded search query
- Call `POST https://api.firecrawl.dev/v1/scrape` with `{ url, formats: ["markdown"], waitFor: 3000 }` instead of the search endpoint
- The `waitFor` parameter gives dynamic e-SAJ pages time to render results
- Extract markdown from `response.data.markdown` (scrape response structure) instead of iterating search results
- Since it's a single page scrape, wrap the markdown directly (no need for multi-result combining)

### 3. Update prompt context (line 33)
Remove the instruction about `--- RESULTADO DE: <url> ---` headers since we're scraping a single page. Instead, tell the AI to extract the `url_decisao` from links found within the page content itself.

### No database or schema changes needed.

