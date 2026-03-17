

# Plan: Switch scrape-esaj to Anthropic Claude claude-sonnet-4-20250514

## Change

Replace the Lovable AI gateway (Gemini) call in `scrape-esaj/index.ts` (lines 170-230) with a direct Anthropic Messages API call.

### What changes in `supabase/functions/scrape-esaj/index.ts`:

1. **Remove** `LOVABLE_API_KEY` usage and the OpenAI-format tool wrapper (lines 170-181)
2. **Replace** the fetch call (lines 183-201) with Anthropic's `https://api.anthropic.com/v1/messages` endpoint using:
   - `ANTHROPIC_API_KEY` via `Deno.env.get("ANTHROPIC_API_KEY")`
   - Model: `claude-sonnet-4-20250514`
   - Headers: `x-api-key` + `anthropic-version: 2023-06-01`
   - Anthropic tool format: `tools: [{ name, description, input_schema }]` (already defined as `EXTRACTION_TOOL` at line 31)
   - `tool_choice: { type: "tool", name: "extract_decisions" }`
   - Messages: `system` as top-level param, not in messages array
3. **Replace** response parsing (lines 209-230): Anthropic returns `content` array with `type: "tool_use"` blocks containing `input` (already parsed object, no JSON.parse needed)

### No other files change.

