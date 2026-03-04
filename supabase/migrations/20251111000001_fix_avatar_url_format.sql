-- Migration: Correction des avatar_url stockés
-- Date: 2025-11-11
-- Description: Nettoyer les avatar_url incorrects (UUID ou URL complète) vers chemin relatif

-- 1. Supprimer les avatar_url qui contiennent des UUID invalides
-- (UUID sont de la forme: 8-4-4-4-12 caractères hexadécimaux avec tirets)
UPDATE profiles
SET avatar_url = NULL
WHERE avatar_url IS NOT NULL
  AND avatar_url ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- 2. Extraire le chemin relatif des URLs complètes Supabase Storage
-- Transformer: https://xxx.supabase.co/storage/v1/object/public/avatars/user_id/avatar.ext
-- En: user_id/avatar.ext
UPDATE profiles
SET avatar_url = 
  CASE 
    WHEN avatar_url LIKE '%/storage/v1/object/public/avatars/%' THEN
      regexp_replace(avatar_url, '^.*/storage/v1/object/public/avatars/', '')
    ELSE avatar_url
  END
WHERE avatar_url IS NOT NULL
  AND avatar_url LIKE 'http%';

-- 3. Vérifier que les chemins relatifs sont bien formatés (user_id/avatar.ext)
-- Supprimer ceux qui ne correspondent pas au format attendu
UPDATE profiles
SET avatar_url = NULL
WHERE avatar_url IS NOT NULL
  AND avatar_url NOT LIKE '%/%' -- Doit contenir au moins un slash
  AND avatar_url NOT LIKE 'http%'; -- Et ne pas être une URL

-- 4. Logs pour vérification
DO $$
DECLARE
  total_profiles INT;
  with_avatar INT;
BEGIN
  SELECT COUNT(*) INTO total_profiles FROM profiles;
  SELECT COUNT(*) INTO with_avatar FROM profiles WHERE avatar_url IS NOT NULL;
  
  RAISE NOTICE 'Migration avatar_url terminée:';
  RAISE NOTICE '- Total profils: %', total_profiles;
  RAISE NOTICE '- Profils avec avatar: %', with_avatar;
END $$;

-- 5. Validation: Afficher les avatar_url restants pour contrôle manuel
-- Décommenter pour debug:
-- SELECT id, first_name, last_name, avatar_url 
-- FROM profiles 
-- WHERE avatar_url IS NOT NULL;

COMMENT ON COLUMN profiles.avatar_url IS 'Chemin relatif Storage: user_id/avatar.ext (pas URL complète)';
