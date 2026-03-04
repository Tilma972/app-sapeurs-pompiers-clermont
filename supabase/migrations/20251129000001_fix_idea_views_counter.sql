-- =====================================================
-- FIX: idea views_count RLS Issue
-- Date: 2025-11-29
-- Description: Fix views counter that fails silently
--
-- Problem: When User A views an idea created by User B,
-- the UPDATE to increment views_count fails due to RLS
-- policy "ideas_update_own" which only allows users to
-- update their own ideas.
--
-- Solution: Create an RPC function with SECURITY DEFINER
-- that allows incrementing views_count regardless of
-- ownership, while still being secure.
-- =====================================================

-- 1. Create RPC function to increment views
CREATE OR REPLACE FUNCTION increment_idea_views(target_idea_id uuid)
RETURNS void
SECURITY DEFINER  -- Execute with function owner's permissions
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Increment views_count atomically
  UPDATE ideas
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = target_idea_id
    AND deleted_at IS NULL
    AND status = 'published';

  -- Note: We only increment for published, non-deleted ideas
  -- This prevents counting views on draft/deleted content
END;
$$;

COMMENT ON FUNCTION increment_idea_views IS
'Increment the view count for an idea. Uses SECURITY DEFINER to bypass RLS.
Only increments for published, non-deleted ideas.';

-- 2. Grant EXECUTE permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_idea_views(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_idea_views(uuid) TO anon;

-- 3. Verification query (commented, for manual testing)
/*
-- Test the function:
SELECT id, views_count FROM ideas WHERE id = 'some-uuid';
SELECT increment_idea_views('some-uuid');
SELECT id, views_count FROM ideas WHERE id = 'some-uuid';
-- views_count should have increased by 1
*/
