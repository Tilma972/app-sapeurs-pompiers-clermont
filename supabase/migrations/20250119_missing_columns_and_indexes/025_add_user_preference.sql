-- ============================================
-- Migration 025 : Préférence de répartition utilisateur
-- Date : 2025-01-20
-- Description : Ajoute la préférence personnelle de répartition pot/perso
-- Dépendances : 022_create_accounting_tables.sql
-- ============================================

BEGIN;

-- Ajouter la colonne de préférence
ALTER TABLE comptes_sp
ADD COLUMN IF NOT EXISTS pourcentage_pot_equipe_defaut INTEGER 
DEFAULT NULL 
CHECK (pourcentage_pot_equipe_defaut IS NULL OR pourcentage_pot_equipe_defaut BETWEEN 0 AND 100);

-- Documentation
COMMENT ON COLUMN comptes_sp.pourcentage_pot_equipe_defaut IS 
  'Préférence utilisateur pour la répartition (NULL = utilise le minimum ou la recommandation d''équipe)';

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_comptes_sp_preference
ON comptes_sp(pourcentage_pot_equipe_defaut)
WHERE pourcentage_pot_equipe_defaut IS NOT NULL;

COMMIT;

-- Rapport
DO $$
BEGIN
  RAISE NOTICE 'Migration 025 : Préférence utilisateur ajoutée dans comptes_sp';
END $$;