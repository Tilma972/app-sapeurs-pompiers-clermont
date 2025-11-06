-- =====================================================
-- GALERIE - Système de Likes
-- Date: 2025-11-06
-- Description: Table likes + triggers + RLS
-- =====================================================

-- 1. Créer la table gallery_likes
CREATE TABLE IF NOT EXISTS gallery_likes (
  photo_id UUID REFERENCES gallery_photos(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (photo_id, user_id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_gallery_likes_photo ON gallery_likes(photo_id);
CREATE INDEX IF NOT EXISTS idx_gallery_likes_user ON gallery_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_gallery_likes_created_at ON gallery_likes(created_at DESC);

-- Commentaires
COMMENT ON TABLE gallery_likes IS 'Likes des utilisateurs sur les photos de la galerie';
COMMENT ON COLUMN gallery_likes.photo_id IS 'Photo likée';
COMMENT ON COLUMN gallery_likes.user_id IS 'Utilisateur qui like';

-- 2. Fonction trigger pour mettre à jour likes_count automatiquement
CREATE OR REPLACE FUNCTION update_photo_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Incrémenter le compteur
    UPDATE gallery_photos
    SET likes_count = likes_count + 1
    WHERE id = NEW.photo_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Décrémenter le compteur (minimum 0)
    UPDATE gallery_photos
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.photo_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Attacher le trigger
DROP TRIGGER IF EXISTS gallery_likes_count_trigger ON gallery_likes;
CREATE TRIGGER gallery_likes_count_trigger
AFTER INSERT OR DELETE ON gallery_likes
FOR EACH ROW EXECUTE FUNCTION update_photo_likes_count();

-- 3. RLS Policies
ALTER TABLE gallery_likes ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut voir les likes (pour compter)
DROP POLICY IF EXISTS "Anyone can view likes" ON gallery_likes;
CREATE POLICY "Anyone can view likes"
ON gallery_likes FOR SELECT
TO authenticated
USING (true);

-- Les utilisateurs peuvent ajouter leurs propres likes
DROP POLICY IF EXISTS "Users can insert own likes" ON gallery_likes;
CREATE POLICY "Users can insert own likes"
ON gallery_likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs propres likes
DROP POLICY IF EXISTS "Users can delete own likes" ON gallery_likes;
CREATE POLICY "Users can delete own likes"
ON gallery_likes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 4. Vérification : Afficher la structure créée
SELECT 
  'gallery_likes' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'gallery_likes'
ORDER BY ordinal_position;
