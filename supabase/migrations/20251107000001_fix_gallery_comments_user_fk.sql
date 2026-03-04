-- Migration corrective : Réparer la foreign key user_id dans gallery_comments
-- Cette migration corrige la référence incorrecte vers auth.users au lieu de profiles

-- 1. Supprimer l'ancienne foreign key constraint (si elle existe)
ALTER TABLE gallery_comments 
DROP CONSTRAINT IF EXISTS gallery_comments_user_id_fkey;

-- 2. Ajouter la nouvelle foreign key vers profiles(id)
ALTER TABLE gallery_comments
ADD CONSTRAINT gallery_comments_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;

-- 3. Vérifier que la relation est bien créée
-- Cette requête devrait retourner des résultats si la FK existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'gallery_comments_user_id_fkey'
    AND table_name = 'gallery_comments'
  ) THEN
    RAISE NOTICE 'Foreign key gallery_comments_user_id_fkey correctement créée vers profiles(id)';
  ELSE
    RAISE EXCEPTION 'Échec de création de la foreign key';
  END IF;
END $$;
