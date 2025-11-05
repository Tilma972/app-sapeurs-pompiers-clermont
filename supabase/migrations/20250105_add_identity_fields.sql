-- ============================================
-- MIGRATION: Ajout de l'identité réelle
-- Date: 2025-01-05
-- Type: NON-DESTRUCTIVE (ne casse rien)
-- ============================================

-- Ajouter les nouveaux champs (NON-BREAKING)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS identity_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verification_method TEXT; -- 'admin', 'document', 'email', 'legacy'

-- Ajouter des commentaires pour expliquer
COMMENT ON COLUMN profiles.full_name IS 'LEGACY: Utilisé comme pseudo ou nom complet. Préférer display_name pour l''affichage.';
COMMENT ON COLUMN profiles.first_name IS 'Prénom légal (requis pour offres partenaires et documents officiels)';
COMMENT ON COLUMN profiles.last_name IS 'Nom légal (requis pour offres partenaires et documents officiels)';
COMMENT ON COLUMN profiles.display_name IS 'Nom d''affichage choisi par l''utilisateur (pseudo). Si NULL, utiliser full_name en fallback.';
COMMENT ON COLUMN profiles.identity_verified IS 'Identité vérifiée par l''administration';
COMMENT ON COLUMN profiles.verification_date IS 'Date de vérification de l''identité';
COMMENT ON COLUMN profiles.verification_method IS 'Méthode de vérification: admin (manuel), document (pièce d''identité), email (confirmation), legacy (données migrées)';

-- Migrer les données existantes : copier full_name vers display_name
-- Cela préserve le comportement actuel tout en préparant la transition
UPDATE profiles 
SET display_name = full_name 
WHERE display_name IS NULL AND full_name IS NOT NULL;

-- Marquer les profils actifs existants comme "legacy verified"
-- ATTENTION: À ajuster selon votre politique de vérification
-- Option conservatrice: ne rien marquer comme vérifié
-- Option permissive (ci-dessous): marquer les actifs comme vérifiés
UPDATE profiles 
SET identity_verified = true,
    verification_method = 'legacy',
    verification_date = NOW()
WHERE is_active = true 
  AND full_name IS NOT NULL
  AND role IN ('member', 'admin', 'tresorier');

-- Créer un index pour les recherches par nom
CREATE INDEX IF NOT EXISTS idx_profiles_first_name ON profiles(first_name) WHERE first_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_last_name ON profiles(last_name) WHERE last_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_identity_verified ON profiles(identity_verified) WHERE identity_verified = true;

-- Vue pour faciliter les requêtes admin
CREATE OR REPLACE VIEW profiles_with_identity AS
SELECT 
  id,
  email,
  full_name,
  display_name,
  first_name,
  last_name,
  COALESCE(
    display_name,
    full_name,
    NULLIF(TRIM(CONCAT(first_name, ' ', last_name)), '')
  ) as computed_display_name,
  CASE 
    WHEN first_name IS NOT NULL AND last_name IS NOT NULL 
    THEN CONCAT(first_name, ' ', last_name)
    ELSE NULL
  END as legal_name,
  identity_verified,
  verification_date,
  verification_method,
  role,
  is_active,
  created_at
FROM profiles;

COMMENT ON VIEW profiles_with_identity IS 'Vue facilitant l''accès aux différents noms (display_name, legal_name) avec fallbacks automatiques';

-- Fonction helper pour obtenir le nom d'affichage
CREATE OR REPLACE FUNCTION get_display_name(p profiles)
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    p.display_name,
    p.full_name,
    NULLIF(TRIM(CONCAT(p.first_name, ' ', p.last_name)), ''),
    'Utilisateur'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION get_display_name IS 'Retourne le nom d''affichage avec fallback intelligent';
