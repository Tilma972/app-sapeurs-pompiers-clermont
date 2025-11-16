-- =====================================================
-- FIX - Recalculer likes_count et réactiver trigger
-- Date: 2025-11-15
-- =====================================================

-- 1. Recalculer tous les likes_count pour toutes les photos
UPDATE gallery_photos
SET likes_count = (
  SELECT COUNT(*)
  FROM gallery_likes
  WHERE gallery_likes.photo_id = gallery_photos.id
);

-- 2. Vérifier que le trigger existe et le recréer si nécessaire
DROP TRIGGER IF EXISTS gallery_likes_count_trigger ON gallery_likes;

CREATE TRIGGER gallery_likes_count_trigger
AFTER INSERT OR DELETE ON gallery_likes
FOR EACH ROW EXECUTE FUNCTION update_photo_likes_count();

-- 3. Vérifier le résultat
SELECT
  id,
  title,
  likes_count as column_value,
  (SELECT COUNT(*) FROM gallery_likes WHERE photo_id = gallery_photos.id) as actual_count,
  likes_count = (SELECT COUNT(*) FROM gallery_likes WHERE photo_id = gallery_photos.id) as is_synced
FROM gallery_photos
ORDER BY created_at DESC
LIMIT 10;
