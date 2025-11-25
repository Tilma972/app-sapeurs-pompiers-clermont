-- Migration: Enable Realtime for support_transactions table
-- Date: 2025-11-24
-- Description: Add support_transactions to Realtime publication for instant payment notifications

-- Check if the table is already in the publication
DO $$
BEGIN
  -- Add support_transactions to the supabase_realtime publication
  -- This allows the PaymentCardModal to receive instant INSERT notifications
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'support_transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE support_transactions;
    RAISE NOTICE 'support_transactions added to supabase_realtime publication';
  ELSE
    RAISE NOTICE 'support_transactions already in supabase_realtime publication';
  END IF;
END $$;

-- Verify the table is now published
DO $$
DECLARE
  is_published BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'support_transactions'
  ) INTO is_published;

  IF is_published THEN
    RAISE NOTICE '✅ Realtime enabled for support_transactions - payment notifications will be instant';
  ELSE
    RAISE WARNING '❌ Failed to enable Realtime for support_transactions';
  END IF;
END $$;
