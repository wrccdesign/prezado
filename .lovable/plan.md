

# Plan: Add insufficient content fallback + test 16 remaining TJs

## Change 1: Mark `no_index` when combined content < 200 chars (lines 185-192)

Replace the current `combinedMarkdown.length < 200` block to also update `tj_scraping_config` with `status: "no_index"` and return `needs_fallback: true`, matching the zero-results behavior:

```typescript
if (combinedMarkdown.length < 200) {
  await supabase
    .from("tj_scraping_config")
    .update({ status: "no_index" })
    .eq("tribunal", tribunalUpper);

  return new Response(JSON.stringify({
    ingested: 0, skipped: 0,
    errors: ["Conteúdo insuficiente nos resultados da busca"],
    total_found: 0,
    needs_fallback: true,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
```

## Change 2: Test all 16 remaining TJs

After deploying, invoke `scrape-tj-proprio` sequentially for TJBA, TJPE, TJMA, TJPA, TJMT, TJAL, TJSE, TJPB, TJPI, TJES, TJTO, TJRO, TJAC, TJAP, TJRR, TJDF with `query: "dano moral consumidor", size: 3` and compile a summary table.

**File:** `supabase/functions/scrape-tj-proprio/index.ts` (single edit, lines 185-192)

