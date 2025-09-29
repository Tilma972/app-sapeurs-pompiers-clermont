-- Migration: Tests des tables tournees et transactions
-- Description: Script de test pour vérifier le bon fonctionnement des tables

-- Test 1: Vérifier que les tables existent
SELECT 
    'tournees' as table_name,
    COUNT(*) as row_count
FROM public.tournees
UNION ALL
SELECT 
    'transactions' as table_name,
    COUNT(*) as row_count
FROM public.transactions;

-- Test 2: Vérifier les politiques RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('tournees', 'transactions')
ORDER BY tablename, policyname;

-- Test 3: Vérifier les triggers
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('tournees', 'transactions')
ORDER BY event_object_table, trigger_name;

-- Test 4: Vérifier les contraintes
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name IN ('tournees', 'transactions')
ORDER BY tc.table_name, tc.constraint_type;

-- Test 5: Vérifier les index
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('tournees', 'transactions')
ORDER BY tablename, indexname;

-- Test 6: Vérifier les fonctions créées
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name IN (
    'get_tournee_stats',
    'cloturer_tournee',
    'get_tournee_detailed_stats',
    'get_user_tournee_stats',
    'update_tournee_stats'
)
ORDER BY routine_name;



