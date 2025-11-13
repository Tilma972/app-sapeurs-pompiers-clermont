-- =====================================================
-- SYSTÈME DE GAMIFICATION COMPLET
-- =====================================================
-- Description : Tables et fonctions pour badges, XP, niveaux, streaks, défis
-- Date : 2025-11-13
-- =====================================================

-- =====================================================
-- 1. TABLE : badges_definitions
-- Définition de tous les badges disponibles
-- =====================================================
CREATE TABLE IF NOT EXISTS badges_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- emoji ou nom d'icône (ex: '🎯', '🔥', 'trophy')
  category TEXT NOT NULL CHECK (category IN ('starter', 'montant', 'social', 'streak', 'excellence', 'special')),
  rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  xp_reward INT DEFAULT 0 CHECK (xp_reward >= 0),
  unlock_criteria JSONB NOT NULL, -- {type: 'calendars', threshold: 10}
  order_display INT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_badges_category ON badges_definitions(category);
CREATE INDEX IF NOT EXISTS idx_badges_rarity ON badges_definitions(rarity);
CREATE INDEX IF NOT EXISTS idx_badges_active ON badges_definitions(active);

-- =====================================================
-- 2. TABLE : user_badges
-- Badges débloqués par chaque utilisateur
-- =====================================================
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges_definitions(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  seen BOOLEAN DEFAULT FALSE, -- pour notification "nouveau badge"
  UNIQUE(user_id, badge_id)
);

-- Index pour requêtes rapides
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_seen ON user_badges(user_id, seen) WHERE seen = FALSE;

-- =====================================================
-- 3. TABLE : user_progression
-- Progression globale de l'utilisateur (XP, niveau, streak)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_progression (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  level INT DEFAULT 1 CHECK (level >= 1 AND level <= 50),
  current_xp INT DEFAULT 0 CHECK (current_xp >= 0),
  total_xp INT DEFAULT 0 CHECK (total_xp >= 0),
  streak_days INT DEFAULT 0 CHECK (streak_days >= 0),
  last_activity_date DATE,
  tokens INT DEFAULT 0 CHECK (tokens >= 0), -- jetons virtuels pour le shop
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour leaderboards
CREATE INDEX IF NOT EXISTS idx_user_progression_level ON user_progression(level DESC);
CREATE INDEX IF NOT EXISTS idx_user_progression_total_xp ON user_progression(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_user_progression_streak ON user_progression(streak_days DESC);

-- =====================================================
-- 4. TABLE : xp_history
-- Historique de tous les gains d'XP (audit trail)
-- =====================================================
CREATE TABLE IF NOT EXISTS xp_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  reason TEXT NOT NULL, -- 'calendrier_distribue', 'badge_unlocked', 'vote_idee', etc.
  metadata JSONB, -- infos complémentaires (ex: {calendrier_id: '...', montant: 50})
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour historique utilisateur
CREATE INDEX IF NOT EXISTS idx_xp_history_user ON xp_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_xp_history_reason ON xp_history(reason);

-- =====================================================
-- 5. TABLE : challenges_definitions
-- Définition des défis (quotidiens, hebdo, mensuels)
-- =====================================================
CREATE TABLE IF NOT EXISTS challenges_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'monthly', 'event')),
  target_value INT NOT NULL CHECK (target_value > 0),
  target_type TEXT NOT NULL, -- 'calendars', 'votes', 'likes', 'ideas', 'montant', 'team_rank'
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

-- =====================================================
-- 6. TABLE : user_challenges
-- Progression des utilisateurs sur les défis
-- =====================================================
CREATE TABLE IF NOT EXISTS user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges_definitions(id) ON DELETE CASCADE,
  current_progress INT DEFAULT 0 CHECK (current_progress >= 0),
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  period_start DATE NOT NULL, -- pour les défis récurrents (quotidien/hebdo)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, challenge_id, period_start)
);

-- Index pour requêtes
CREATE INDEX IF NOT EXISTS idx_user_challenges_user ON user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_period ON user_challenges(period_start);
CREATE INDEX IF NOT EXISTS idx_user_challenges_completed ON user_challenges(completed);

-- =====================================================
-- 7. TABLE : user_cosmetics
-- Titres, cadres, cosmétiques débloqués/équipés
-- =====================================================
CREATE TABLE IF NOT EXISTS user_cosmetics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('title', 'frame', 'badge_cosmetic')),
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- emoji ou image
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  equipped BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, type, slug)
);

-- Index pour cosmétiques équipés
CREATE INDEX IF NOT EXISTS idx_user_cosmetics_user ON user_cosmetics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_cosmetics_equipped ON user_cosmetics(user_id, equipped) WHERE equipped = TRUE;

-- =====================================================
-- FONCTIONS POSTGRESQL
-- =====================================================

-- =====================================================
-- FONCTION : get_xp_required_for_level
-- Calcule l'XP requis pour atteindre un niveau
-- Formule : niveau * 100 + (niveau^1.5 * 50)
-- =====================================================
CREATE OR REPLACE FUNCTION get_xp_required_for_level(target_level INT)
RETURNS INT AS $$
BEGIN
  IF target_level <= 1 THEN
    RETURN 0;
  END IF;
  RETURN target_level * 100 + FLOOR(POW(target_level, 1.5) * 50)::INT;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- FONCTION : award_xp
-- Attribue de l'XP à un utilisateur et gère la montée de niveau
-- Retourne : new_level, leveled_up, new_xp, tokens_earned
-- =====================================================
CREATE OR REPLACE FUNCTION award_xp(
  p_user_id UUID,
  p_amount INT,
  p_reason TEXT,
  p_metadata JSONB DEFAULT NULL
)
RETURNS TABLE(
  new_level INT,
  leveled_up BOOLEAN,
  new_xp INT,
  tokens_earned INT
) AS $$
DECLARE
  v_current_level INT;
  v_current_xp INT;
  v_new_xp INT;
  v_new_level INT;
  v_xp_required INT;
  v_leveled_up BOOLEAN := FALSE;
  v_tokens_earned INT := 0;
BEGIN
  -- Récupérer progression actuelle (ou initialiser)
  SELECT level, current_xp INTO v_current_level, v_current_xp
  FROM user_progression
  WHERE user_id = p_user_id;

  -- Si pas de progression, initialiser
  IF v_current_level IS NULL THEN
    INSERT INTO user_progression (user_id, level, current_xp, total_xp)
    VALUES (p_user_id, 1, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
    v_current_level := 1;
    v_current_xp := 0;
  END IF;

  -- Ajouter XP
  v_new_xp := v_current_xp + p_amount;
  v_new_level := v_current_level;

  -- Vérifier montée(s) de niveau
  LOOP
    v_xp_required := get_xp_required_for_level(v_new_level + 1);

    -- Si assez d'XP ET pas au niveau max
    IF v_new_xp >= v_xp_required AND v_new_level < 50 THEN
      v_new_xp := v_new_xp - v_xp_required;
      v_new_level := v_new_level + 1;
      v_leveled_up := TRUE;

      -- Récompenses de niveau (jetons)
      IF v_new_level % 5 = 0 THEN
        v_tokens_earned := v_tokens_earned + 10; -- 10 jetons tous les 5 niveaux
      END IF;
      IF v_new_level % 10 = 0 THEN
        v_tokens_earned := v_tokens_earned + 40; -- 40 jetons bonus tous les 10 niveaux (total 50)
      END IF;
    ELSE
      EXIT;
    END IF;
  END LOOP;

  -- Mettre à jour progression
  UPDATE user_progression
  SET
    level = v_new_level,
    current_xp = v_new_xp,
    total_xp = total_xp + p_amount,
    tokens = tokens + v_tokens_earned,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Enregistrer dans l'historique
  INSERT INTO xp_history (user_id, amount, reason, metadata)
  VALUES (p_user_id, p_amount, p_reason, p_metadata);

  -- Retourner résultats
  RETURN QUERY SELECT v_new_level, v_leveled_up, v_new_xp, v_tokens_earned;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FONCTION : update_user_streak
-- Met à jour le streak de l'utilisateur
-- Retourne : nouveau streak
-- =====================================================
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS INT AS $$
DECLARE
  v_last_activity DATE;
  v_current_streak INT;
  v_new_streak INT;
BEGIN
  -- Initialiser si pas de progression
  INSERT INTO user_progression (user_id, level, current_xp, total_xp)
  VALUES (p_user_id, 1, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT last_activity_date, streak_days INTO v_last_activity, v_current_streak
  FROM user_progression
  WHERE user_id = p_user_id;

  -- Si pas d'activité avant
  IF v_last_activity IS NULL THEN
    v_new_streak := 1;
  -- Si dernière activité était hier -> incrémenter
  ELSIF v_last_activity = CURRENT_DATE - INTERVAL '1 day' THEN
    v_new_streak := COALESCE(v_current_streak, 0) + 1;
  -- Si dernière activité était aujourd'hui -> ne rien faire
  ELSIF v_last_activity = CURRENT_DATE THEN
    RETURN COALESCE(v_current_streak, 0);
  -- Si cassé (plus d'un jour) -> reset à 1
  ELSE
    v_new_streak := 1;
  END IF;

  -- Mettre à jour
  UPDATE user_progression
  SET
    streak_days = v_new_streak,
    last_activity_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN v_new_streak;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FONCTION : check_and_unlock_badges
-- Vérifie les critères et débloque les badges automatiquement
-- Retourne : liste des badges débloqués
-- =====================================================
CREATE OR REPLACE FUNCTION check_and_unlock_badges(p_user_id UUID)
RETURNS TABLE(
  badge_id UUID,
  badge_name TEXT,
  badge_icon TEXT,
  xp_awarded INT
) AS $$
DECLARE
  v_badge RECORD;
  v_calendriers_count INT;
  v_montant_total NUMERIC;
  v_streak INT;
  v_level INT;
  v_ideas_count INT;
  v_likes_count INT;
  v_votes_count INT;
  v_unlocked BOOLEAN;
  v_xp_result RECORD;
BEGIN
  -- Récupérer stats utilisateur
  SELECT
    COALESCE(p.calendriers_distribues, 0),
    COALESCE(p.montant_collecte, 0)
  INTO v_calendriers_count, v_montant_total
  FROM profiles_with_equipe_view p
  WHERE p.id = p_user_id;

  -- Progression
  SELECT COALESCE(streak_days, 0), COALESCE(level, 1)
  INTO v_streak, v_level
  FROM user_progression
  WHERE user_id = p_user_id;

  -- Stats sociales
  SELECT COUNT(*) INTO v_ideas_count
  FROM ideas WHERE user_id = p_user_id AND deleted_at IS NULL;

  SELECT COUNT(*) INTO v_likes_count
  FROM gallery_likes WHERE user_id = p_user_id;

  SELECT COUNT(*) INTO v_votes_count
  FROM idea_votes WHERE user_id = p_user_id;

  -- Parcourir tous les badges non débloqués
  FOR v_badge IN
    SELECT bd.* FROM badges_definitions bd
    WHERE bd.active = TRUE
    AND NOT EXISTS (
      SELECT 1 FROM user_badges ub
      WHERE ub.user_id = p_user_id AND ub.badge_id = bd.id
    )
  LOOP
    v_unlocked := FALSE;

    -- Vérifier critères selon le type
    CASE v_badge.unlock_criteria->>'type'
      WHEN 'calendars' THEN
        IF v_calendriers_count >= (v_badge.unlock_criteria->>'threshold')::INT THEN
          v_unlocked := TRUE;
        END IF;
      WHEN 'montant' THEN
        IF v_montant_total >= (v_badge.unlock_criteria->>'threshold')::NUMERIC THEN
          v_unlocked := TRUE;
        END IF;
      WHEN 'streak' THEN
        IF v_streak >= (v_badge.unlock_criteria->>'threshold')::INT THEN
          v_unlocked := TRUE;
        END IF;
      WHEN 'level' THEN
        IF v_level >= (v_badge.unlock_criteria->>'threshold')::INT THEN
          v_unlocked := TRUE;
        END IF;
      WHEN 'ideas' THEN
        IF v_ideas_count >= (v_badge.unlock_criteria->>'threshold')::INT THEN
          v_unlocked := TRUE;
        END IF;
      WHEN 'likes' THEN
        IF v_likes_count >= (v_badge.unlock_criteria->>'threshold')::INT THEN
          v_unlocked := TRUE;
        END IF;
      WHEN 'votes' THEN
        IF v_votes_count >= (v_badge.unlock_criteria->>'threshold')::INT THEN
          v_unlocked := TRUE;
        END IF;
    END CASE;

    -- Si débloqué
    IF v_unlocked THEN
      -- Insérer badge
      INSERT INTO user_badges (user_id, badge_id, seen)
      VALUES (p_user_id, v_badge.id, FALSE)
      ON CONFLICT (user_id, badge_id) DO NOTHING;

      -- Attribuer XP
      IF v_badge.xp_reward > 0 THEN
        SELECT * INTO v_xp_result FROM award_xp(
          p_user_id,
          v_badge.xp_reward,
          'badge_unlocked',
          jsonb_build_object('badge_id', v_badge.id, 'badge_name', v_badge.name)
        );
      END IF;

      -- Retourner badge débloqué
      RETURN QUERY SELECT
        v_badge.id,
        v_badge.name,
        v_badge.icon,
        v_badge.xp_reward;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FONCTION : get_user_rank_global
-- Récupère le rang global de l'utilisateur (par total_xp)
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_rank_global(p_user_id UUID)
RETURNS TABLE(
  rank BIGINT,
  total_users BIGINT,
  percentile NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH ranked_users AS (
    SELECT
      user_id,
      ROW_NUMBER() OVER (ORDER BY total_xp DESC, level DESC) as user_rank
    FROM user_progression
  ),
  user_count AS (
    SELECT COUNT(*) as total FROM user_progression
  )
  SELECT
    ru.user_rank,
    uc.total,
    ROUND((ru.user_rank::NUMERIC / uc.total) * 100, 1) as pct
  FROM ranked_users ru, user_count uc
  WHERE ru.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger pour update automatique de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_badges_definitions_updated_at
  BEFORE UPDATE ON badges_definitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progression_updated_at
  BEFORE UPDATE ON user_progression
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_challenges_definitions_updated_at
  BEFORE UPDATE ON challenges_definitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_challenges_updated_at
  BEFORE UPDATE ON user_challenges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE badges_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progression ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cosmetics ENABLE ROW LEVEL SECURITY;

-- Policies : badges_definitions (lecture publique)
CREATE POLICY "Badges definitions are viewable by everyone"
  ON badges_definitions FOR SELECT
  USING (TRUE);

-- Policies : user_badges (lecture par owner et publique pour stats)
CREATE POLICY "Users can view all badges"
  ON user_badges FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can insert their own badges via functions"
  ON user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies : user_progression (lecture publique pour leaderboards)
CREATE POLICY "Everyone can view progressions"
  ON user_progression FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can update their own progression"
  ON user_progression FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progression"
  ON user_progression FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies : xp_history (lecture par owner)
CREATE POLICY "Users can view their own XP history"
  ON xp_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own XP history"
  ON xp_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies : challenges_definitions (lecture publique)
CREATE POLICY "Challenges are viewable by everyone"
  ON challenges_definitions FOR SELECT
  USING (TRUE);

-- Policies : user_challenges
CREATE POLICY "Users can view their own challenges"
  ON user_challenges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own challenges"
  ON user_challenges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenges"
  ON user_challenges FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies : user_cosmetics
CREATE POLICY "Users can view all cosmetics"
  ON user_cosmetics FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can insert their own cosmetics"
  ON user_cosmetics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cosmetics"
  ON user_cosmetics FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- COMMENTAIRES
-- =====================================================
COMMENT ON TABLE badges_definitions IS 'Définition de tous les badges disponibles dans le système';
COMMENT ON TABLE user_badges IS 'Badges débloqués par les utilisateurs';
COMMENT ON TABLE user_progression IS 'Progression globale : XP, niveau, streak, jetons';
COMMENT ON TABLE xp_history IS 'Historique de tous les gains XP (audit trail)';
COMMENT ON TABLE challenges_definitions IS 'Défis quotidiens, hebdomadaires, mensuels';
COMMENT ON TABLE user_challenges IS 'Progression des utilisateurs sur les défis';
COMMENT ON TABLE user_cosmetics IS 'Titres, cadres et cosmétiques débloqués/équipés';

COMMENT ON FUNCTION get_xp_required_for_level IS 'Calcule l''XP requis pour atteindre un niveau donné';
COMMENT ON FUNCTION award_xp IS 'Attribue de l''XP et gère automatiquement les montées de niveau';
COMMENT ON FUNCTION update_user_streak IS 'Met à jour le streak quotidien de l''utilisateur';
COMMENT ON FUNCTION check_and_unlock_badges IS 'Vérifie et débloque automatiquement les badges éligibles';
COMMENT ON FUNCTION get_user_rank_global IS 'Récupère le rang global de l''utilisateur par XP';
