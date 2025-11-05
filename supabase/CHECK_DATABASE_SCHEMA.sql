-- ====================================
-- SCRIPT DE VÉRIFICATION
-- ====================================
-- Exécutez ceci pour voir la structure de votre base de données
-- ====================================

-- 1. Lister toutes les tables dans le schéma public
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Chercher spécifiquement les tables contenant "user"
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%user%';

-- 3. Si vous avez une table "users", voir sa structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users'
ORDER BY ordinal_position;

-- 4. Vérifier si la colonne "role" existe dans la table users
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users'
AND column_name = 'role';
