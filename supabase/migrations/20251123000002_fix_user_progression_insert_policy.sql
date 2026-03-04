-- Ensure user_progression INSERT policy is properly configured
-- This fixes the RLS error when new users try to create their progression

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can insert own progression" ON user_progression;
DROP POLICY IF EXISTS "Users can insert their own progression" ON user_progression;
DROP POLICY IF EXISTS "Users can view own progression" ON user_progression;
DROP POLICY IF EXISTS "Users can update own progression" ON user_progression;
DROP POLICY IF EXISTS "Users can update their own progression" ON user_progression;
DROP POLICY IF EXISTS "Everyone can view progressions" ON user_progression;

-- Ensure RLS is enabled
ALTER TABLE user_progression ENABLE ROW LEVEL SECURITY;

-- Create clear, explicit policies
CREATE POLICY "user_progression_insert_policy"
  ON user_progression
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_progression_select_policy"
  ON user_progression
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_progression_update_policy"
  ON user_progression
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Do the same for user_badges to ensure functions can insert
DROP POLICY IF EXISTS "Users can view own badges" ON user_badges;
DROP POLICY IF EXISTS "user_badges_select_policy" ON user_badges;

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_badges_select_policy"
  ON user_badges
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Do the same for xp_history
DROP POLICY IF EXISTS "Users can view own xp history" ON xp_history;
DROP POLICY IF EXISTS "xp_history_select_policy" ON xp_history;

ALTER TABLE xp_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "xp_history_select_policy"
  ON xp_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON user_progression TO authenticated;
GRANT SELECT ON user_badges TO authenticated;
GRANT SELECT ON xp_history TO authenticated;
