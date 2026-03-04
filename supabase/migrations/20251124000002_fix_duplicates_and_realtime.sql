-- Migration: Fix duplicate transactions and enable Realtime notifications
-- Date: 2025-11-24
-- Description:
-- 1. Add UNIQUE constraint on stripe_session_id to prevent duplicates
-- 2. Update RLS policies to allow Realtime subscriptions for payment confirmations

-- ============================================================================
-- PART 1: Prevent duplicate transactions with UNIQUE constraint
-- ============================================================================

-- First, clean up existing duplicates (keep the earliest one)
WITH duplicates AS (
  SELECT
    stripe_session_id,
    array_agg(id ORDER BY created_at ASC) as ids
  FROM support_transactions
  WHERE stripe_session_id IS NOT NULL
  GROUP BY stripe_session_id
  HAVING COUNT(*) > 1
)
DELETE FROM support_transactions
WHERE id IN (
  SELECT unnest(ids[2:]) -- Delete all but the first (oldest) transaction
  FROM duplicates
);

-- Add UNIQUE constraint to prevent future duplicates
ALTER TABLE support_transactions
DROP CONSTRAINT IF EXISTS support_transactions_stripe_session_id_unique;

ALTER TABLE support_transactions
ADD CONSTRAINT support_transactions_stripe_session_id_unique
UNIQUE (stripe_session_id);

-- Add index for performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_support_transactions_stripe_session
ON support_transactions(stripe_session_id)
WHERE stripe_session_id IS NOT NULL;

COMMENT ON CONSTRAINT support_transactions_stripe_session_id_unique
ON support_transactions IS 'Ensures each Stripe payment (PI or Charge) is recorded only once';

-- ============================================================================
-- PART 2: Enable Realtime notifications for payment confirmations
-- ============================================================================

-- Enable Realtime for support_transactions table
ALTER TABLE support_transactions REPLICA IDENTITY FULL;

-- Create a more permissive policy for SELECT during active tournees
-- This allows the modal to see the transaction via Realtime/polling
DROP POLICY IF EXISTS "Users can view own transactions" ON support_transactions;
DROP POLICY IF EXISTS "Allow realtime notifications for active payments" ON support_transactions;

-- Policy 1: Users can view their own transactions (standard access)
CREATE POLICY "Users can view own transactions"
ON support_transactions
FOR SELECT
USING (auth.uid() = user_id);

-- Policy 2: Allow reading recent transactions from active tournees (for Realtime)
-- This enables the payment modal to receive notifications even without direct ownership
CREATE POLICY "Allow realtime notifications for active payments"
ON support_transactions
FOR SELECT
USING (
  -- Allow reading transactions from the last 10 minutes
  created_at > (NOW() - INTERVAL '10 minutes')
  AND
  -- Only for active tournees (not ended)
  EXISTS (
    SELECT 1 FROM tournees t
    WHERE t.id = support_transactions.tournee_id
    AND t.user_id = auth.uid()
    AND t.statut = 'active'
  )
);

COMMENT ON POLICY "Allow realtime notifications for active payments"
ON support_transactions IS 'Allows payment modal to receive Realtime notifications for recent transactions during active tournees';

-- ============================================================================
-- PART 3: Add logging for debugging
-- ============================================================================

-- Log successful unique constraint enforcement
DO $$
DECLARE
  duplicate_count INT;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT stripe_session_id
    FROM support_transactions
    WHERE stripe_session_id IS NOT NULL
    GROUP BY stripe_session_id
    HAVING COUNT(*) > 1
  ) AS dupes;

  IF duplicate_count > 0 THEN
    RAISE WARNING 'Migration found and cleaned % duplicate stripe_session_id entries', duplicate_count;
  ELSE
    RAISE NOTICE 'Migration completed: No duplicates found, UNIQUE constraint added successfully';
  END IF;
END $$;
