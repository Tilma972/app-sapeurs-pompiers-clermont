-- ============================================
-- Migration 022 : Tables de comptabilité (comptes SP, pots équipe, mouvements)
-- Date : 2025-01-19
-- Description : Création des tables et RLS de base
-- Dépendances : 009_create_equipes_table.sql
-- ============================================

-- Comptes individuels pompiers
CREATE TABLE IF NOT EXISTS public.comptes_sp (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
    
    solde_disponible DECIMAL(10,2) DEFAULT 0 NOT NULL CHECK (solde_disponible >= 0),
    solde_utilise DECIMAL(10,2) DEFAULT 0 NOT NULL CHECK (solde_utilise >= 0),
    solde_bloque DECIMAL(10,2) DEFAULT 0 NOT NULL CHECK (solde_bloque >= 0),
    
    total_retributions DECIMAL(10,2) DEFAULT 0 NOT NULL CHECK (total_retributions >= 0),
    total_contributions_equipe DECIMAL(10,2) DEFAULT 0 NOT NULL CHECK (total_contributions_equipe >= 0),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pots communs par équipe
CREATE TABLE IF NOT EXISTS public.pots_equipe (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    equipe_id UUID REFERENCES equipes(id) UNIQUE NOT NULL,
    
    solde_disponible DECIMAL(10,2) DEFAULT 0 NOT NULL CHECK (solde_disponible >= 0),
    solde_utilise DECIMAL(10,2) DEFAULT 0 NOT NULL CHECK (solde_utilise >= 0),
    solde_bloque DECIMAL(10,2) DEFAULT 0 NOT NULL CHECK (solde_bloque >= 0),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Historique des mouvements de rétribution
CREATE TABLE IF NOT EXISTS public.mouvements_retribution (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tournee_id UUID REFERENCES tournees(id) NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    equipe_id UUID REFERENCES equipes(id),
    
    -- Montants
    montant_total_collecte DECIMAL(10,2) NOT NULL CHECK (montant_total_collecte >= 0),
    montant_amicale DECIMAL(10,2) NOT NULL CHECK (montant_amicale >= 0),
    montant_pompier_total DECIMAL(10,2) NOT NULL CHECK (montant_pompier_total >= 0),
    
    -- Répartition choisie par le pompier
    pourcentage_pot_equipe INTEGER NOT NULL CHECK (pourcentage_pot_equipe BETWEEN 0 AND 100),
    montant_pot_equipe DECIMAL(10,2) NOT NULL CHECK (montant_pot_equipe >= 0),
    montant_compte_perso DECIMAL(10,2) NOT NULL CHECK (montant_compte_perso >= 0),
    
    statut TEXT DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'valide', 'verse')),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_comptes_sp_user ON comptes_sp(user_id);
CREATE INDEX IF NOT EXISTS idx_pots_equipe_equipe ON pots_equipe(equipe_id);
CREATE INDEX IF NOT EXISTS idx_mouvements_user_date ON mouvements_retribution(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mouvements_equipe ON mouvements_retribution(equipe_id, created_at DESC);

-- RLS Policies
ALTER TABLE comptes_sp ENABLE ROW LEVEL SECURITY;
ALTER TABLE pots_equipe ENABLE ROW LEVEL SECURITY;
ALTER TABLE mouvements_retribution ENABLE ROW LEVEL SECURITY;

-- Politique : Un pompier voit son propre compte
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'comptes_sp' AND policyname = 'Pompiers voient leur compte'
  ) THEN
    CREATE POLICY "Pompiers voient leur compte"
    ON comptes_sp FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Politique : Membres d'équipe voient le pot commun
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pots_equipe' AND policyname = 'Équipe voit son pot'
  ) THEN
    CREATE POLICY "Équipe voit son pot"
    ON pots_equipe FOR SELECT
    USING (
      equipe_id IN (
        SELECT team_id FROM profiles WHERE id = auth.uid()
      )
    );
  END IF;
END $$;

-- Politique : Membre voit ses propres mouvements
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'mouvements_retribution' AND policyname = 'Pompier voit ses mouvements'
  ) THEN
    CREATE POLICY "Pompier voit ses mouvements"
    ON mouvements_retribution FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;
