

## Plan: Add rate limiting to edge functions + frontend 429 handling

### Overview

Create a shared rate-limit helper, integrate it into 4 edge functions, and handle 429 responses in the frontend with a toast + redirect to `/planos`.

### 1. Create shared rate-limit module

**File:** `supabase/functions/_shared/rate-limit.ts`

- Export `checkRateLimit(userId, action, supabaseUrl, supabaseServiceKey)` 
- Daily limits: search=20, chat=10, diagnostico=5, peticao=3
- Count today's rows in `usage_tracking` for user+action
- If under limit, insert new row and return `{ allowed: true, used, limit }`
- If at/over limit, return `{ allowed: false, used, limit }`

### 2. Add rate limiting to edge functions

For each function, extract user from JWT token. If authenticated, call `checkRateLimit`. If not allowed, return 429 with `limit_reached: true`. If user is not authenticated, skip rate limiting (allow public/anonymous access where applicable).

**Functions to modify:**

| Function | Action key | Auth pattern |
|---|---|---|
| `search-jurisprudencia` | `"search"` | Optional auth (public endpoint) — extract token if present |
| `chat-juris` | `"chat"` | Optional auth — extract token if present |
| `diagnostico-juridico` | `"diagnostico"` | Already has auth — add check after existing auth |
| `generate-petition` | `"peticao"` | Already has auth — add check after existing auth |

For `search-jurisprudencia` and `chat-juris` (currently no auth required): attempt to get user from Authorization header; if present, check rate limit; if absent, skip.

For `diagnostico-juridico` and `generate-petition` (already authenticated): add rate limit check right after the existing `getUser` call.

### 3. Frontend 429 handling

Modify 4 pages to detect `limit_reached` in 429 responses and show a toast with "Ver planos" action:

- **`src/pages/Jurisprudencia.tsx`** — in `handleSearch`, parse 429 response JSON, check `limit_reached`, show toast with action button linking to `/planos`
- **`src/pages/Chat.tsx`** — in `handleSend`, same pattern on 429
- **`src/pages/Diagnostico.tsx`** — in `handleAnalyze`, same pattern on 429
- **`src/pages/Petition.tsx`** — in `handleGenerate`, detect error from `supabase.functions.invoke` with 429 status, show toast

### Technical details

- The shared module uses `createClient` with service role key to bypass RLS for counting (the RLS SELECT policy only allows own-user reads, but service role can read all)
- Insert after count check uses service role too, so it works regardless of auth context
- No `/planos` page exists yet — the toast button will navigate there; the page can be built separately
- No subscription/plan table yet — all users get the same "free" limits for now

### Files changed

1. **New:** `supabase/functions/_shared/rate-limit.ts`
2. **Edit:** `supabase/functions/search-jurisprudencia/index.ts` — add optional auth + rate limit
3. **Edit:** `supabase/functions/chat-juris/index.ts` — add optional auth + rate limit  
4. **Edit:** `supabase/functions/diagnostico-juridico/index.ts` — add rate limit after auth
5. **Edit:** `supabase/functions/generate-petition/index.ts` — add rate limit after auth
6. **Edit:** `src/pages/Jurisprudencia.tsx` — handle 429 with limit_reached toast
7. **Edit:** `src/pages/Chat.tsx` — handle 429 with limit_reached toast
8. **Edit:** `src/pages/Diagnostico.tsx` — handle 429 with limit_reached toast
9. **Edit:** `src/pages/Petition.tsx` — handle 429 with limit_reached toast

