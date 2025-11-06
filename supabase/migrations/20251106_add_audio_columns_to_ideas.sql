-- =====================================================
-- Migration : Ajouter colonnes audio_duration et transcription
-- Date: 2025-11-06
-- Description: Ajoute les colonnes manquantes pour les idées vocales
-- =====================================================

-- Ajouter audio_duration (durée en secondes)
ALTER TABLE public.ideas 
ADD COLUMN IF NOT EXISTS audio_duration integer NULL;

-- Ajouter transcription (texte retranscrit)
ALTER TABLE public.ideas 
ADD COLUMN IF NOT EXISTS transcription text NULL;

-- Commentaires pour documentation
COMMENT ON COLUMN public.ideas.audio_duration IS 'Durée de l''audio en secondes (pour idées vocales)';
COMMENT ON COLUMN public.ideas.transcription IS 'Transcription texte de l''audio (généré par Whisper)';

-- Vérification : afficher les colonnes ajoutées
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'ideas'
  AND column_name IN ('audio_duration', 'transcription')
ORDER BY column_name;
