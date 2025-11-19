-- Script pour vérifier les politiques RLS actuelles sur user_progression
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'user_progression'
ORDER BY policyname;

-- Vérifier si RLS est activé
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'user_progression';
