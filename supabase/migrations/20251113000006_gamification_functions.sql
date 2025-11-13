-- =====================================================
-- GAMIFICATION 6/7 : FONCTIONS POSTGRESQL
-- =====================================================

-- FONCTION : get_xp_required_for_level
CREATE OR REPLACE FUNCTION get_xp_required_for_level(target_level INT)
RETURNS INT AS $$
BEGIN
  IF target_level <= 1 THEN
    RETURN 0;
  END IF;
  RETURN target_level * 100 + FLOOR(POW(target_level, 1.5) * 50)::INT;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION get_xp_required_for_level IS 'Calcule l''XP requis pour atteindre un niveau donné';

-- FONCTION : award_xp
-- Drop si existe déjà (pour éviter conflit de signature)
DROP FUNCTION IF EXISTS award_xp(UUID, INT, TEXT, JSONB);

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
        v_tokens_earned := v_tokens_earned + 10;
      END IF;
      IF v_new_level % 10 = 0 THEN
        v_tokens_earned := v_tokens_earned + 40;
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

COMMENT ON FUNCTION award_xp IS 'Attribue de l''XP et gère automatiquement les montées de niveau';

-- FONCTION : update_user_streak
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

COMMENT ON FUNCTION update_user_streak IS 'Met à jour le streak quotidien de l''utilisateur';

-- FONCTION : get_user_rank_global
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

COMMENT ON FUNCTION get_user_rank_global IS 'Récupère le rang global de l''utilisateur par XP';
