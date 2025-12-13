-- ========================================
-- CORRECTION SIMPLE : Dépôt de fonds
-- User: c7a9dc2a-ef93-4e9a-b594-de407daa30d8
-- ========================================

-- PROBLÈME :
-- L'application affiche 125,50€ à déposer
-- Mais l'utilisateur doit déposer 197,50€ (Tournée 1)
-- Écart : 72€

-- CAUSE :
-- Le dépôt enregistré (341,20€) inclut probablement les CB (72€)
-- qui ne doivent pas être dans un dépôt physique

-- SOLUTION :
-- Corriger le dépôt : 341,20€ → 269,20€

-- ========================================
-- VÉRIFICATION AVANT
-- ========================================

SELECT '========== AVANT CORRECTION ==========' AS section;

SELECT
  id,
  montant_a_deposer,
  montant_recu,
  statut,
  created_at
FROM demandes_depot_fonds
WHERE id = 'd9a01133-0aa4-4a1f-80d5-dd4fb23a03ae';

-- Calcul actuel
SELECT
  (578.70 - 112.00) AS especes_total,
  341.20 AS depose_actuel,
  (578.70 - 112.00 - 341.20) AS cash_a_deposer_actuel;

-- ========================================
-- CORRECTION
-- ========================================

UPDATE demandes_depot_fonds
SET
  montant_a_deposer = 269.20,
  montant_recu = 269.20,
  updated_at = NOW()
WHERE id = 'd9a01133-0aa4-4a1f-80d5-dd4fb23a03ae';

-- ========================================
-- VÉRIFICATION APRÈS
-- ========================================

SELECT '========== APRÈS CORRECTION ==========' AS section;

SELECT
  id,
  montant_a_deposer,
  montant_recu,
  statut,
  created_at
FROM demandes_depot_fonds
WHERE id = 'd9a01133-0aa4-4a1f-80d5-dd4fb23a03ae';

-- Nouveau calcul
SELECT
  (578.70 - 112.00) AS especes_total,
  269.20 AS depose_corrige,
  (578.70 - 112.00 - 269.20) AS cash_a_deposer_nouveau;

-- ========================================
-- RÉSULTAT ATTENDU
-- ========================================

SELECT '========== RÉSULTAT ATTENDU ==========' AS section;

SELECT
  'Cash à déposer devrait être' AS description,
  '197,50 €' AS montant,
  'Espèces de la Tournée 1 non encore déposées' AS detail;
