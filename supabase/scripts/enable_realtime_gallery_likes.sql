-- =====================================================
-- GALERIE - Activation Realtime sur gallery_likes
-- Date: 2025-11-15
-- Description: Active Realtime pour synchronisation des likes
-- =====================================================

-- Activer Realtime sur la table gallery_likes
ALTER PUBLICATION supabase_realtime ADD TABLE gallery_likes;

-- Vérifier que c'est bien activé
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
  AND tablename = 'gallery_likes';
