-- Migration: Ajouter nom et prenom à profiles
-- Description: Séparer full_name en nom et prenom pour initiales avatars

-- Ajouter les colonnes nom et prenom
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS nom TEXT,
ADD COLUMN IF NOT EXISTS prenom TEXT;

-- Migrer les données existantes de full_name vers prenom + nom
-- (Assume que full_name = "Prénom Nom")
UPDATE profiles
SET 
  prenom = CASE 
    WHEN full_name IS NOT NULL AND position(' ' in full_name) > 0 
    THEN split_part(full_name, ' ', 1)
    ELSE full_name
  END,
  nom = CASE 
    WHEN full_name IS NOT NULL AND position(' ' in full_name) > 0 
    THEN substring(full_name from position(' ' in full_name) + 1)
    ELSE NULL
  END
WHERE prenom IS NULL OR nom IS NULL;

-- Mettre à jour la fonction handle_new_user pour créer nom/prenom
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, nom, prenom, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'nom', NULL),
        COALESCE(NEW.raw_user_meta_data->>'prenom', split_part(NEW.email, '@', 1)),
        'membre'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaire : full_name reste pour compatibilité mais nom/prenom sont maintenant utilisés
COMMENT ON COLUMN profiles.nom IS 'Nom de famille (extrait de full_name ou saisi)';
COMMENT ON COLUMN profiles.prenom IS 'Prénom (extrait de full_name ou saisi)';
