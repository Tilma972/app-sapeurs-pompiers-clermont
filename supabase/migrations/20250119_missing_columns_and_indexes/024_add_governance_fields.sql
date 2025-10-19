-- ============================================
-- Migration 024 : Gouvernance équipe (Phase 2)
-- Date : 2025-01-19 (préparée, à exécuter plus tard)
-- Description : Ajoute les règles de gouvernance par équipe
-- ============================================

-- ⚠️ NE PAS EXÉCUTER IMMÉDIATEMENT
-- Cette migration est préparée pour la Phase 2 (UI Gouvernance)

BEGIN;

-- 1. Flag d'activation de la rétribution
ALTER TABLE equipes
ADD COLUMN IF NOT EXISTS enable_retribution BOOLEAN DEFAULT false;

-- 2. Règles de répartition pot d'équipe
ALTER TABLE equipes
ADD COLUMN IF NOT EXISTS pourcentage_minimum_pot INTEGER DEFAULT 0 
  CHECK (pourcentage_minimum_pot BETWEEN 0 AND 100),
ADD COLUMN IF NOT EXISTS pourcentage_recommande_pot INTEGER DEFAULT 30 
  CHECK (pourcentage_recommande_pot BETWEEN 0 AND 100);

-- 3. Mode de transparence (créer le type si absent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transparency_mode') THEN
    CREATE TYPE transparency_mode AS ENUM ('prive', 'equipe', 'anonyme');
  END IF;
END $$;

ALTER TABLE equipes
ADD COLUMN IF NOT EXISTS mode_transparence transparency_mode DEFAULT 'equipe';

-- 4. Charte d'équipe
ALTER TABLE equipes
ADD COLUMN IF NOT EXISTS charte_votee BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS date_vote_charte DATE,
ADD COLUMN IF NOT EXISTS charte_texte TEXT;

-- 5. Validation : minimum ≤ recommandé (ajouter la contrainte si absente)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_recommande_gte_minimum' AND conrelid = 'public.equipes'::regclass
  ) THEN
    ALTER TABLE equipes
    ADD CONSTRAINT check_recommande_gte_minimum 
    CHECK (pourcentage_recommande_pot >= pourcentage_minimum_pot);
  END IF;
END $$;

-- 6. Commentaires documentation
COMMENT ON COLUMN equipes.enable_retribution IS 
  'Active le système de rétribution 70/30 pour cette équipe';

COMMENT ON COLUMN equipes.pourcentage_minimum_pot IS 
  'Pourcentage minimum obligatoire à mettre dans le pot d''équipe (0-100)';

COMMENT ON COLUMN equipes.pourcentage_recommande_pot IS 
  'Pourcentage recommandé à mettre dans le pot d''équipe (bouton dans UI)';

COMMENT ON COLUMN equipes.mode_transparence IS 
  'Niveau de transparence : prive (rien visible), equipe (totaux visibles), anonyme (détails anonymisés)';

COMMENT ON COLUMN equipes.charte_votee IS 
  'La charte d''équipe a été votée et acceptée par les membres';

-- 7. Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_equipes_retribution_active
ON equipes(enable_retribution)
WHERE enable_retribution = true;

-- 8. Valeurs par défaut pour équipes existantes
UPDATE equipes SET
  enable_retribution = COALESCE(enable_retribution, false),
  pourcentage_minimum_pot = COALESCE(pourcentage_minimum_pot, 0),
  pourcentage_recommande_pot = COALESCE(pourcentage_recommande_pot, 30),
  mode_transparence = COALESCE(mode_transparence, 'equipe'::transparency_mode),
  charte_votee = COALESCE(charte_votee, false)
WHERE enable_retribution IS NULL
   OR pourcentage_minimum_pot IS NULL
   OR pourcentage_recommande_pot IS NULL
   OR mode_transparence IS NULL
   OR charte_votee IS NULL;

COMMIT;

-- Rapport
DO $$
BEGIN
  RAISE NOTICE 'Migration 024 : Gouvernance équipe préparée (à exécuter lors de la Phase 2)';
END $$;
