-- =====================================================
-- VÉRIFICATION - Triggers et fonctions de la galerie
-- =====================================================

-- 1. Vérifier que le trigger existe
SELECT
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgtype,
  tgenabled
FROM pg_trigger
WHERE tgname = 'gallery_likes_count_trigger';

-- 2. Vérifier que la fonction existe
SELECT
  proname as function_name,
  pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'update_photo_likes_count';

-- 3. Test manuel du trigger
-- Compter les likes actuels pour une photo
SELECT
  p.id,
  p.title,
  p.likes_count as likes_count_column,
  (SELECT COUNT(*) FROM gallery_likes WHERE photo_id = p.id) as actual_likes_count,
  p.likes_count - (SELECT COUNT(*) FROM gallery_likes WHERE photo_id = p.id) as difference
FROM gallery_photos p
ORDER BY p.created_at DESC
LIMIT 10;

-- 4. Si le trigger ne fonctionne pas, recalculer tous les likes_count
-- DÉCOMMENTEZ CI-DESSOUS POUR FORCER LA MISE À JOUR :

-- UPDATE gallery_photos
-- SET likes_count = (
--   SELECT COUNT(*)
--   FROM gallery_likes
--   WHERE gallery_likes.photo_id = gallery_photos.id
-- );
