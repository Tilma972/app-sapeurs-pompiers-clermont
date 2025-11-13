-- =====================================================
-- GAMIFICATION 1/7 : TABLE badges_definitions
-- =====================================================

-- Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS badges_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT,
  rarity TEXT,
  xp_reward INT DEFAULT 0,
  unlock_criteria JSONB,
  order_display INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajouter les colonnes manquantes et contraintes
DO $$ 
BEGIN
  -- Ajouter colonne active si manquante
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'badges_definitions' AND column_name = 'active'
  ) THEN
    ALTER TABLE badges_definitions ADD COLUMN active BOOLEAN DEFAULT TRUE;
  END IF;
  
  -- Ajouter colonne updated_at si manquante
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'badges_definitions' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE badges_definitions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  
  -- Mettre à jour les valeurs NULL
  UPDATE badges_definitions SET rarity = 'common' WHERE rarity IS NULL;
  UPDATE badges_definitions SET category = 'special' WHERE category IS NULL;
  
  -- Ajouter contraintes (drop d'abord si elles existent)
  ALTER TABLE badges_definitions DROP CONSTRAINT IF EXISTS badges_definitions_category_check;
  ALTER TABLE badges_definitions ADD CONSTRAINT badges_definitions_category_check 
    CHECK (category IN ('starter', 'montant', 'social', 'streak', 'excellence', 'special'));
  
  ALTER TABLE badges_definitions DROP CONSTRAINT IF EXISTS badges_definitions_rarity_check;
  ALTER TABLE badges_definitions ADD CONSTRAINT badges_definitions_rarity_check 
    CHECK (rarity IN ('common', 'rare', 'epic', 'legendary'));
  
  ALTER TABLE badges_definitions DROP CONSTRAINT IF EXISTS badges_definitions_xp_reward_check;
  ALTER TABLE badges_definitions ADD CONSTRAINT badges_definitions_xp_reward_check 
    CHECK (xp_reward >= 0);
  
  -- Ajouter NOT NULL après mise à jour des valeurs
  ALTER TABLE badges_definitions ALTER COLUMN category SET NOT NULL;
  ALTER TABLE badges_definitions ALTER COLUMN rarity SET NOT NULL;
  ALTER TABLE badges_definitions ALTER COLUMN rarity SET DEFAULT 'common';
  ALTER TABLE badges_definitions ALTER COLUMN unlock_criteria SET NOT NULL;
END $$;

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_badges_category ON badges_definitions(category);
CREATE INDEX IF NOT EXISTS idx_badges_rarity ON badges_definitions(rarity);
CREATE INDEX IF NOT EXISTS idx_badges_active ON badges_definitions(active);

-- RLS
ALTER TABLE badges_definitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Badges definitions are viewable by everyone" ON badges_definitions;
CREATE POLICY "Badges definitions are viewable by everyone"
  ON badges_definitions FOR SELECT
  USING (TRUE);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_badges_definitions_updated_at ON badges_definitions;
CREATE TRIGGER update_badges_definitions_updated_at
  BEFORE UPDATE ON badges_definitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE badges_definitions IS 'Définition de tous les badges disponibles dans le système';
