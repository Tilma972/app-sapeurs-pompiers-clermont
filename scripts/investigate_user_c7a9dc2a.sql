-- ========================================
-- INVESTIGATION COMPTE UTILISATEUR
-- UUID: c7a9dc2a-ef93-4e9a-b594-de407daa30d8
-- Date: 2025-12-13
-- ========================================
-- Script corrigé avec le schéma exact des tables
-- À exécuter dans l'éditeur SQL Supabase
-- ========================================

-- ========================================
-- 1. PROFIL UTILISATEUR
-- ========================================
SELECT '========== 1. PROFIL UTILISATEUR ==========' AS section;

SELECT
  id,
  full_name,
  team_id,
  role,
  created_at
FROM profiles
WHERE id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8';

-- ========================================
-- 2. COMPTE PERSONNEL (comptes_sp)
-- ========================================
SELECT '========== 2. COMPTE PERSONNEL (comptes_sp) ==========' AS section;

SELECT
  user_id,
  solde_disponible,
  solde_utilise,
  solde_bloque,
  total_retributions,
  total_contributions_equipe,
  pourcentage_pot_equipe_defaut,
  created_at,
  updated_at
FROM comptes_sp
WHERE user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8';

-- ========================================
-- 3. TOUTES LES TOURNÉES
-- ========================================
SELECT '========== 3. TOURNÉES (toutes) ==========' AS section;

SELECT
  id,
  user_id,
  equipe_id,
  zone,
  statut,
  date_debut,
  date_fin,
  calendriers_alloues,
  calendriers_distribues,
  montant_collecte,
  notes,
  created_at
FROM tournees
WHERE user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8'
ORDER BY date_debut DESC;

-- ========================================
-- 4. RÉSUMÉ DES TOURNÉES (tournee_summary)
-- ========================================
SELECT '========== 4. RÉSUMÉ TOURNÉES (tournee_summary) ==========' AS section;

SELECT
  ts.tournee_id,
  t.statut,
  t.date_debut,
  t.date_fin,
  ts.calendars_distributed,
  ts.montant_total,
  ts.dons_count,
  ts.dons_amount,
  ts.soutiens_count,
  ts.soutiens_amount,
  ts.especes_total,
  ts.cheques_total,
  ts.cartes_total
FROM tournee_summary ts
JOIN tournees t ON t.id = ts.tournee_id
WHERE t.user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8'
ORDER BY t.date_debut DESC;

-- ========================================
-- 5. TRANSACTIONS (support_transactions)
-- ========================================
SELECT '========== 5. TRANSACTIONS (support_transactions) ==========' AS section;

SELECT
  st.id,
  st.tournee_id,
  st.amount,
  st.payment_method,
  st.payment_status,
  st.calendar_accepted,
  st.calendars_given,
  st.receipt_number,
  st.created_at,
  st.stripe_session_id,
  t.statut AS tournee_statut
FROM support_transactions st
JOIN tournees t ON t.id = st.tournee_id
WHERE t.user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8'
ORDER BY st.created_at DESC;

-- ========================================
-- 6. STATISTIQUES AGRÉGÉES PAR TOURNÉE
-- ========================================
SELECT '========== 6. STATS AGRÉGÉES PAR TOURNÉE ==========' AS section;

SELECT
  t.id AS tournee_id,
  t.statut,
  t.date_debut,
  t.date_fin,
  -- Valeurs finales dans tournees
  t.calendriers_distribues AS calendriers_finaux,
  t.montant_collecte AS montant_final,
  -- Valeurs calculées depuis support_transactions
  COUNT(st.id) FILTER (WHERE st.calendar_accepted = true) AS nb_calendriers_transactions,
  COUNT(st.id) FILTER (WHERE st.payment_method = 'especes') AS nb_especes,
  COUNT(st.id) FILTER (WHERE st.payment_method = 'carte') AS nb_cartes,
  COUNT(st.id) FILTER (WHERE st.payment_method = 'cheque') AS nb_cheques,
  SUM(st.amount) FILTER (WHERE st.payment_status = 'completed') AS montant_total_transactions,
  SUM(st.amount) FILTER (WHERE st.payment_method = 'especes' AND st.payment_status = 'completed') AS montant_especes,
  SUM(st.amount) FILTER (WHERE st.payment_method = 'carte' AND st.payment_status = 'completed') AS montant_cartes,
  SUM(st.amount) FILTER (WHERE st.payment_method = 'cheque' AND st.payment_status = 'completed') AS montant_cheques
FROM tournees t
LEFT JOIN support_transactions st ON st.tournee_id = t.id
WHERE t.user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8'
GROUP BY t.id, t.statut, t.date_debut, t.date_fin, t.calendriers_distribues, t.montant_collecte
ORDER BY t.date_debut DESC;

-- ========================================
-- 7. MOUVEMENTS DE RÉTRIBUTION
-- ========================================
SELECT '========== 7. MOUVEMENTS RÉTRIBUTION ==========' AS section;

SELECT
  id,
  user_id,
  tournee_id,
  montant_total_collecte,
  montant_amicale,
  montant_pompier_total,
  pourcentage_pot_equipe,
  montant_pot_equipe,
  montant_compte_perso,
  statut,
  created_at
FROM mouvements_retribution
WHERE user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8'
ORDER BY created_at DESC;

-- ========================================
-- 8. DEMANDES DE VERSEMENT
-- ========================================
SELECT '========== 8. DEMANDES VERSEMENT ==========' AS section;

SELECT
  id,
  user_id,
  montant_demande,
  montant_verse,
  statut,
  methode_versement,
  date_demande,
  date_traitement,
  notes
FROM demandes_versement
WHERE user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8'
ORDER BY date_demande DESC;

-- ========================================
-- 9. DEMANDES DE DÉPÔT DE FONDS
-- ========================================
SELECT '========== 9. DEMANDES DÉPÔT FONDS ==========' AS section;

SELECT
  id,
  user_id,
  montant_a_deposer,
  montant_recu,
  statut,
  created_at,
  date_depot_prevue,
  updated_at,
  notes_utilisateur,
  notes_tresorier
FROM demandes_depot_fonds
WHERE user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8'
ORDER BY created_at DESC;

-- ========================================
-- 10. CALCUL MANUEL DU SOLDE ATTENDU
-- ========================================
SELECT '========== 10. CALCUL MANUEL SOLDE ==========' AS section;

WITH
-- Total collecté (depuis mouvements_retribution)
total_collecte AS (
  SELECT
    COALESCE(SUM(montant_compte_perso), 0) AS montant
  FROM mouvements_retribution
  WHERE user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8'
),
-- Total versé (depuis demandes_versement)
total_verse AS (
  SELECT
    COALESCE(SUM(montant_verse), 0) AS montant
  FROM demandes_versement
  WHERE user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8'
    AND statut IN ('completed', 'validée')
)
SELECT
  tc.montant AS total_retributions,
  tv.montant AS total_verse,
  (tc.montant - tv.montant) AS solde_calcule,
  -- Comparer avec la valeur stockée
  cs.solde_disponible AS solde_stocke,
  (tc.montant - tv.montant - COALESCE(cs.solde_disponible, 0)) AS ecart
FROM total_collecte tc
CROSS JOIN total_verse tv
LEFT JOIN comptes_sp cs ON cs.user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8';

-- ========================================
-- 11. DÉTAIL DES FONDS COLLECTÉS
-- ========================================
SELECT '========== 11. DÉTAIL FONDS COLLECTÉS ==========' AS section;

WITH tournees_user AS (
  SELECT id
  FROM tournees
  WHERE user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8'
)
SELECT
  -- Total collecté (toutes transactions complétées)
  COALESCE(SUM(st.amount) FILTER (WHERE st.payment_status = 'completed'), 0) AS total_collecte,
  -- Cartes validées
  COALESCE(SUM(st.amount) FILTER (WHERE st.payment_method = 'carte' AND st.payment_status = 'completed'), 0) AS total_cartes_valide,
  -- Espèces collectées
  COALESCE(SUM(st.amount) FILTER (WHERE st.payment_method = 'especes' AND st.payment_status = 'completed'), 0) AS total_especes_collecte,
  -- Chèques collectés
  COALESCE(SUM(st.amount) FILTER (WHERE st.payment_method = 'cheque' AND st.payment_status = 'completed'), 0) AS total_cheques_collecte,
  -- Nombre de transactions
  COUNT(*) FILTER (WHERE st.payment_status = 'completed') AS nb_transactions
FROM support_transactions st
WHERE st.tournee_id IN (SELECT id FROM tournees_user);

-- ========================================
-- 12. ESPÈCES NON DÉPOSÉES
-- ========================================
SELECT '========== 12. ESPÈCES NON DÉPOSÉES (calcul détaillé) ==========' AS section;

WITH tournees_user AS (
  SELECT id
  FROM tournees
  WHERE user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8'
),
-- Total espèces collectées
especes_collectees AS (
  SELECT
    COALESCE(SUM(st.amount), 0) AS montant
  FROM support_transactions st
  WHERE st.tournee_id IN (SELECT id FROM tournees_user)
    AND st.payment_method = 'especes'
    AND st.payment_status = 'completed'
),
-- Total espèces déjà déposées (via demandes_depot_fonds validées)
especes_deposees AS (
  SELECT
    COALESCE(SUM(ddf.montant_recu), 0) AS montant
  FROM demandes_depot_fonds ddf
  WHERE ddf.user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8'
    AND ddf.statut IN ('validée', 'completed')
    AND ddf.montant_recu IS NOT NULL
)
SELECT
  ec.montant AS especes_collectees,
  ed.montant AS especes_deposees,
  (ec.montant - ed.montant) AS especes_non_deposees
FROM especes_collectees ec
CROSS JOIN especes_deposees ed;

-- ========================================
-- 13. ANALYSE DÉTAILLÉE DES MONTANTS
-- ========================================
SELECT '========== 13. ANALYSE DÉTAILLÉE ==========' AS section;

-- Comparaison entre ce qui est stocké dans comptes_sp
-- et ce qui devrait être calculé
SELECT
  'Solde stocké dans comptes_sp' AS source,
  cs.solde_disponible AS montant
FROM comptes_sp cs
WHERE cs.user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8'

UNION ALL

SELECT
  'Total rétributions (mouvements_retribution)',
  COALESCE(SUM(mr.montant_compte_perso), 0)
FROM mouvements_retribution mr
WHERE mr.user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8'

UNION ALL

SELECT
  'Total versements effectués (demandes_versement)',
  COALESCE(SUM(dv.montant_verse), 0)
FROM demandes_versement dv
WHERE dv.user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8'
  AND dv.statut IN ('completed', 'validée')

UNION ALL

SELECT
  'Solde calculé (retrib - versements)',
  COALESCE(
    (SELECT SUM(montant_compte_perso) FROM mouvements_retribution WHERE user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8'),
    0
  ) - COALESCE(
    (SELECT SUM(montant_verse) FROM demandes_versement WHERE user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8' AND statut IN ('completed', 'validée')),
    0
  );

-- ========================================
-- 14. VÉRIFICATION DES TOURNÉES SANS MOUVEMENT
-- ========================================
SELECT '========== 14. TOURNÉES SANS MOUVEMENT DE RÉTRIBUTION ==========' AS section;

SELECT
  t.id,
  t.zone,
  t.statut,
  t.date_fin,
  t.montant_collecte,
  CASE
    WHEN mr.id IS NULL THEN '❌ MOUVEMENT MANQUANT'
    ELSE '✅ Mouvement présent'
  END AS statut_mouvement
FROM tournees t
LEFT JOIN mouvements_retribution mr ON mr.tournee_id = t.id
WHERE t.user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8'
  AND t.statut = 'completed'
ORDER BY t.date_fin DESC;

-- ========================================
-- 15. COMPARAISON MONTANTS TOURNÉES VS TRANSACTIONS
-- ========================================
SELECT '========== 15. COHÉRENCE TOURNÉES <> TRANSACTIONS ==========' AS section;

SELECT
  t.id,
  t.zone,
  t.statut,
  t.montant_collecte AS montant_stocke_tournee,
  COALESCE(SUM(st.amount) FILTER (WHERE st.payment_status = 'completed'), 0) AS montant_calcule_transactions,
  (t.montant_collecte - COALESCE(SUM(st.amount) FILTER (WHERE st.payment_status = 'completed'), 0)) AS ecart
FROM tournees t
LEFT JOIN support_transactions st ON st.tournee_id = t.id
WHERE t.user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8'
  AND t.statut = 'completed'
GROUP BY t.id, t.zone, t.statut, t.montant_collecte
ORDER BY t.date_debut DESC;
