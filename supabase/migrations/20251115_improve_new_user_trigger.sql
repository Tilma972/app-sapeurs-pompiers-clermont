-- Migration: Amélioration du trigger handle_new_user pour activation immédiate
-- Date: 2025-11-15
-- Description: Activation immédiate après inscription (whitelist = validation suffisante)

-- =====================================================
-- SOLUTION: Remplacer uniquement la FONCTION (pas le trigger)
-- Le trigger existant continuera d'appeler la nouvelle version
-- =====================================================

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

-- Note: Le trigger on_auth_user_created existe déjà et appelle automatiquement
-- la nouvelle version de la fonction handle_new_user()
