-- ========================================
-- INVESTIGATION COMPTE UTILISATEUR
-- UUID: c7a9dc2a-ef93-4e9a-b594-de407daa30d8
-- Date: 2025-12-13
-- ========================================

-- Variables pour faciliter la modification
\set user_id 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8'

-- ========================================
-- 1. PROFIL UTILISATEUR
-- ========================================
SELECT
  '========== PROFIL UTILISATEUR ==========' AS section;

SELECT
  id,
  full_name,
  team_id,
  role,
  created_at
FROM profiles
WHERE id = :'user_id';

-- ========================================
-- 2. COMPTE PERSONNEL (comptes_sp)
-- ========================================
SELECT
  '========== COMPTE PERSONNEL (comptes_sp) ==========' AS section;

SELECT
  user_id,
  solde_disponible,
  total_retributions,
  pourcentage_pot_equipe_defaut,
  created_at,
  updated_at
FROM comptes_sp
WHERE user_id = :'user_id';

-- ========================================
-- 3. TOUTES LES TOURNÉES
-- ========================================
SELECT
  '========== TOURNÉES (toutes) ==========' AS section;

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
WHERE user_id = :'user_id'
ORDER BY date_debut DESC;

-- ========================================
-- 4. RÉSUMÉ DES TOURNÉES (tournee_summary)
-- ========================================
SELECT
  '========== RÉSUMÉ TOURNÉES (tournee_summary) ==========' AS section;

SELECT
  ts.tournee_id,
  t.statut,
  t.date_debut,
  t.date_fin,
  ts.calendars_distributed,
  ts.montant_total,
  ts.cash_count,
  ts.cb_count,
  ts.cash_total,
  ts.cb_total
FROM tournee_summary ts
JOIN tournees t ON t.id = ts.tournee_id
WHERE t.user_id = :'user_id'
ORDER BY t.date_debut DESC;

-- ========================================
-- 5. TRANSACTIONS (support_transactions)
-- ========================================
SELECT
  '========== TRANSACTIONS (support_transactions) ==========' AS section;

SELECT
  st.id,
  st.tournee_id,
  st.amount,
  st.payment_method,
  st.payment_status,
  st.calendar_accepted,
  st.receipt_number,
  st.created_at,
  st.stripe_session_id,
  t.statut AS tournee_statut
FROM support_transactions st
JOIN tournees t ON t.id = st.tournee_id
WHERE t.user_id = :'user_id'
ORDER BY st.created_at DESC;

-- ========================================
-- 6. STATISTIQUES AGRÉGÉES PAR TOURNÉE
-- ========================================
SELECT
  '========== STATS AGRÉGÉES PAR TOURNÉE ==========' AS section;

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
  COUNT(st.id) FILTER (WHERE st.payment_method = 'cash') AS nb_cash,
  COUNT(st.id) FILTER (WHERE st.payment_method = 'card') AS nb_cb,
  SUM(st.amount) FILTER (WHERE st.payment_status = 'completed') AS montant_total_transactions,
  SUM(st.amount) FILTER (WHERE st.payment_method = 'cash' AND st.payment_status = 'completed') AS montant_cash,
  SUM(st.amount) FILTER (WHERE st.payment_method = 'card' AND st.payment_status = 'completed') AS montant_cb
FROM tournees t
LEFT JOIN support_transactions st ON st.tournee_id = t.id
WHERE t.user_id = :'user_id'
GROUP BY t.id, t.statut, t.date_debut, t.date_fin, t.calendriers_distribues, t.montant_collecte
ORDER BY t.date_debut DESC;

-- ========================================
-- 7. MOUVEMENTS DE RÉTRIBUTION
-- ========================================
SELECT
  '========== MOUVEMENTS RÉTRIBUTION ==========' AS section;

SELECT
  id,
  user_id,
  tournee_id,
  montant_total_collecte,
  montant_compte_perso,
  montant_pot_equipe,
  pourcentage_pot_applique,
  created_at
FROM mouvements_retribution
WHERE user_id = :'user_id'
ORDER BY created_at DESC;

-- ========================================
-- 8. DEMANDES DE VERSEMENT
-- ========================================
SELECT
  '========== DEMANDES VERSEMENT ==========' AS section;

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
WHERE user_id = :'user_id'
ORDER BY date_demande DESC;

-- ========================================
-- 9. DEMANDES DE DÉPÔT DE FONDS
-- ========================================
SELECT
  '========== DEMANDES DÉPÔT FONDS ==========' AS section;

SELECT
  id,
  user_id,
  montant_especes,
  statut,
  created_at,
  date_rdv_souhaitee,
  updated_at
FROM demandes_depot_fonds
WHERE user_id = :'user_id'
ORDER BY created_at DESC;

-- ========================================
-- 10. CALCUL MANUEL DU SOLDE ATTENDU
-- ========================================
SELECT
  '========== CALCUL MANUEL SOLDE ==========' AS section;

WITH
-- Total collecté (depuis mouvements_retribution)
total_collecte AS (
  SELECT
    COALESCE(SUM(montant_compte_perso), 0) AS montant
  FROM mouvements_retribution
  WHERE user_id = :'user_id'
),
-- Total versé (depuis demandes_versement)
total_verse AS (
  SELECT
    COALESCE(SUM(montant_verse), 0) AS montant
  FROM demandes_versement
  WHERE user_id = :'user_id'
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
LEFT JOIN comptes_sp cs ON cs.user_id = :'user_id';

-- ========================================
-- 11. DÉTAIL DES FONDS COLLECTÉS
-- ========================================
SELECT
  '========== DÉTAIL FONDS COLLECTÉS ==========' AS section;

WITH tournees_user AS (
  SELECT id
  FROM tournees
  WHERE user_id = :'user_id'
)
SELECT
  -- Total collecté (toutes transactions complétées)
  COALESCE(SUM(st.amount) FILTER (WHERE st.payment_status = 'completed'), 0) AS total_collecte,
  -- CB validées
  COALESCE(SUM(st.amount) FILTER (WHERE st.payment_method = 'card' AND st.payment_status = 'completed'), 0) AS total_cb_valide,
  -- Espèces déposées (marquées comme deposited_at non null)
  COALESCE(SUM(st.amount) FILTER (WHERE st.payment_method = 'cash' AND st.deposited_at IS NOT NULL), 0) AS total_cash_depose,
  -- Espèces à déposer (cash sans deposited_at)
  COALESCE(SUM(st.amount) FILTER (WHERE st.payment_method = 'cash' AND st.deposited_at IS NULL AND st.payment_status = 'completed'), 0) AS cash_a_deposer
FROM support_transactions st
WHERE st.tournee_id IN (SELECT id FROM tournees_user);

-- ========================================
-- 12. VÉRIFICATION COHÉRENCE
-- ========================================
SELECT
  '========== VÉRIFICATION COHÉRENCE ==========' AS section;

-- Vérifier que toutes les transactions ont bien un tournee_id valide
SELECT
  COUNT(*) AS transactions_orphelines
FROM support_transactions st
WHERE st.tournee_id NOT IN (SELECT id FROM tournees)
  AND st.id IN (
    SELECT st2.id
    FROM support_transactions st2
    JOIN tournees t ON t.id = st2.tournee_id
    WHERE t.user_id = :'user_id'
  );
