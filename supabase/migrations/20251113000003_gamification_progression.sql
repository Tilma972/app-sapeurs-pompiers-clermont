-- =====================================================
-- GAMIFICATION 3/7 : TABLES user_progression et xp_history
-- =====================================================

-- Table user_progression
CREATE TABLE IF NOT EXISTS user_progression (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  level INT DEFAULT 1 CHECK (level >= 1 AND level <= 50),
  current_xp INT DEFAULT 0 CHECK (current_xp >= 0),
  total_xp INT DEFAULT 0 CHECK (total_xp >= 0),
  streak_days INT DEFAULT 0 CHECK (streak_days >= 0),
  last_activity_date DATE,
  tokens INT DEFAULT 0 CHECK (tokens >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour leaderboards
CREATE INDEX IF NOT EXISTS idx_user_progression_level ON user_progression(level DESC);
CREATE INDEX IF NOT EXISTS idx_user_progression_total_xp ON user_progression(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_user_progression_streak ON user_progression(streak_days DESC);

-- Table xp_history
CREATE TABLE IF NOT EXISTS xp_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  reason TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour historique utilisateur
CREATE INDEX IF NOT EXISTS idx_xp_history_user ON xp_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_xp_history_reason ON xp_history(reason);

-- RLS user_progression
ALTER TABLE user_progression ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view progressions" ON user_progression;
CREATE POLICY "Everyone can view progressions"
  ON user_progression FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Users can update their own progression" ON user_progression;
CREATE POLICY "Users can update their own progression"
  ON user_progression FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own progression" ON user_progression;
CREATE POLICY "Users can insert their own progression"
  ON user_progression FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS xp_history
ALTER TABLE xp_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own XP history" ON xp_history;
CREATE POLICY "Users can view their own XP history"
  ON xp_history FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own XP history" ON xp_history;
CREATE POLICY "Users can insert their own XP history"
  ON xp_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_user_progression_updated_at ON user_progression;
CREATE TRIGGER update_user_progression_updated_at
  BEFORE UPDATE ON user_progression
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE user_progression IS 'Progression globale : XP, niveau, streak, jetons';
COMMENT ON TABLE xp_history IS 'Historique de tous les gains XP (audit trail)';
