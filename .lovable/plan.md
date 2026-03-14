

# Fix: Extracted PDF text still contains garbage — validate final result

## Problem
The regex extraction produces fragments that individually pass the 60% readability check, but the combined text is still mostly binary noise. This garbage gets sent to the analysis AI, which responds with "Documento Ininteligível."

The threshold check (`extractedText.length < 50`) only checks **length**, not **quality**. A PDF with 500+ chars of semi-readable binary passes the length check but is useless.

## Solution
After sanitizing the extracted text, run `isReadableText()` on the **final combined result**. If it fails, discard and fall through to OCR.

## Changes

**`supabase/functions/parse-document/index.ts`** — 1 edit:

In the PDF handler (around line 173-184), after `sanitizeText`, add a readability check on the full extracted text:

```typescript
extractedText = extractPdfText(bytes);
extractedText = sanitizeText(extractedText);

// NEW: Validate overall quality, not just length
if (extractedText && extractedText.length >= 50 && !isReadableText(extractedText)) {
  console.log(`Extracted text failed readability check, falling back to OCR...`);
  extractedText = "";
}

// Existing OCR fallback continues as-is
if (!extractedText || extractedText.length < 50) { ... }
```

This ensures that even if regex produces 1000+ chars of noise, the system automatically falls back to OCR instead of sending garbage to the analysis.

