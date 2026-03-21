

## Plan: Create `usage_tracking` table

Create a new table to track per-user feature usage (searches, chat messages, petitions, etc.), with RLS so users can only insert and view their own records.

### Database migration

Single migration to:
1. Create `usage_tracking` table with columns: `id` (uuid PK), `user_id` (references auth.users), `action` (text), `created_at` (timestamptz)
2. Enable RLS
3. Add INSERT policy — users can insert own rows
4. Add SELECT policy — users can read own rows

### Technical details

- No foreign key to `public.profiles` — references `auth.users(id)` directly (appropriate for internal tracking)
- No UPDATE/DELETE policies — usage records are append-only
- No frontend changes in this step — this just creates the tracking infrastructure

### Files changed

1. New Supabase migration — `CREATE TABLE usage_tracking` + RLS policies

