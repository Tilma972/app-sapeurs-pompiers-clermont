-- ============================================================
-- Migration : fix_chef_equipe_role_rls
-- Date      : 2026-03-05 13:35:04
-- ============================================================
-- Correction : les policies RLS utilisaient role = 'chef' mais
-- la valeur réelle dans la colonne profiles.role est 'chef_equipe'.
-- Ce bug empêchait les chefs de soumettre, voir ou annuler des demandes.
-- ============================================================

-- Supprimer les 3 policies chef erronées
DROP POLICY IF EXISTS "chef_insert_pot_depenses"              ON demandes_pot_equipe;
DROP POLICY IF EXISTS "chef_select_own_equipe_pot_depenses"   ON demandes_pot_equipe;
DROP POLICY IF EXISTS "chef_update_own_soumise_pot_depenses"  ON demandes_pot_equipe;

-- Recréer avec le bon rôle : 'chef_equipe'

CREATE POLICY "chef_insert_pot_depenses" ON demandes_pot_equipe
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'chef_equipe'
        AND profiles.team_id = equipe_id
    )
  );

CREATE POLICY "chef_select_own_equipe_pot_depenses" ON demandes_pot_equipe
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'chef_equipe'
        AND profiles.team_id = equipe_id
    )
  );

CREATE POLICY "chef_update_own_soumise_pot_depenses" ON demandes_pot_equipe
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    AND statut = 'soumise'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'chef_equipe'
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    AND statut = 'annulée'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'chef_equipe'
    )
  );
