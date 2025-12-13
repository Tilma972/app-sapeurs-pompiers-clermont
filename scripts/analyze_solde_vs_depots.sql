-- ========================================
-- ANALYSE SOLDE : Rétributions vs Dépôts
-- User: c7a9dc2a-ef93-4e9a-b594-de407daa30d8
-- ========================================

-- LOGIQUE ACTUELLE (problématique) :
-- Tournée clôturée → Mouvement rétribution → Solde augmente
-- MAIS les espèces ne sont pas encore déposées !

-- LOGIQUE SOUHAITÉE (future) :
-- Fonds déposés → ALORS mouvement rétribution → ALORS solde augmente

-- ========================================
-- 1. MOUVEMENTS DE RÉTRIBUTION PAR TOURNÉE
-- ========================================

SELECT '========== 1. MOUVEMENTS PAR TOURNÉE ==========' AS section;

SELECT
  t.id AS tournee_id,
  t.zone,
  t.date_fin,
  t.montant_collecte,
  mr.montant_compte_perso AS retribution,
  mr.created_at AS retribution_date,
  -- Vérifier si un dépôt existe pour cette période
  CASE
    WHEN EXISTS (
      SELECT 1 FROM demandes_depot_fonds ddf
      WHERE ddf.user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8'
        AND ddf.statut = 'valide'
        AND ddf.created_at >= t.date_fin
    ) THEN '✅ Déposé'
    ELSE '❌ Non déposé'
  END AS statut_depot
FROM tournees t
LEFT JOIN mouvements_retribution mr ON mr.tournee_id = t.id
WHERE t.user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8'
  AND t.statut = 'completed'
ORDER BY t.date_fin DESC;

-- ========================================
-- 2. TOTAL RÉTRIBUTIONS
-- ========================================

SELECT '========== 2. TOTAL RÉTRIBUTIONS ==========' AS section;

SELECT
  'Total rétributions (tous mouvements)' AS description,
  COALESCE(SUM(montant_compte_perso), 0) AS montant
FROM mouvements_retribution
WHERE user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8';

-- ========================================
-- 3. DÉPÔTS VALIDÉS
-- ========================================

SELECT '========== 3. DÉPÔTS VALIDÉS ==========' AS section;

SELECT
  id,
  montant_a_deposer,
  montant_recu,
  created_at,
  valide_le
FROM demandes_depot_fonds
WHERE user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8'
  AND statut = 'valide'
ORDER BY created_at DESC;

-- ========================================
-- 4. CALCUL DU SOLDE "AJUSTÉ"
-- ========================================

SELECT '========== 4. SOLDE ACTUEL vs AJUSTÉ ==========' AS section;

WITH
total_retributions AS (
  SELECT COALESCE(SUM(montant_compte_perso), 0) AS montant
  FROM mouvements_retribution
  WHERE user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8'
),
total_depots AS (
  SELECT COALESCE(SUM(montant_recu), 0) AS montant
  FROM demandes_depot_fonds
  WHERE user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8'
    AND statut = 'valide'
)
SELECT
  tr.montant AS total_retributions_calculees,
  td.montant AS total_depots_valides,
  cs.solde_disponible AS solde_actuel_stocke,

  -- Si la logique future était appliquée :
  -- Solde = Rétributions sur fonds déposés seulement
  -- Pour l'instant, approximation :
  -- On ne peut pas calculer précisément sans lier chaque mouvement à un dépôt

  227.37 AS solde_affiche,
  163.05 AS solde_attendu,
  (227.37 - 163.05) AS ecart_64_32

FROM total_retributions tr
CROSS JOIN total_depots td
LEFT JOIN comptes_sp cs ON cs.user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8';

-- ========================================
-- 5. HYPOTHÈSE : Calcul par proportions
-- ========================================

SELECT '========== 5. CALCUL PAR PROPORTIONS ==========' AS section;

-- Si on suppose que les rétributions sont proportionnelles aux dépôts :
-- Tournée 1 : 237,50€ collectés, 0€ déposés → rétribution pas encore "acquise"
-- Tournée 2 : 341,20€ collectés, 269,20€ déposés → rétribution partiellement acquise

WITH
collecte_total AS (
  SELECT COALESCE(SUM(montant_collecte), 0) AS montant
  FROM tournees
  WHERE user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8'
    AND statut = 'completed'
),
depots_total AS (
  SELECT COALESCE(SUM(montant_recu), 0) AS montant
  FROM demandes_depot_fonds
  WHERE user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8'
    AND statut = 'valide'
),
retributions_total AS (
  SELECT COALESCE(SUM(montant_compte_perso), 0) AS montant
  FROM mouvements_retribution
  WHERE user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8'
)
SELECT
  ct.montant AS collecte_totale,
  dt.montant AS depots_valides,
  rt.montant AS retributions_totales,

  -- Proportion déposée
  CASE
    WHEN ct.montant > 0 THEN (dt.montant / ct.montant * 100)
    ELSE 0
  END AS pourcentage_depose,

  -- Rétribution "acquise" (proportionnelle aux dépôts)
  CASE
    WHEN ct.montant > 0 THEN (rt.montant * dt.montant / ct.montant)
    ELSE 0
  END AS retribution_acquise_calculee,

  163.05 AS retribution_acquise_attendue

FROM collecte_total ct
CROSS JOIN depots_total dt
CROSS JOIN retributions_total rt;

-- ========================================
-- 6. DÉTAIL DES MOUVEMENTS
-- ========================================

SELECT '========== 6. DÉTAIL MOUVEMENTS RÉTRIBUTION ==========' AS section;

SELECT
  mr.id,
  mr.tournee_id,
  t.zone,
  t.date_fin,
  mr.montant_total_collecte,
  mr.montant_amicale,
  mr.montant_pompier_total,
  mr.pourcentage_pot_equipe,
  mr.montant_pot_equipe,
  mr.montant_compte_perso,
  mr.created_at
FROM mouvements_retribution mr
JOIN tournees t ON t.id = mr.tournee_id
WHERE mr.user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8'
ORDER BY mr.created_at DESC;
