-- =====================================================
-- GAMIFICATION 7/7 : FONCTION check_and_unlock_badges
-- =====================================================

-- Drop si existe déjà (pour éviter conflit de signature)
DROP FUNCTION IF EXISTS check_and_unlock_badges(UUID);

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

COMMENT ON FUNCTION check_and_unlock_badges IS 'Vérifie et débloque automatiquement les badges éligibles';
