-- =====================================================
-- FIX - Fonction pour lister les photos avec compteurs réels
-- Date: 2025-11-16
-- =====================================================

-- Fonction RPC pour récupérer les photos avec les VRAIS compteurs de likes
CREATE OR REPLACE FUNCTION list_photos_with_real_counts(
  p_category text DEFAULT NULL,
  p_author_id uuid DEFAULT NULL,
  p_limit int DEFAULT 48,
  p_before timestamptz DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  title text,
  description text,
  image_url text,
  thumbnail_url text,
  category text,
  taken_at timestamptz,
  status text,
  likes_count bigint,
  comments_count bigint,
  reports_count int,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.user_id,
    p.title,
    p.description,
    p.image_url,
    p.thumbnail_url,
    p.category::text,
    p.taken_at,
    p.status::text,
    -- Compter les VRAIS likes au lieu d'utiliser la colonne
    (SELECT COUNT(*) FROM gallery_likes WHERE photo_id = p.id)::bigint as likes_count,
    -- Compter les VRAIS commentaires
    (SELECT COUNT(*) FROM gallery_comments WHERE photo_id = p.id AND deleted_at IS NULL)::bigint as comments_count,
    p.reports_count,
    p.created_at
  FROM gallery_photos p
  WHERE
    (p_category IS NULL OR p.category::text = p_category)
    AND (p_author_id IS NULL OR p.user_id = p_author_id)
    AND (p_before IS NULL OR p.created_at < p_before)
  ORDER BY p.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commenter la fonction
COMMENT ON FUNCTION list_photos_with_real_counts IS
'Récupère les photos avec les compteurs de likes et commentaires calculés en temps réel au lieu dutiliser les colonnes qui dépendent des triggers';
