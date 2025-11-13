-- =====================================================
-- GAMIFICATION 4/7 : TABLES challenges
-- =====================================================

-- Table challenges_definitions
CREATE TABLE IF NOT EXISTS challenges_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'monthly', 'event')),
  target_value INT NOT NULL CHECK (target_value > 0),
  target_type TEXT NOT NULL,
  xp_reward INT DEFAULT 0 CHECK (xp_reward >= 0),
  token_reward INT DEFAULT 0 CHECK (token_reward >= 0),
  active BOOLEAN DEFAULT TRUE,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour filtrage
CREATE INDEX IF NOT EXISTS idx_challenges_type ON challenges_definitions(type);
CREATE INDEX IF NOT EXISTS idx_challenges_active ON challenges_definitions(active) WHERE active = TRUE;

-- Table user_challenges
CREATE TABLE IF NOT EXISTS user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges_definitions(id) ON DELETE CASCADE,
  current_progress INT DEFAULT 0 CHECK (current_progress >= 0),
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  period_start DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, challenge_id, period_start)
);

-- Index pour requêtes
CREATE INDEX IF NOT EXISTS idx_user_challenges_user ON user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_period ON user_challenges(period_start);
CREATE INDEX IF NOT EXISTS idx_user_challenges_completed ON user_challenges(completed);

-- RLS challenges_definitions
ALTER TABLE challenges_definitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Challenges are viewable by everyone" ON challenges_definitions;
CREATE POLICY "Challenges are viewable by everyone"
  ON challenges_definitions FOR SELECT
  USING (TRUE);

-- RLS user_challenges
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own challenges" ON user_challenges;
CREATE POLICY "Users can view their own challenges"
  ON user_challenges FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own challenges" ON user_challenges;
CREATE POLICY "Users can insert their own challenges"
  ON user_challenges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own challenges" ON user_challenges;
CREATE POLICY "Users can update their own challenges"
  ON user_challenges FOR UPDATE
  USING (auth.uid() = user_id);

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_challenges_definitions_updated_at ON challenges_definitions;
CREATE TRIGGER update_challenges_definitions_updated_at
  BEFORE UPDATE ON challenges_definitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_challenges_updated_at ON user_challenges;
CREATE TRIGGER update_user_challenges_updated_at
  BEFORE UPDATE ON user_challenges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE challenges_definitions IS 'Défis quotidiens, hebdomadaires, mensuels';
COMMENT ON TABLE user_challenges IS 'Progression des utilisateurs sur les défis';
