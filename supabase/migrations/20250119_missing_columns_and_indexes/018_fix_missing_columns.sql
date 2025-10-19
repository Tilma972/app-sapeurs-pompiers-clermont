-- ============================================
-- Migration 018 : Colonnes manquantes critiques
-- Date : 2025-01-19
-- Description : Ajoute les colonnes nécessaires identifiées lors de l'audit
-- Dépendances : 006_feature_fiscal_support.sql, 009_create_equipes_table.sql
-- ============================================

-- 1. Ajouter calendars_given à support_transactions
-- Permet de tracker le nombre de calendriers donnés (peut être > 1)
ALTER TABLE support_transactions 
ADD COLUMN IF NOT EXISTS calendars_given INTEGER DEFAULT 1;

-- Initialiser les données existantes (40 lignes)
UPDATE support_transactions 
SET calendars_given = CASE 
  WHEN calendar_accepted THEN 1 
  ELSE 0 
END
WHERE calendars_given IS NULL;

-- Contrainte : doit être >= 0
ALTER TABLE support_transactions
DROP CONSTRAINT IF EXISTS calendars_given_check;
ALTER TABLE support_transactions
ADD CONSTRAINT calendars_given_check 
CHECK (calendars_given >= 0);

-- 2. Ajouter lien direct tournée -> équipe (optimisation)
-- Évite de passer par profiles pour les requêtes d'équipe
ALTER TABLE tournees 
ADD COLUMN IF NOT EXISTS equipe_id UUID;

-- Créer la foreign key si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'tournees_equipe_id_fkey'
  ) THEN
    ALTER TABLE tournees 
    ADD CONSTRAINT tournees_equipe_id_fkey 
    FOREIGN KEY (equipe_id) REFERENCES equipes(id);
  END IF;
END $$;

-- Remplir automatiquement depuis profiles.team_id (13 tournées)
UPDATE tournees t
SET equipe_id = p.team_id
FROM profiles p
WHERE t.user_id = p.id 
AND t.equipe_id IS NULL
AND p.team_id IS NOT NULL;

-- 3. Géolocalisation (préparation feature future)
ALTER TABLE support_transactions
ADD COLUMN IF NOT EXISTS latitude DECIMAL(9, 6),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(9, 6),
ADD COLUMN IF NOT EXISTS geolocation_timestamp TIMESTAMPTZ;

-- 4. Documentation
COMMENT ON COLUMN support_transactions.calendars_given IS 
  'Nombre de calendriers remis (0 pour don fiscal pur, 1+ pour vente)';

COMMENT ON COLUMN tournees.equipe_id IS 
  'Référence directe à équipe (dénormalisé pour performance)';

COMMENT ON COLUMN support_transactions.latitude IS 
  'Latitude de la transaction (si géoloc activée)';

COMMENT ON COLUMN support_transactions.longitude IS 
  'Longitude de la transaction (si géoloc activée)';

-- Vérification
DO $$
DECLARE
  nb_transactions INT;
  nb_with_calendars INT;
BEGIN
  SELECT COUNT(*), COUNT(calendars_given) 
  INTO nb_transactions, nb_with_calendars
  FROM support_transactions;
  
  RAISE NOTICE 'Migration 018 : % transactions mises à jour, % avec calendars_given', 
    nb_transactions, nb_with_calendars;
END $$;