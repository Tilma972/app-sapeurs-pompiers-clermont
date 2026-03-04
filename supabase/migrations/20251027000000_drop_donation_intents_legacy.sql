-- 20251027_drop_donation_intents_legacy.sql
-- Purpose: Remove legacy donation_intents table and dependent objects after migrating to Payment Intents flow.
-- This migration is idempotent and safe to run multiple times.

-- Remove table from Supabase Realtime publication if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'donation_intents'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.donation_intents';
  END IF;
END$$;

-- Drop known indexes explicitly (optional; DROP TABLE ... CASCADE will remove them too)
DROP INDEX IF EXISTS public.idx_donation_intents_status;
DROP INDEX IF EXISTS public.idx_donation_intents_expires;
DROP INDEX IF EXISTS public.idx_donation_intents_tournee;
DROP INDEX IF EXISTS public.idx_donation_intents_active;
DROP INDEX IF EXISTS public.idx_donation_intents_stripe;

-- Drop any RLS policies if they exist (optional; DROP TABLE ... CASCADE also removes them)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'donation_intents'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Enable read access" ON public.donation_intents';
    EXECUTE 'DROP POLICY IF EXISTS "Enable insert access" ON public.donation_intents';
    EXECUTE 'DROP POLICY IF EXISTS "Enable update access" ON public.donation_intents';
    EXECUTE 'DROP POLICY IF EXISTS "Enable delete access" ON public.donation_intents';
  END IF;
END$$;

-- Finally, drop the legacy table
DROP TABLE IF EXISTS public.donation_intents CASCADE;

-- If a temporary/renamed legacy table exists, drop it too
DROP TABLE IF EXISTS public.donation_intents_legacy CASCADE;
