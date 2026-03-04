-- =====================================================
-- Ideas Monitoring & Reconciliation Functions
-- Date: 2025-11-29
-- Description: Functions to monitor and fix vote/view counters
--
-- Provides tools for:
-- - Detecting desynchronized counters
-- - Fixing votes_count from idea_votes table
-- - Monitoring vote activity
-- - Analytics queries
-- =====================================================

-- =====================================================
-- 1. RECONCILIATION FUNCTIONS
-- =====================================================

-- Recalcule votes_count pour une idée spécifique
CREATE OR REPLACE FUNCTION reconcile_idea_votes_single(target_idea_id uuid)
RETURNS TABLE(
  idea_id uuid,
  old_count int,
  new_count int,
  upvotes int,
  downvotes int,
  was_fixed boolean
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_old_count int;
  v_upvotes int;
  v_downvotes int;
  v_new_count int;
BEGIN
  -- Récupérer l'ancien count
  SELECT ideas.votes_count INTO v_old_count
  FROM ideas
  WHERE id = target_idea_id;

  -- Compter les vrais votes
  SELECT
    COUNT(*) FILTER (WHERE vote_type = 'up') AS ups,
    COUNT(*) FILTER (WHERE vote_type = 'down') AS downs
  INTO v_upvotes, v_downvotes
  FROM idea_votes
  WHERE idea_votes.idea_id = target_idea_id;

  v_new_count := COALESCE(v_upvotes, 0) - COALESCE(v_downvotes, 0);

  -- Mettre à jour si différent
  IF v_old_count IS DISTINCT FROM v_new_count THEN
    UPDATE ideas
    SET votes_count = v_new_count
    WHERE id = target_idea_id;

    RETURN QUERY SELECT
      target_idea_id,
      v_old_count,
      v_new_count,
      v_upvotes,
      v_downvotes,
      true;
  ELSE
    RETURN QUERY SELECT
      target_idea_id,
      v_old_count,
      v_new_count,
      v_upvotes,
      v_downvotes,
      false;
  END IF;
END;
$$;

COMMENT ON FUNCTION reconcile_idea_votes_single IS
'Reconcile votes_count for a single idea. Returns old/new counts and whether it was fixed.';

-- Recalcule votes_count pour TOUTES les idées
CREATE OR REPLACE FUNCTION reconcile_all_idea_votes()
RETURNS TABLE(
  idea_id uuid,
  old_count int,
  new_count int,
  difference int
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH vote_counts AS (
    SELECT
      idea_votes.idea_id,
      COUNT(*) FILTER (WHERE vote_type = 'up') AS upvotes,
      COUNT(*) FILTER (WHERE vote_type = 'down') AS downvotes
    FROM idea_votes
    GROUP BY idea_votes.idea_id
  ),
  corrections AS (
    SELECT
      ideas.id AS idea_id,
      ideas.votes_count AS old_count,
      COALESCE(vote_counts.upvotes, 0) - COALESCE(vote_counts.downvotes, 0) AS new_count
    FROM ideas
    LEFT JOIN vote_counts ON ideas.id = vote_counts.idea_id
    WHERE ideas.deleted_at IS NULL
      AND ideas.votes_count IS DISTINCT FROM (COALESCE(vote_counts.upvotes, 0) - COALESCE(vote_counts.downvotes, 0))
  )
  UPDATE ideas
  SET votes_count = corrections.new_count
  FROM corrections
  WHERE ideas.id = corrections.idea_id
  RETURNING
    corrections.idea_id,
    corrections.old_count,
    corrections.new_count,
    corrections.new_count - corrections.old_count AS difference;
END;
$$;

COMMENT ON FUNCTION reconcile_all_idea_votes IS
'Reconcile votes_count for ALL ideas. Returns list of fixed ideas with old/new counts.
Use this in a cron job or after detecting desync issues.';

-- =====================================================
-- 2. MONITORING & ANALYTICS FUNCTIONS
-- =====================================================

-- Détecte les idées avec votes_count désynchronisés
CREATE OR REPLACE FUNCTION detect_vote_desync()
RETURNS TABLE(
  idea_id uuid,
  titre text,
  stored_count int,
  actual_count int,
  difference int,
  upvotes bigint,
  downvotes bigint
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH vote_counts AS (
    SELECT
      idea_votes.idea_id,
      COUNT(*) FILTER (WHERE vote_type = 'up') AS ups,
      COUNT(*) FILTER (WHERE vote_type = 'down') AS downs
    FROM idea_votes
    GROUP BY idea_votes.idea_id
  )
  SELECT
    ideas.id AS idea_id,
    ideas.titre,
    ideas.votes_count AS stored_count,
    COALESCE(vote_counts.ups, 0) - COALESCE(vote_counts.downs, 0) AS actual_count,
    (COALESCE(vote_counts.ups, 0) - COALESCE(vote_counts.downs, 0)) - ideas.votes_count AS difference,
    COALESCE(vote_counts.ups, 0) AS upvotes,
    COALESCE(vote_counts.downs, 0) AS downvotes
  FROM ideas
  LEFT JOIN vote_counts ON ideas.id = vote_counts.idea_id
  WHERE ideas.deleted_at IS NULL
    AND ideas.votes_count IS DISTINCT FROM (COALESCE(vote_counts.ups, 0) - COALESCE(vote_counts.downs, 0))
  ORDER BY ABS((COALESCE(vote_counts.ups, 0) - COALESCE(vote_counts.downs, 0)) - ideas.votes_count) DESC;
END;
$$;

COMMENT ON FUNCTION detect_vote_desync IS
'Detect ideas with desynchronized votes_count. Returns ideas where stored count differs from actual votes.';

-- Statistiques de votes par utilisateur (avec rate limiting check)
CREATE OR REPLACE FUNCTION get_user_vote_stats(target_user_id uuid)
RETURNS TABLE(
  total_votes bigint,
  upvotes bigint,
  downvotes bigint,
  votes_last_24h bigint,
  votes_remaining int,
  last_vote_at timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint AS total_votes,
    COUNT(*) FILTER (WHERE vote_type = 'up')::bigint AS upvotes,
    COUNT(*) FILTER (WHERE vote_type = 'down')::bigint AS downvotes,
    (
      SELECT COUNT(*)::bigint
      FROM idea_vote_log
      WHERE user_id = target_user_id
        AND voted_at > now() - interval '24 hours'
    ) AS votes_last_24h,
    GREATEST(0, 50 - (
      SELECT COUNT(*)::int
      FROM idea_vote_log
      WHERE user_id = target_user_id
        AND voted_at > now() - interval '24 hours'
    )) AS votes_remaining,
    MAX(idea_votes.created_at) AS last_vote_at
  FROM idea_votes
  WHERE idea_votes.user_id = target_user_id;
END;
$$;

COMMENT ON FUNCTION get_user_vote_stats IS
'Get vote statistics for a user including rate limit info (50 votes/24h).';

-- Top idées par votes
CREATE OR REPLACE FUNCTION get_top_ideas_by_votes(result_limit int DEFAULT 10)
RETURNS TABLE(
  idea_id uuid,
  titre text,
  votes_count int,
  upvotes bigint,
  downvotes bigint,
  views_count int,
  comments_count int,
  author_name text,
  created_at timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH vote_details AS (
    SELECT
      idea_votes.idea_id,
      COUNT(*) FILTER (WHERE vote_type = 'up') AS ups,
      COUNT(*) FILTER (WHERE vote_type = 'down') AS downs
    FROM idea_votes
    GROUP BY idea_votes.idea_id
  )
  SELECT
    ideas.id AS idea_id,
    ideas.titre,
    ideas.votes_count,
    COALESCE(vote_details.ups, 0) AS upvotes,
    COALESCE(vote_details.downs, 0) AS downvotes,
    ideas.views_count,
    ideas.comments_count,
    COALESCE(profiles.first_name || ' ' || profiles.last_name, 'Anonyme') AS author_name,
    ideas.created_at
  FROM ideas
  LEFT JOIN vote_details ON ideas.id = vote_details.idea_id
  LEFT JOIN profiles ON ideas.user_id = profiles.id
  WHERE ideas.status = 'published'
    AND ideas.deleted_at IS NULL
  ORDER BY ideas.votes_count DESC, ideas.created_at DESC
  LIMIT result_limit;
END;
$$;

COMMENT ON FUNCTION get_top_ideas_by_votes IS
'Get top ideas by vote count with detailed stats.';

-- =====================================================
-- 3. GRANT PERMISSIONS
-- =====================================================

-- Admin functions (réconciliation)
GRANT EXECUTE ON FUNCTION reconcile_idea_votes_single(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION reconcile_all_idea_votes() TO authenticated;

-- Monitoring functions (lecture seule, accessible aux users)
GRANT EXECUTE ON FUNCTION detect_vote_desync() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_vote_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_ideas_by_votes(int) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_ideas_by_votes(int) TO anon;

-- =====================================================
-- 4. EXAMPLE QUERIES (commented)
-- =====================================================

/*
-- Détecter les désynchronisations
SELECT * FROM detect_vote_desync();

-- Corriger toutes les idées désynchronisées
SELECT * FROM reconcile_all_idea_votes();

-- Corriger une idée spécifique
SELECT * FROM reconcile_idea_votes_single('uuid-here');

-- Stats d'un utilisateur
SELECT * FROM get_user_vote_stats('user-uuid-here');

-- Top 10 idées
SELECT * FROM get_top_ideas_by_votes(10);

-- Créer un cron job pour réconciliation quotidienne (avec pg_cron si disponible)
-- SELECT cron.schedule(
--   'reconcile-idea-votes',
--   '0 3 * * *', -- 3h du matin tous les jours
--   $$ SELECT * FROM reconcile_all_idea_votes(); $$
-- );
*/
