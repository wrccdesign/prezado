

# Fix: PDF upload "CPU Time exceeded" — regex backtracking

## Problem
The regex on line 29 causes catastrophic backtracking on certain PDFs due to `[^\]]*` inside a repeated alternation group. This hits the Deno CPU time limit (546 error in logs).

## Solution
Replace the complex TJ regex with two separate, simple regexes that cannot backtrack:

1. **`/\(([^)]{1,500})\)\s*Tj/g`** — simple Tj operator
2. **`/\[([^\]]{1,5000})\]\s*TJ/g`** — simple TJ array operator, then extract inner `(...)` strings

Additionally, wrap `extractPdfText` in a try-catch so any failure gracefully falls through to the OCR path instead of crashing.

## Files

| Action | File |
|--------|------|
| Edit | `supabase/functions/parse-document/index.ts` — fix regex, add safety |

## Changes

**`extractPdfText`**: Split into two non-backtracking passes:
- Pass 1: Match `(text) Tj` with `/\(([^)]{1,500})\)\s*Tj/gi`
- Pass 2: Match `[...] TJ` with `/\[([^\]]{1,5000})\]\s*TJ/gi`, then extract `(text)` fragments from each match
- Keep MAX_ITERATIONS guard
- Wrap entire function in try-catch, return empty string on failure (triggers OCR fallback)

