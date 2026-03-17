

# Fix: Bug in scrape-esaj causing runtime crash

## Problem

Line 218 contains a leftover reference from the old OpenAI format:

```typescript
console.log(`AI extracted ${decisions.length} decisions. Raw args first 500:`, toolCall.function.arguments.substring(0, 500));
```

`toolCall` is undefined — this crashes the function after Anthropic returns successfully. The function also timed out during testing (Firecrawl search + Anthropic extraction exceeds the default edge function timeout).

## Fix

**File:** `supabase/functions/scrape-esaj/index.ts`

1. **Line 218** — Replace the broken `toolCall` reference with a valid log using `JSON.stringify(parsedDecisions).substring(0, 500)`:
   ```typescript
   console.log(`AI extracted ${decisions.length} decisions`);
   ```

2. **No other changes needed** — the rest of the Anthropic integration is correct.

## Validation

After fixing, re-test with `{ tribunal: "TJSP", query: "dano moral consumidor", size: 3 }` (smaller size to reduce timeout risk).

