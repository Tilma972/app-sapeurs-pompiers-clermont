-- Migration: Ajouter support des avatars personnalisés
-- Date: 2025-11-11
-- Description: Permet aux utilisateurs d'uploader une photo de profil

-- 1. Ajouter la colonne avatar_url
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Commenter la colonne
COMMENT ON COLUMN profiles.avatar_url IS 'URL de l''avatar personnalisé (Supabase Storage ou externe)';

-- 3. Créer le bucket Storage pour les avatars (si pas déjà fait)
-- À exécuter dans Supabase Dashboard > Storage
-- Nom du bucket: "avatars"
-- Public: true
-- File size limit: 2MB
-- Allowed MIME types: image/jpeg, image/png, image/webp

-- 4. Policy RLS pour Storage avatars
-- Les utilisateurs peuvent uploader/modifier leur propre avatar
-- À créer dans Storage > avatars > Policies:
/*
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
*/

-- 5. Fonction helper pour générer l'URL complète de l'avatar
CREATE OR REPLACE FUNCTION get_avatar_url(p profiles)
RETURNS TEXT AS $$
BEGIN
  IF p.avatar_url IS NOT NULL THEN
    -- Si URL complète (commence par http), retourner telle quelle
    IF p.avatar_url LIKE 'http%' THEN
      RETURN p.avatar_url;
    ELSE
      -- Sinon, construire l'URL Supabase Storage
      RETURN current_setting('app.supabase_url', true) || '/storage/v1/object/public/avatars/' || p.avatar_url;
    END IF;
  ELSE
    -- Pas d'avatar, retourner NULL (on utilisera les initiales côté client)
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_avatar_url IS 'Génère l''URL complète de l''avatar (Storage ou externe)';
