-- =====================================================
-- GAMIFICATION 2/7 : TABLE user_badges
-- =====================================================

CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges_definitions(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  seen BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, badge_id)
);

-- Index pour requêtes rapides
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_seen ON user_badges(user_id, seen) WHERE seen = FALSE;

-- RLS
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all badges" ON user_badges;
CREATE POLICY "Users can view all badges"
  ON user_badges FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Users can insert their own badges via functions" ON user_badges;
CREATE POLICY "Users can insert their own badges via functions"
  ON user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE user_badges IS 'Badges débloqués par les utilisateurs';
