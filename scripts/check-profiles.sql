-- Script de vérification des profils
-- À exécuter dans l'éditeur SQL de Supabase pour vérifier l'état des profils

-- 1. Vérifier le nombre total d'utilisateurs vs profils
SELECT 
    'Utilisateurs total' as type,
    COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
    'Profils total' as type,
    COUNT(*) as count
FROM public.profiles;

-- 2. Identifier les utilisateurs sans profil
SELECT 
    au.id,
    au.email,
    au.created_at as user_created_at,
    'Sans profil' as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ORDER BY au.created_at DESC;

-- 3. Vérifier les profils existants
SELECT 
    p.id,
    p.full_name,
    p.team,
    p.role,
    p.created_at,
    au.email
FROM public.profiles p
JOIN auth.users au ON p.id = au.id
ORDER BY p.created_at DESC
LIMIT 10;

-- 4. Vérifier les politiques RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'profiles';

-- 5. Vérifier les triggers
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'profiles';

