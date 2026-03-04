-- Migration: Temporary simplified RLS for Realtime debugging
-- Date: 2025-11-24
-- Description: Simplify RLS policy to test if it's blocking Realtime events

-- BACKUP: Save current policy (for reference)
-- Current policy checks: created_at < 10 min AND tournee active AND user_id matches

-- TEMPORARY: Create a very permissive policy for testing
DROP POLICY IF EXISTS "Allow realtime notifications for active payments" ON support_transactions;

-- New policy: Allow reading ANY recent transaction from YOUR tournees (active or not)
-- This is more permissive to test if the statut='active' check was the problem
CREATE POLICY "Allow realtime notifications for active payments"
ON support_transactions
FOR SELECT
USING (
  -- Allow reading transactions from the last 30 minutes (increased window)
  created_at > (NOW() - INTERVAL '30 minutes')
  AND
  -- Only from YOUR tournees (don't check if active)
  EXISTS (
    SELECT 1 FROM tournees t
    WHERE t.id = support_transactions.tournee_id
    AND t.user_id = auth.uid()
    -- Removed: AND t.statut = 'active'  ← Testing without this constraint
  )
);

COMMENT ON POLICY "Allow realtime notifications for active payments"
ON support_transactions IS 'TEMPORARY: Simplified policy for Realtime debugging - allows reading recent transactions from any tournee owned by user';

-- Test query to verify the policy works
-- Replace with your actual user_id and recent transaction
DO $$
DECLARE
  test_user_id UUID := 'YOUR_USER_ID_HERE'; -- Replace with your user ID
  test_pi_id TEXT := 'pi_3SXNx64Iwp2z3Wxn1yOYSek0'; -- Replace with recent PI
  can_read BOOLEAN;
BEGIN
  -- Simulate the RLS check
  PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_id)::text, false);

  SELECT EXISTS (
    SELECT 1 FROM support_transactions
    WHERE stripe_session_id = test_pi_id
  ) INTO can_read;

  IF can_read THEN
    RAISE NOTICE '✅ User CAN read transaction - Realtime should work';
  ELSE
    RAISE NOTICE '❌ User CANNOT read transaction - This is why Realtime fails';
  END IF;
END $$;
