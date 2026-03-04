-- =====================================================
-- BOÎTE À IDÉES - Storage Bucket pour audios vocaux
-- Date: 2025-11-04
-- Description: Configuration bucket + policies
-- =====================================================

-- Créer le bucket pour les enregistrements vocaux
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'idea-audios',
  'idea-audios',
  true, -- Public car les idées publiées doivent être accessibles
  10485760, -- 10 MB max par fichier
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/mp4']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STORAGE POLICIES
-- =====================================================

-- Policy: SELECT - Tout le monde peut lire les audios publics
CREATE POLICY "idea_audios_select_public"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'idea-audios'
);

-- Policy: INSERT - Users authentifiés peuvent uploader dans leur dossier
-- Format: idea-audios/{user_id}/{uuid}.webm
CREATE POLICY "idea_audios_insert_authenticated"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'idea-audios'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: UPDATE - Users peuvent modifier leurs propres fichiers
CREATE POLICY "idea_audios_update_own"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'idea-audios'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: DELETE - Users peuvent supprimer leurs fichiers
CREATE POLICY "idea_audios_delete_own"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'idea-audios'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: DELETE - Admins peuvent tout supprimer
CREATE POLICY "idea_audios_delete_admin"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'idea-audios'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- =====================================================
-- CLEANUP FUNCTION (optionnel)
-- =====================================================

-- Fonction pour nettoyer les audios orphelins (non liés à une idée)
CREATE OR REPLACE FUNCTION cleanup_orphan_idea_audios()
RETURNS void AS $$
DECLARE
  orphan_count int;
BEGIN
  -- TODO: Implémenter la logique de nettoyage
  -- Supprimer les fichiers storage.objects où name ne correspond à aucun ideas.audio_url
  -- À exécuter via cron ou manuellement
  RAISE NOTICE 'Cleanup function created. Implementation pending.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_orphan_idea_audios IS 'Nettoie les fichiers audio non liés à une idée';
