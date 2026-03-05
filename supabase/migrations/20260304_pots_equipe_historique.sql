-- Migration: Soldes antérieurs par équipe
-- Permet au trésorier de saisir un solde historique (avant la campagne 2025)
-- La colonne `annee` rend la table réutilisable pour les campagnes 2026 et suivantes.

CREATE TABLE IF NOT EXISTS pots_equipe_historique (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  equipe_id       uuid NOT NULL REFERENCES equipes(id) ON DELETE CASCADE,
  annee           integer NOT NULL,
  solde_anterieur numeric(10,2) DEFAULT 0 NOT NULL,
  notes           text,
  created_by      uuid REFERENCES profiles(id),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE (equipe_id, annee)
);

ALTER TABLE pots_equipe_historique ENABLE ROW LEVEL SECURITY;

-- Trésorier et admin : lecture + écriture complète
CREATE POLICY "tresorier_admin_all_historique" ON pots_equipe_historique
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

-- Membres authentifiés : lecture seule pour leur propre équipe (affichage mon-compte)
-- Note: la colonne dans profiles est `team_id` (FK vers equipes.id)
CREATE POLICY "member_read_own_equipe_historique" ON pots_equipe_historique
  FOR SELECT TO authenticated
  USING (
    equipe_id IN (
      SELECT team_id FROM profiles WHERE id = auth.uid() AND team_id IS NOT NULL
    )
  );
