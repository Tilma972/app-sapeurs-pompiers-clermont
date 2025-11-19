-- Fix RLS policy for user_progression table
-- Allow users to insert their own progression record

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert own progression" ON user_progression;
DROP POLICY IF EXISTS "Users can view own progression" ON user_progression;
DROP POLICY IF EXISTS "Users can update own progression" ON user_progression;

-- Create comprehensive policies for user_progression
CREATE POLICY "Users can insert own progression"
  ON user_progression
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own progression"
  ON user_progression
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progression"
  ON user_progression
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Also ensure RLS is enabled
ALTER TABLE user_progression ENABLE ROW LEVEL SECURITY;

-- Same fixes for user_badges
DROP POLICY IF EXISTS "Users can view own badges" ON user_badges;
CREATE POLICY "Users can view own badges"
  ON user_badges
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- XP history
DROP POLICY IF EXISTS "Users can view own xp history" ON xp_history;
CREATE POLICY "Users can view own xp history"
  ON xp_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- User challenges
DROP POLICY IF EXISTS "Users can view own challenges" ON user_challenges;
DROP POLICY IF EXISTS "Users can insert own challenges" ON user_challenges;

CREATE POLICY "Users can view own challenges"
  ON user_challenges
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own challenges"
  ON user_challenges
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- User cosmetics
DROP POLICY IF EXISTS "Users can view own cosmetics" ON user_cosmetics;
CREATE POLICY "Users can view own cosmetics"
  ON user_cosmetics
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Public read access for definitions (badges, challenges)
DROP POLICY IF EXISTS "Anyone can view badge definitions" ON badges_definitions;
CREATE POLICY "Anyone can view badge definitions"
  ON badges_definitions
  FOR SELECT
  TO authenticated
  USING (active = true);

DROP POLICY IF EXISTS "Anyone can view challenge definitions" ON challenges_definitions;
CREATE POLICY "Anyone can view challenge definitions"
  ON challenges_definitions
  FOR SELECT
  TO authenticated
  USING (active = true);
