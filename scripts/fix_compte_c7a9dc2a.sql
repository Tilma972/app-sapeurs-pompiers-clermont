-- ========================================
-- CORRECTIONS DES DONNÉES COMPTE UTILISATEUR
-- User: c7a9dc2a-ef93-4e9a-b594-de407daa30d8
-- Date: 2025-12-13
-- ========================================

-- PROBLÈME IDENTIFIÉ :
-- 1. Tournée 2 : montant_collecte incorrect (341,20€ au lieu de 122€)
-- 2. Dépôt : montant_recu incorrect (341,20€ au lieu de 197,50€)

-- ========================================
-- VÉRIFICATION AVANT CORRECTION
-- ========================================

-- Vérifier les montants actuels
SELECT '========== AVANT CORRECTION ==========' AS section;

-- Tournée 2
SELECT
  'Tournée 2' AS objet,
  id,
  montant_collecte AS montant_actuel,
  122.00 AS montant_correct,
  (montant_collecte - 122.00) AS ecart
FROM tournees
WHERE id = 'af7e6841-e06f-482b-bc9d-63283c83139a';

-- Dépôt
SELECT
  'Dépôt' AS objet,
  id,
  montant_recu AS montant_actuel,
  197.50 AS montant_correct,
  (montant_recu - 197.50) AS ecart
FROM demandes_depot_fonds
WHERE id = 'd9a01133-0aa4-4a1f-80d5-dd4fb23a03ae';

-- Calcul actuel espèces à déposer
SELECT
  'Calcul actuel' AS objet,
  (578.70 - 112.00 - 341.20) AS cash_a_deposer_actuel,
  50.00 AS cash_a_deposer_attendu;

-- ========================================
-- CORRECTIONS
-- ========================================

-- CORRECTION 1 : Tournée 2 - Corriger montant_collecte
UPDATE tournees
SET
  montant_collecte = 122.00,
  updated_at = NOW()
WHERE id = 'af7e6841-e06f-482b-bc9d-63283c83139a';

-- CORRECTION 2 : Dépôt - Corriger montant_recu et montant_a_deposer
UPDATE demandes_depot_fonds
SET
  montant_a_deposer = 197.50,
  montant_recu = 197.50,
  updated_at = NOW()
WHERE id = 'd9a01133-0aa4-4a1f-80d5-dd4fb23a03ae';

-- ========================================
-- VÉRIFICATION APRÈS CORRECTION
-- ========================================

SELECT '========== APRÈS CORRECTION ==========' AS section;

-- Vérifier les nouveaux montants
SELECT
  'Tournée 2' AS objet,
  id,
  montant_collecte
FROM tournees
WHERE id = 'af7e6841-e06f-482b-bc9d-63283c83139a';

SELECT
  'Dépôt' AS objet,
  id,
  montant_a_deposer,
  montant_recu
FROM demandes_depot_fonds
WHERE id = 'd9a01133-0aa4-4a1f-80d5-dd4fb23a03ae';

-- Recalculer espèces à déposer
WITH
total_collecte AS (
  SELECT COALESCE(SUM(montant_collecte), 0) AS montant
  FROM tournees
  WHERE user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8'
    AND statut = 'completed'
),
total_cb AS (
  SELECT COALESCE(SUM(st.amount), 0) AS montant
  FROM support_transactions st
  INNER JOIN tournees t ON t.id = st.tournee_id
  WHERE t.user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8'
    AND t.statut = 'completed'
    AND st.payment_status = 'completed'
    AND st.source = 'terrain'
    AND st.payment_method = 'carte'
),
total_depose AS (
  SELECT COALESCE(SUM(montant_recu), 0) AS montant
  FROM demandes_depot_fonds
  WHERE user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8'
    AND statut = 'valide'
)
SELECT
  'Nouveau calcul' AS objet,
  tc.montant AS total_collecte,
  tcb.montant AS total_cb,
  td.montant AS total_depose,
  GREATEST((tc.montant - tcb.montant - td.montant), 0) AS cash_a_deposer
FROM total_collecte tc
CROSS JOIN total_cb tcb
CROSS JOIN total_depose td;

-- ========================================
-- RÉSUMÉ ATTENDU
-- ========================================

SELECT '========== RÉSUMÉ ATTENDU ==========' AS section;

SELECT
  'Total collecté' AS description,
  '237,50 + 122,00 = 359,50 €' AS calcul
UNION ALL
SELECT
  'Total CB',
  '112,00 €'
UNION ALL
SELECT
  'Total déposé',
  '197,50 €'
UNION ALL
SELECT
  'Espèces à déposer',
  '(359,50 - 112,00) - 197,50 = 50,00 €' AS calcul;

-- ========================================
-- COMMENTAIRES
-- ========================================

COMMENT ON TABLE tournees IS 'Tournée 2 corrigée : montant_collecte de 341,20€ → 122,00€ (montant réel des transactions)';
COMMENT ON TABLE demandes_depot_fonds IS 'Dépôt corrigé : montant de 341,20€ → 197,50€ (montant réel déposé pour Tournée 1)';
