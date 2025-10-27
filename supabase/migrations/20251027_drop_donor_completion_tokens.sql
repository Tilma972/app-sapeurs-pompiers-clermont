-- 20251027_drop_donor_completion_tokens.sql
-- Purpose: Remove donor_completion_tokens table and related artifacts.
-- Rationale: Deferred donor completion flow was never connected to the current payment flow.

-- Remove from Realtime publication if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'donor_completion_tokens'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.donor_completion_tokens';
  END IF;
END$$;

-- Drop known indexes (defensive; DROP TABLE CASCADE would remove them)
DROP INDEX IF EXISTS public.idx_tokens_transaction;
DROP INDEX IF EXISTS public.idx_tokens_token;

-- Drop RLS policies if table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'donor_completion_tokens'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can select own donor tokens" ON public.donor_completion_tokens';
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert donor tokens for own transactions" ON public.donor_completion_tokens';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update own donor tokens" ON public.donor_completion_tokens';
  END IF;
END$$;

-- Finally drop the table
DROP TABLE IF EXISTS public.donor_completion_tokens CASCADE;
