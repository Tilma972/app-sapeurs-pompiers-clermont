-- Migration: Amélioration du trigger handle_new_user pour activation immédiate
-- Date: 2025-11-15
-- Description: Activation immédiate après inscription (whitelist = validation suffisante)

-- =====================================================
-- ÉTAPE 1: Recréer le trigger handle_new_user()
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    full_name,
    display_name,
    role,
    identity_verified,
    verification_method,
    verification_date
  ) VALUES (
    NEW.id,
    NEW.email,
    -- Extraction depuis metadata (rempli par signUpAction)
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'membre',  -- ✅ Activation immédiate (whitelist = déjà validé)
    true,      -- ✅ Identité vérifiée (whitelist email+nom+prénom)
    'whitelist_verification',
    now()
  );

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
'Trigger amélioré: crée un profil membre actif dès inscription car whitelist = validation suffisante';

-- =====================================================
-- ÉTAPE 2: Recréer le trigger
-- =====================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS
'Crée automatiquement un profil membre actif après inscription validée par whitelist';
