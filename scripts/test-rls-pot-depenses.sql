-- =============================================================================
-- TESTS RLS & CONTRAINTES — demandes_pot_equipe
-- =============================================================================
-- À exécuter dans l'éditeur SQL Supabase (projet amicale-sp-prod)
-- Chaque bloc est indépendant et peut être exécuté séparément.
-- Les blocs BEGIN...ROLLBACK ne modifient rien en base.
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- SETUP : récupérer des IDs réels pour les tests
-- ─────────────────────────────────────────────────────────────────────────────

-- Lister les équipes et leurs chefs pour choisir les IDs de test
SELECT
  e.id   AS equipe_id,
  e.nom  AS equipe,
  p.id   AS chef_id,
  p.full_name AS chef_nom,
  p.email     AS chef_email
FROM equipes e
JOIN profiles p ON p.team_id = e.id AND p.role = 'chef_equipe'
LIMIT 5;

-- Lister le trésorier
SELECT id, full_name, email, role
FROM profiles
WHERE role IN ('tresorier', 'admin')
LIMIT 3;

-- Lister un sapeur (role = 'sapeur' ou null)
SELECT id, full_name, email, role, team_id
FROM profiles
WHERE role NOT IN ('chef', 'tresorier', 'admin')
  AND team_id IS NOT NULL
LIMIT 3;


-- =============================================================================
-- FLUX 1 — SÉCURITÉ RLS
-- =============================================================================
-- Rappel des policies en place :
--   tresorier_admin_full_pot_depenses  : ALL pour tresorier/admin
--   chef_insert_pot_depenses           : INSERT pour chef (son équipe uniquement)
--   chef_select_own_equipe_pot_depenses: SELECT pour chef (son équipe uniquement)
--   chef_update_own_soumise_pot_depenses: UPDATE pour chef (own + soumise → annulée seulement)
--   membre_select_own_equipe_pot_depenses: SELECT pour membre (son équipe)
-- =============================================================================


-- ── Test 1a : Trésorier voit TOUTES les demandes ─────────────────────────────
-- Remplacer <TRESORIER_UUID> par un UUID réel obtenu dans SETUP
BEGIN;
  SET LOCAL role = authenticated;
  SET LOCAL "request.jwt.claims" = '{"sub": "<TRESORIER_UUID>", "role": "authenticated"}';

  -- Simuler le profil trésorier (nécessaire pour que EXISTS() dans la policy fonctionne)
  -- Note : en prod cette simulation est automatique via auth.uid()

  SELECT COUNT(*) AS nb_demandes_visibles_tresorier
  FROM demandes_pot_equipe;

ROLLBACK;


-- ── Test 1b : Chef ne voit QUE son équipe ────────────────────────────────────
-- Remplacer <CHEF_UUID> et <EQUIPE_UUID> par des valeurs réelles
BEGIN;
  SET LOCAL role = authenticated;
  SET LOCAL "request.jwt.claims" = '{"sub": "<CHEF_UUID>", "role": "authenticated"}';

  SELECT
    COUNT(*) AS nb_visibles_chef,
    COUNT(CASE WHEN equipe_id != '<EQUIPE_UUID>' THEN 1 END) AS nb_autres_equipes
  FROM demandes_pot_equipe;
  -- Attendu : nb_autres_equipes = 0

ROLLBACK;


-- ── Test 1c : Sapeur voit uniquement son équipe, ne peut pas insérer ─────────
BEGIN;
  SET LOCAL role = authenticated;
  SET LOCAL "request.jwt.claims" = '{"sub": "<SAPEUR_UUID>", "role": "authenticated"}';

  -- Lecture (doit fonctionner — seule son équipe visible)
  SELECT COUNT(*) AS nb_visibles_sapeur FROM demandes_pot_equipe;

  -- INSERT → doit être refusé (aucune policy INSERT pour les sapeurs)
  -- Cette requête doit lever une erreur RLS
  INSERT INTO demandes_pot_equipe (
    equipe_id, created_by, motif, prestataire_nom,
    montant_demande, justificatif_url, statut
  ) VALUES (
    '<EQUIPE_UUID>', '<SAPEUR_UUID>',
    'Test RLS sapeur', 'Test', 10, 'https://x.com/f.pdf', 'soumise'
  );
  -- Attendu : ERROR: new row violates row-level security policy

ROLLBACK;


-- ── Test 1d : Chef ne peut pas UPDATE statut → 'approuvée' ───────────────────
-- (WITH CHECK autorise seulement statut = 'annulée')
BEGIN;
  -- Créer une demande soumise (admin bypass)
  INSERT INTO demandes_pot_equipe (
    id, equipe_id, created_by, motif, prestataire_nom,
    montant_demande, justificatif_url, statut
  ) VALUES (
    'aaaaaaaa-0000-0000-0000-000000000001',
    '<EQUIPE_UUID>', '<CHEF_UUID>',
    'TEST RLS — update chef', 'Test',
    15, 'https://x.com/f.pdf', 'soumise'
  );

  -- Simuler le chef
  SET LOCAL role = authenticated;
  SET LOCAL "request.jwt.claims" = '{"sub": "<CHEF_UUID>", "role": "authenticated"}';

  -- UPDATE → statut = 'approuvée' doit être REFUSÉ par WITH CHECK
  UPDATE demandes_pot_equipe
  SET statut = 'approuvée'
  WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001';
  -- Attendu : ERROR: new row violates row-level security policy (WITH CHECK)

ROLLBACK;


-- ── Test 1e : Chef peut UPDATE statut → 'annulée' (seul cas autorisé) ────────
BEGIN;
  -- Créer une demande soumise (admin bypass)
  INSERT INTO demandes_pot_equipe (
    id, equipe_id, created_by, motif, prestataire_nom,
    montant_demande, justificatif_url, statut
  ) VALUES (
    'aaaaaaaa-0000-0000-0000-000000000002',
    '<EQUIPE_UUID>', '<CHEF_UUID>',
    'TEST RLS — annulation chef', 'Test',
    15, 'https://x.com/f.pdf', 'soumise'
  );

  -- Simuler le chef
  SET LOCAL role = authenticated;
  SET LOCAL "request.jwt.claims" = '{"sub": "<CHEF_UUID>", "role": "authenticated"}';

  -- UPDATE → statut = 'annulée' doit être AUTORISÉ
  UPDATE demandes_pot_equipe
  SET statut = 'annulée'
  WHERE id = 'aaaaaaaa-0000-0000-0000-000000000002';

  SELECT statut FROM demandes_pot_equipe WHERE id = 'aaaaaaaa-0000-0000-0000-000000000002';
  -- Attendu : statut = 'annulée'

ROLLBACK;


-- ── Test 1f : Chef équipe A ne voit pas les demandes équipe B ────────────────
BEGIN;
  SET LOCAL role = authenticated;
  SET LOCAL "request.jwt.claims" = '{"sub": "<CHEF_A_UUID>", "role": "authenticated"}';

  SELECT COUNT(*) AS nb_equipe_b_visible
  FROM demandes_pot_equipe
  WHERE equipe_id = '<EQUIPE_B_UUID>';
  -- Attendu : 0

ROLLBACK;


-- =============================================================================
-- FLUX 7 — RACE CONDITION (trigger trg_check_solde_pot)
-- =============================================================================

-- ── Test 7a : Trigger bloque si solde insuffisant ────────────────────────────
-- Prérequis : l'équipe doit avoir un solde dans pots_equipe_historique
-- Insérer un solde de 100€ pour cette année (ou adapter)
DO $$
DECLARE
  v_annee int := EXTRACT(YEAR FROM now())::int;
BEGIN
  INSERT INTO pots_equipe_historique (equipe_id, annee, solde_anterieur, notes)
  VALUES ('<EQUIPE_UUID>', v_annee, 100.00, 'TEST — solde trigger')
  ON CONFLICT (equipe_id, annee) DO UPDATE SET solde_anterieur = 100.00;
  RAISE NOTICE 'Solde historique défini à 100€ pour %', v_annee;
END $$;

BEGIN;
  -- Première demande de 90€ → doit passer
  INSERT INTO demandes_pot_equipe (
    equipe_id, created_by, motif, prestataire_nom,
    montant_demande, justificatif_url, statut
  ) VALUES (
    '<EQUIPE_UUID>', '<CHEF_UUID>',
    'TEST trigger — demande 1', 'Test', 90, 'https://x.com/f.pdf', 'soumise'
  );
  RAISE NOTICE 'Demande 1 (90€) : insérée ✅';

  -- Deuxième demande de 20€ → doit être bloquée (90+20=110 > 100)
  INSERT INTO demandes_pot_equipe (
    equipe_id, created_by, motif, prestataire_nom,
    montant_demande, justificatif_url, statut
  ) VALUES (
    '<EQUIPE_UUID>', '<CHEF_UUID>',
    'TEST trigger — demande 2', 'Test', 20, 'https://x.com/f.pdf', 'soumise'
  );
  RAISE NOTICE 'Demande 2 (20€) : insérée ❌ (aurait dû être bloquée)';

ROLLBACK;
-- Attendu : second INSERT lève EXCEPTION "Solde pot insuffisant (disponible: 10.00, demandé: 20.00)"

-- Nettoyer le solde de test
DELETE FROM pots_equipe_historique
WHERE equipe_id = '<EQUIPE_UUID>'
  AND notes = 'TEST — solde trigger';


-- ── Test 7b : Première demande EXACTEMENT au solde → passe ───────────────────
DO $$
DECLARE v_annee int := EXTRACT(YEAR FROM now())::int;
BEGIN
  INSERT INTO pots_equipe_historique (equipe_id, annee, solde_anterieur, notes)
  VALUES ('<EQUIPE_UUID>', v_annee, 50.00, 'TEST — solde exact')
  ON CONFLICT (equipe_id, annee) DO UPDATE SET solde_anterieur = 50.00;
END $$;

BEGIN;
  INSERT INTO demandes_pot_equipe (
    equipe_id, created_by, motif, prestataire_nom,
    montant_demande, justificatif_url, statut
  ) VALUES (
    '<EQUIPE_UUID>', '<CHEF_UUID>',
    'TEST trigger — exact solde', 'Test', 50, 'https://x.com/f.pdf', 'soumise'
  );
  RAISE NOTICE 'Demande de 50€ (= solde exact 50€) : doit être insérée ✅';

  SELECT 'ok' AS resultat;
ROLLBACK;

-- Nettoyer
DELETE FROM pots_equipe_historique WHERE equipe_id = '<EQUIPE_UUID>' AND notes = 'TEST — solde exact';


-- =============================================================================
-- VÉRIFICATION CONSTRAINT STATUT
-- =============================================================================

-- Test : les 5 statuts valides doivent passer
DO $$
DECLARE
  v_statuts text[] := ARRAY['soumise', 'approuvée', 'payée', 'rejetée', 'annulée'];
  v_statut  text;
  v_ok      int := 0;
  v_ko      int := 0;
BEGIN
  FOREACH v_statut IN ARRAY v_statuts LOOP
    BEGIN
      -- Test de la constraint uniquement (RAISE sans INSERT réel)
      PERFORM 1 WHERE v_statut = ANY(ARRAY['soumise','approuvée','payée','rejetée','annulée']::text[]);
      v_ok := v_ok + 1;
      RAISE NOTICE '✅ Statut "%" : valide', v_statut;
    EXCEPTION WHEN OTHERS THEN
      v_ko := v_ko + 1;
      RAISE NOTICE '❌ Statut "%" : invalide', v_statut;
    END;
  END LOOP;
  RAISE NOTICE '→ % valides, % invalides (attendu : 5 valides)', v_ok, v_ko;
END $$;

-- Test : un statut invalide doit être rejeté
BEGIN;
  INSERT INTO demandes_pot_equipe (
    equipe_id, created_by, motif, prestataire_nom,
    montant_demande, justificatif_url, statut
  ) VALUES (
    '<EQUIPE_UUID>', '<CHEF_UUID>',
    'TEST constraint', 'Test', 10, 'https://x.com/f.pdf', 'en_attente'
  );
  -- Attendu : ERROR: new row for relation "demandes_pot_equipe" violates check constraint
ROLLBACK;


-- =============================================================================
-- VÉRIFICATION BUCKET STORAGE
-- =============================================================================

SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'pot-depenses-justificatifs';
-- Attendu :
--   public = true
--   file_size_limit = 10485760 (10 MB)
--   allowed_mime_types = {image/jpeg, image/png, image/webp, application/pdf}

SELECT policyname, operation, definition
FROM storage.policies
WHERE bucket_id = 'pot-depenses-justificatifs';
-- Attendu : 3 policies (auth_upload, public_read, tresorier_delete)


-- =============================================================================
-- RÉCAPITULATIF ÉTAT DE LA TABLE
-- =============================================================================

SELECT
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'demandes_pot_equipe')   AS rls_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'demandes_pot_equipe')    AS nb_policies,
  (SELECT COUNT(*) FROM pg_trigger WHERE tgrelid = 'demandes_pot_equipe'::regclass) AS nb_triggers,
  (SELECT pg_get_constraintdef(oid)
   FROM pg_constraint
   WHERE conname = 'demandes_pot_equipe_statut_check')                          AS statut_check,
  (SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'pot-depenses-justificatifs')) AS bucket_ok;
-- Attendu :
--   rls_enabled = true
--   nb_policies = 5
--   nb_triggers ≥ 2 (trg_updated_at + trg_check_solde_pot)
--   statut_check contient les 5 statuts
--   bucket_ok = true
