-- =====================================================
-- TEST ET VÉRIFICATION - Storage idea-audios
-- Date: 2025-11-06
-- =====================================================

-- 1. Vérifier que le bucket existe
SELECT * FROM storage.buckets WHERE id = 'idea-audios';

-- 2. Vérifier les policies RLS
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
WHERE tablename = 'objects' 
  AND policyname LIKE '%idea_audios%';

-- 3. Test manuel d'upload (via SDK)
-- Le format correct est : {user_id}/{filename}.webm
-- Exemple: a1b2c3d4-e5f6-7890-abcd-ef1234567890/1699564800000_abc123.webm

-- 4. Vérifier les fichiers uploadés
SELECT 
  id,
  name,
  bucket_id,
  owner,
  created_at,
  updated_at,
  last_accessed_at,
  metadata->>'size' as size_bytes,
  metadata->>'mimetype' as mime_type
FROM storage.objects 
WHERE bucket_id = 'idea-audios'
ORDER BY created_at DESC
LIMIT 10;

-- 5. Test de la fonction foldername (décompose le path)
-- Devrait retourner ['user_id', 'filename.webm']
SELECT 
  name,
  (storage.foldername(name)) as folders,
  (storage.foldername(name))[1] as first_folder
FROM storage.objects 
WHERE bucket_id = 'idea-audios'
LIMIT 5;

-- 6. Vérifier que les URLs publiques fonctionnent
SELECT 
  name,
  concat(
    'https://',
    current_setting('app.settings.storage_url', true),
    '/storage/v1/object/public/idea-audios/',
    name
  ) as public_url
FROM storage.objects 
WHERE bucket_id = 'idea-audios'
LIMIT 5;

-- 7. Cleanup des fichiers orphelins (à exécuter si nécessaire)
-- SELECT cleanup_orphan_idea_audios();

-- 8. Vérifier les idées avec leurs audios
SELECT 
  i.id,
  i.title,
  i.audio_url,
  i.audio_duration_seconds,
  i.created_at,
  p.nom,
  p.prenom
FROM ideas i
LEFT JOIN profiles p ON i.author_id = p.id
WHERE i.audio_url IS NOT NULL
ORDER BY i.created_at DESC
LIMIT 10;
