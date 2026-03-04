-- Fix gamification functions to use SECURITY DEFINER
-- This allows the functions to create user_progression records for new users
-- while respecting RLS policies for normal user queries

-- FONCTION : award_xp (with SECURITY DEFINER)
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
)
SECURITY DEFINER
SET search_path = public
AS $$
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

-- FONCTION : update_user_streak (with SECURITY DEFINER)
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS INT
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- Si jamais connecté ou première fois
  IF v_last_activity IS NULL THEN
    v_new_streak := 1;
  -- Si dernier jour était hier, continuer le streak
  ELSIF v_last_activity = CURRENT_DATE - INTERVAL '1 day' THEN
    v_new_streak := COALESCE(v_current_streak, 0) + 1;
  -- Si c'est aujourd'hui, ne rien changer
  ELSIF v_last_activity = CURRENT_DATE THEN
    RETURN COALESCE(v_current_streak, 0);
  -- Sinon streak cassé
  ELSE
    v_new_streak := 1;
  END IF;

  -- Mettre à jour
  UPDATE user_progression
  SET
    last_activity_date = CURRENT_DATE,
    streak_days = v_new_streak,
    longest_streak = GREATEST(longest_streak, v_new_streak),
    updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN v_new_streak;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_user_streak IS 'Met à jour le streak de connexion quotidien';

-- FONCTION : check_and_unlock_badges (with SECURITY DEFINER)
DROP FUNCTION IF EXISTS check_and_unlock_badges(UUID);

CREATE OR REPLACE FUNCTION check_and_unlock_badges(p_user_id UUID)
RETURNS TABLE(
  badge_id UUID,
  badge_name TEXT,
  badge_icon TEXT,
  xp_awarded INT
)
SECURITY DEFINER
SET search_path = public
AS $$
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

COMMENT ON FUNCTION check_and_unlock_badges IS 'Vérifie et débloque automatiquement les badges éligibles';
