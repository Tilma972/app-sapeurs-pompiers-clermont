-- Migration: Dépenses du pot d'équipe
-- Permet aux chefs d'équipe de soumettre des demandes de dépense sur le pot collectif
-- Permet aux trésoriers d'approuver, payer ou rejeter ces demandes

-- =====================================================
-- TABLE PRINCIPALE
-- =====================================================

CREATE TABLE IF NOT EXISTS demandes_pot_equipe (
  id                         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  equipe_id                  uuid NOT NULL REFERENCES equipes(id) ON DELETE CASCADE,
  created_by                 uuid NOT NULL REFERENCES profiles(id),
  motif                      text NOT NULL,
  prestataire_nom            text NOT NULL,
  montant_demande            numeric(10,2) NOT NULL CHECK (montant_demande > 0),
  montant_paye               numeric(10,2) NULL CHECK (montant_paye IS NULL OR montant_paye > 0),
  justificatif_url           text NOT NULL,
  justificatif_est_provisoire boolean DEFAULT false NOT NULL,
  facture_finale_url         text NULL,
  statut                     text NOT NULL DEFAULT 'soumise'
                             CHECK (statut IN ('soumise', 'approuvée', 'payée', 'rejetée')),
  motif_rejet                text NULL,
  traite_par                 uuid REFERENCES profiles(id) NULL,
  notes_tresorier            text NULL,
  created_at                 timestamptz DEFAULT now() NOT NULL,
  updated_at                 timestamptz DEFAULT now() NOT NULL,
  paid_at                    timestamptz NULL
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_demandes_pot_equipe_equipe_id ON demandes_pot_equipe(equipe_id);
CREATE INDEX IF NOT EXISTS idx_demandes_pot_equipe_statut ON demandes_pot_equipe(statut);
CREATE INDEX IF NOT EXISTS idx_demandes_pot_equipe_created_by ON demandes_pot_equipe(created_by);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_demandes_pot_equipe_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_demandes_pot_equipe_updated_at
  BEFORE UPDATE ON demandes_pot_equipe
  FOR EACH ROW EXECUTE FUNCTION update_demandes_pot_equipe_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE demandes_pot_equipe ENABLE ROW LEVEL SECURITY;

-- Trésorier et admin : accès complet
CREATE POLICY "tresorier_admin_full_pot_depenses" ON demandes_pot_equipe
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('tresorier', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('tresorier', 'admin')
    )
  );

-- Chef d'équipe : INSERT pour son équipe uniquement
CREATE POLICY "chef_insert_pot_depenses" ON demandes_pot_equipe
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'chef'
        AND profiles.team_id = equipe_id
    )
  );

-- Chef d'équipe : SELECT sur toutes les demandes de son équipe
CREATE POLICY "chef_select_own_equipe_pot_depenses" ON demandes_pot_equipe
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'chef'
        AND profiles.team_id = equipe_id
    )
  );

-- Chef d'équipe : UPDATE uniquement sur ses propres demandes au statut 'soumise' (pour annuler)
CREATE POLICY "chef_update_own_soumise_pot_depenses" ON demandes_pot_equipe
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    AND statut = 'soumise'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'chef'
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'chef'
    )
  );

-- Membres (sapeurs) : lecture seule sur les demandes de leur équipe
CREATE POLICY "membre_select_own_equipe_pot_depenses" ON demandes_pot_equipe
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.team_id = equipe_id
    )
  );

-- =====================================================
-- BUCKET STORAGE POUR LES JUSTIFICATIFS
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pot-depenses-justificatifs',
  'pot-depenses-justificatifs',
  true,
  10485760, -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Politique : membres authentifiés peuvent uploader dans leur dossier
CREATE POLICY "auth_upload_justificatif_pot" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'pot-depenses-justificatifs'
  );

-- Politique : lecture publique (bucket public)
CREATE POLICY "public_read_justificatif_pot" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'pot-depenses-justificatifs');

-- Politique : trésorier peut supprimer
CREATE POLICY "tresorier_delete_justificatif_pot" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'pot-depenses-justificatifs'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('tresorier', 'admin')
    )
  );
