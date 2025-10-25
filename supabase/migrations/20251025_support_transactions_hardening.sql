-- Hardening for public.support_transactions
-- - Ensure helpful index for idempotence/lookup
-- - Ensure optional email-tracking columns exist
-- - Ensure table is included in Realtime publication

-- 1) Helpful index on stripe_session_id (idempotence / filters)
CREATE INDEX IF NOT EXISTS support_transactions_stripe_session_id_idx
  ON public.support_transactions (stripe_session_id);

-- 2) Optional email tracking columns
ALTER TABLE public.support_transactions
  ADD COLUMN IF NOT EXISTS receipt_sent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS receipt_url text,
  ADD COLUMN IF NOT EXISTS receipt_generated timestamptz;

-- 3) Add to Realtime publication if absent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime'
      AND schemaname='public'
      AND tablename='support_transactions'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.support_transactions';
  END IF;
END $$;
