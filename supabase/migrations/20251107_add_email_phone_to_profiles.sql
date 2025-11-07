-- Migration: Ajouter email et phone à la table profiles
-- Date: 2025-11-07
-- Description: Simplifie la gestion du profil en ajoutant email et phone directement dans profiles

-- 1. Ajouter les colonnes email et phone
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Créer un index sur email pour les recherches rapides
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);

-- 3. Migrer les emails existants depuis auth.users vers profiles
UPDATE profiles p
SET email = au.email
FROM auth.users au
WHERE p.id = au.id
AND p.email IS NULL;

-- 4. Rendre email NOT NULL après la migration (car chaque profil doit avoir un email)
ALTER TABLE profiles 
ALTER COLUMN email SET NOT NULL;

-- 5. Ajouter une contrainte unique sur email
ALTER TABLE profiles 
ADD CONSTRAINT profiles_email_unique UNIQUE (email);

-- 6. Commenter les colonnes
COMMENT ON COLUMN profiles.email IS 'Email de l''utilisateur (copié depuis auth.users pour faciliter les requêtes)';
COMMENT ON COLUMN profiles.phone IS 'Numéro de téléphone optionnel (format libre)';

-- 7. Créer une fonction trigger pour synchroniser l'email
-- Quand l'email change dans auth.users, il se met à jour automatiquement dans profiles
CREATE OR REPLACE FUNCTION sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET email = NEW.email
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Créer le trigger sur auth.users
DROP TRIGGER IF EXISTS sync_profile_email_trigger ON auth.users;
CREATE TRIGGER sync_profile_email_trigger
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION sync_profile_email();

-- 9. S'assurer que l'email est copié lors de la création du profil
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Le trigger handle_new_user() devrait déjà exister, on le recrée avec le champ email
