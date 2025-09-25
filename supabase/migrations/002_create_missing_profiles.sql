-- Migration: Créer les profils manquants pour les utilisateurs existants
-- Description: Cette migration crée automatiquement des profils pour tous les utilisateurs
-- qui n'en ont pas encore (cas des utilisateurs inscrits avant la migration des profils)

-- Fonction pour créer les profils manquants
CREATE OR REPLACE FUNCTION public.create_missing_profiles()
RETURNS INTEGER AS $$
DECLARE
    user_record RECORD;
    profiles_created INTEGER := 0;
BEGIN
    -- Parcourir tous les utilisateurs qui n'ont pas de profil
    FOR user_record IN 
        SELECT 
            au.id,
            au.email,
            COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)) as full_name
        FROM auth.users au
        LEFT JOIN public.profiles p ON au.id = p.id
        WHERE p.id IS NULL
    LOOP
        -- Créer le profil manquant
        INSERT INTO public.profiles (id, full_name, role)
        VALUES (
            user_record.id,
            user_record.full_name,
            'membre'
        );
        
        profiles_created := profiles_created + 1;
        
        -- Log de la création
        RAISE NOTICE 'Profil créé pour l''utilisateur: % (%)', user_record.full_name, user_record.email;
    END LOOP;
    
    RETURN profiles_created;
END;
$$ LANGUAGE plpgsql;

-- Exécuter la fonction pour créer les profils manquants
SELECT public.create_missing_profiles() as profiles_created;

-- Nettoyer la fonction temporaire
DROP FUNCTION public.create_missing_profiles();

-- Vérifier le résultat
SELECT 
    COUNT(*) as total_users,
    (SELECT COUNT(*) FROM public.profiles) as total_profiles
FROM auth.users;

