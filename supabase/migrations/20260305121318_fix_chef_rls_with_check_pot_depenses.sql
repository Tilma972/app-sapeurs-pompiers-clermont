-- ============================================================
-- Migration : fix_chef_rls_with_check_pot_depenses
-- Date      : 2026-03-05 12:13:18
-- ============================================================

-- Problème : le WITH CHECK original ne restreignait pas la valeur de destination
-- du champ statut. Un chef pouvait, via l'API Supabase directement (sans passer
-- par les Server Actions), changer statut 'soumise' → 'approuvée'.
--
-- Corrections :
--   1. Ajout de 'annulée' au CHECK de la table (statut d'annulation par le chef)
--   2. WITH CHECK force statut = 'annulée' — seule transition autorisée pour un chef

-- 1. Étendre le CHECK de statut pour inclure 'annulée'
ALTER TABLE demandes_pot_equipe
  DROP CONSTRAINT IF EXISTS demandes_pot_equipe_statut_check;

ALTER TABLE demandes_pot_equipe
  ADD CONSTRAINT demandes_pot_equipe_statut_check
  CHECK (statut IN ('soumise', 'approuvée', 'payée', 'rejetée', 'annulée'));

-- 2. Remplacer la policy chef UPDATE avec WITH CHECK sécurisé
DROP POLICY IF EXISTS "chef_update_own_soumise_pot_depenses" ON demandes_pot_equipe;

-- USING     → la ligne doit être la sienne et en statut 'soumise' (avant update)
-- WITH CHECK → après update, le statut ne peut être que 'annulée'
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
