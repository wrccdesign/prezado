

## Plan: Create `cron_ingest_log` table

Create audit log table for the cron ingestion pipeline, restricted to service role only.

### Database migration

Single migration to:
1. Create `cron_ingest_log` table with columns: `id` (uuid PK), `phase` (integer), `total_ingested` (integer), `results` (jsonb), `executed_at` (timestamptz)
2. Enable RLS
3. Add single policy granting full access to `service_role` only

### Technical details

- No public/authenticated access — only edge functions using service role key can read/write
- This table is already referenced by `cron-ingest` edge function but was silently failing because it didn't exist
- No frontend or code changes needed

### Files changed

1. New Supabase migration — `CREATE TABLE cron_ingest_log` + RLS

