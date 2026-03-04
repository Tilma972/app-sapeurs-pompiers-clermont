-- =====================================================
-- GALERIE - Système de Commentaires
-- Date: 2025-11-06
-- Description: Table comments + triggers + RLS
-- =====================================================

-- 1. Créer la table gallery_comments
CREATE TABLE IF NOT EXISTS gallery_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID REFERENCES gallery_photos(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Contenu
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 2000),
  
  -- Modération
  is_flagged BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Soft delete
  deleted_at TIMESTAMPTZ
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_gallery_comments_photo ON gallery_comments(photo_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_gallery_comments_user ON gallery_comments(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_gallery_comments_created_at ON gallery_comments(created_at DESC);

-- Commentaires
COMMENT ON TABLE gallery_comments IS 'Commentaires sur les photos de la galerie';
COMMENT ON COLUMN gallery_comments.content IS 'Contenu du commentaire (1-2000 caractères)';
COMMENT ON COLUMN gallery_comments.is_flagged IS 'Commentaire signalé par un utilisateur';
COMMENT ON COLUMN gallery_comments.deleted_at IS 'Soft delete timestamp';

-- 2. Trigger auto-update updated_at
CREATE OR REPLACE FUNCTION update_gallery_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS gallery_comments_updated_at_trigger ON gallery_comments;
CREATE TRIGGER gallery_comments_updated_at_trigger
BEFORE UPDATE ON gallery_comments
FOR EACH ROW
EXECUTE FUNCTION update_gallery_comments_updated_at();

-- 3. Fonction pour recalculer comments_count
CREATE OR REPLACE FUNCTION recalculate_photo_comments_count(target_photo_id UUID)
RETURNS VOID AS $$
DECLARE
  total_count INT;
BEGIN
  SELECT COUNT(*) INTO total_count
  FROM gallery_comments
  WHERE photo_id = target_photo_id AND deleted_at IS NULL;
  
  UPDATE gallery_photos
  SET comments_count = total_count
  WHERE id = target_photo_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION recalculate_photo_comments_count IS 'Recalcule le comments_count d''une photo';

-- 4. Trigger pour mettre à jour comments_count automatiquement
CREATE OR REPLACE FUNCTION trigger_update_photo_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM recalculate_photo_comments_count(NEW.photo_id);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Si changement de deleted_at ou de photo_id
    IF (OLD.deleted_at IS DISTINCT FROM NEW.deleted_at) OR (OLD.photo_id != NEW.photo_id) THEN
      PERFORM recalculate_photo_comments_count(OLD.photo_id);
      IF OLD.photo_id != NEW.photo_id THEN
        PERFORM recalculate_photo_comments_count(NEW.photo_id);
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM recalculate_photo_comments_count(OLD.photo_id);
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS gallery_comments_count_trigger ON gallery_comments;
CREATE TRIGGER gallery_comments_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON gallery_comments
FOR EACH ROW
EXECUTE FUNCTION trigger_update_photo_comments_count();

-- 5. RLS Policies
ALTER TABLE gallery_comments ENABLE ROW LEVEL SECURITY;

-- SELECT: Tout le monde peut voir les commentaires non supprimés et non flaggés
DROP POLICY IF EXISTS "Anyone can view comments" ON gallery_comments;
CREATE POLICY "Anyone can view comments"
ON gallery_comments FOR SELECT
TO authenticated
USING (deleted_at IS NULL AND is_flagged = false);

-- SELECT: Users peuvent voir leurs propres commentaires (tous états)
DROP POLICY IF EXISTS "Users can view own comments" ON gallery_comments;
CREATE POLICY "Users can view own comments"
ON gallery_comments FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- SELECT: Admins peuvent tout voir
DROP POLICY IF EXISTS "Admins can view all comments" ON gallery_comments;
CREATE POLICY "Admins can view all comments"
ON gallery_comments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- INSERT: Users authentifiés peuvent commenter
DROP POLICY IF EXISTS "Users can insert comments" ON gallery_comments;
CREATE POLICY "Users can insert comments"
ON gallery_comments FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND auth.uid() IS NOT NULL
);

-- UPDATE: Users peuvent modifier leurs commentaires
DROP POLICY IF EXISTS "Users can update own comments" ON gallery_comments;
CREATE POLICY "Users can update own comments"
ON gallery_comments FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Admins peuvent tout modifier (pour flagging)
DROP POLICY IF EXISTS "Admins can update all comments" ON gallery_comments;
CREATE POLICY "Admins can update all comments"
ON gallery_comments FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- DELETE: Admins uniquement (hard delete)
DROP POLICY IF EXISTS "Admins can delete comments" ON gallery_comments;
CREATE POLICY "Admins can delete comments"
ON gallery_comments FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 6. Vérification : Afficher la structure créée
SELECT 
  'gallery_comments' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'gallery_comments'
ORDER BY ordinal_position;
