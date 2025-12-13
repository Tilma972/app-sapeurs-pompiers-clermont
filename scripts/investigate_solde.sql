-- ========================================
-- INVESTIGATION "MON SOLDE"
-- User: c7a9dc2a-ef93-4e9a-b594-de407daa30d8
-- ========================================

-- PROBLÈME :
-- Solde affiché : 227,37€
-- Solde attendu : 163,05€
-- Écart : 64,32€

-- ========================================
-- 1. SOLDE STOCKÉ (comptes_sp)
-- ========================================

SELECT '========== 1. SOLDE STOCKÉ (comptes_sp) ==========' AS section;

SELECT
  user_id,
  solde_disponible,
  solde_utilise,
  solde_bloque,
  total_retributions,
  total_contributions_equipe
FROM comptes_sp
WHERE user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8';

-- ========================================
-- 2. MOUVEMENTS DE RÉTRIBUTION (détail)
-- ========================================

SELECT '========== 2. MOUVEMENTS RÉTRIBUTION (détail) ==========' AS section;

SELECT
  id,
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

-- Total rétributions
SELECT
  'Total rétributions (mouvements)' AS description,
  COALESCE(SUM(montant_compte_perso), 0) AS montant
FROM mouvements_retribution
WHERE user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8';

-- ========================================
-- 3. DEMANDES DE VERSEMENT (détail)
-- ========================================

SELECT '========== 3. DEMANDES VERSEMENT (détail) ==========' AS section;

SELECT
  id,
  montant_demande,
  montant_verse,
  statut,
  methode_versement,
  date_demande,
  date_traitement
FROM demandes_versement
WHERE user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8'
ORDER BY date_demande DESC;

-- Total versements
SELECT
  'Total versements effectués' AS description,
  COALESCE(SUM(montant_verse), 0) AS montant
FROM demandes_versement
WHERE user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8'
  AND statut IN ('completed', 'validée');

-- ========================================
-- 4. CALCUL MANUEL DU SOLDE
-- ========================================

SELECT '========== 4. CALCUL MANUEL SOLDE ==========' AS section;

WITH
total_retrib AS (
  SELECT COALESCE(SUM(montant_compte_perso), 0) AS montant
  FROM mouvements_retribution
  WHERE user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8'
),
total_verse AS (
  SELECT COALESCE(SUM(montant_verse), 0) AS montant
  FROM demandes_versement
  WHERE user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8'
    AND statut IN ('completed', 'validée')
)
SELECT
  tr.montant AS total_retributions,
  tv.montant AS total_verse,
  (tr.montant - tv.montant) AS solde_calcule_manuel,
  cs.solde_disponible AS solde_stocke,
  ((tr.montant - tv.montant) - COALESCE(cs.solde_disponible, 0)) AS ecart
FROM total_retrib tr
CROSS JOIN total_verse tv
LEFT JOIN comptes_sp cs ON cs.user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8';

-- ========================================
-- 5. VÉRIFICATION PAR TOURNÉE
-- ========================================

SELECT '========== 5. VÉRIFICATION PAR TOURNÉE ==========' AS section;

SELECT
  t.id AS tournee_id,
  t.zone,
  t.statut,
  t.date_fin,
  t.montant_collecte,
  mr.montant_compte_perso,
  CASE
    WHEN mr.id IS NULL THEN '❌ PAS DE MOUVEMENT'
    ELSE '✅ Mouvement présent'
  END AS statut_mouvement
FROM tournees t
LEFT JOIN mouvements_retribution mr ON mr.tournee_id = t.id
WHERE t.user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8'
  AND t.statut = 'completed'
ORDER BY t.date_fin DESC;

-- ========================================
-- 6. ANALYSE DE L'ÉCART
-- ========================================

SELECT '========== 6. ANALYSE ÉCART (227,37€ vs 163,05€) ==========' AS section;

SELECT
  227.37 AS solde_affiche,
  163.05 AS solde_attendu,
  (227.37 - 163.05) AS ecart,
  'Différence de 64,32€ à expliquer' AS note;
