-- =====================================================
-- DIAGNOSTIC - Vérifier le schéma de la table ideas
-- =====================================================

-- 1. Vérifier si la table existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'ideas'
) as table_exists;

-- 2. Lister TOUTES les colonnes de la table ideas
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'ideas'
ORDER BY ordinal_position;

-- 3. Vérifier les colonnes qui manquent potentiellement
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ideas' AND column_name = 'audio_duration') 
    THEN '✅ audio_duration EXISTS'
    ELSE '❌ audio_duration MISSING'
  END as audio_duration_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ideas' AND column_name = 'transcription') 
    THEN '✅ transcription EXISTS'
    ELSE '❌ transcription MISSING'
  END as transcription_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ideas' AND column_name = 'audio_url') 
    THEN '✅ audio_url EXISTS'
    ELSE '❌ audio_url MISSING'
  END as audio_url_status;

-- 4. Lister les index sur la table ideas
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'ideas'
ORDER BY indexname;

-- 5. Lister les contraintes (CHECK constraints)
SELECT
  con.conname as constraint_name,
  pg_get_constraintdef(con.oid) as constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'ideas';
