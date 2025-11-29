-- =====================================================
-- Enable Realtime for Idea Votes
-- Date: 2025-11-29
-- Description: Enable realtime subscriptions for idea votes
--
-- This allows clients to subscribe to vote changes and
-- see live updates when other users vote on ideas,
-- similar to the gallery likes feature.
-- =====================================================

-- 1. Enable realtime for idea_votes table
ALTER PUBLICATION supabase_realtime ADD TABLE idea_votes;

-- 2. Enable realtime for ideas table (for views_count updates)
-- Note: Check if already enabled first
DO $$
BEGIN
  -- Check if ideas table is already in the publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'ideas'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE ideas;
  END IF;
END $$;

COMMENT ON TABLE idea_votes IS
'Votes on ideas (upvote/downvote). Realtime enabled for live vote updates.';

-- 3. Verification query (for manual testing)
/*
-- Check which tables have realtime enabled:
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- Should include:
-- - idea_votes ✓
-- - ideas ✓
-- - gallery_likes ✓ (already enabled)
*/
