-- =====================================================
-- GAMIFICATION 5/7 : TABLE user_cosmetics
-- =====================================================

CREATE TABLE IF NOT EXISTS user_cosmetics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('title', 'frame', 'badge_cosmetic')),
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  equipped BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, type, slug)
);

-- Index pour cosmétiques équipés
CREATE INDEX IF NOT EXISTS idx_user_cosmetics_user ON user_cosmetics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_cosmetics_equipped ON user_cosmetics(user_id, equipped) WHERE equipped = TRUE;

-- RLS
ALTER TABLE user_cosmetics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all cosmetics" ON user_cosmetics;
CREATE POLICY "Users can view all cosmetics"
  ON user_cosmetics FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Users can insert their own cosmetics" ON user_cosmetics;
CREATE POLICY "Users can insert their own cosmetics"
  ON user_cosmetics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own cosmetics" ON user_cosmetics;
CREATE POLICY "Users can update their own cosmetics"
  ON user_cosmetics FOR UPDATE
  USING (auth.uid() = user_id);

COMMENT ON TABLE user_cosmetics IS 'Titres, cadres et cosmétiques débloqués/équipés';
