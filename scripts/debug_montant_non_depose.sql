-- ========================================
-- CALCUL DÉTAILLÉ DE get_montant_non_depose()
-- Pour comprendre l'écart avec les 125,50€ affichés
-- ========================================

-- Reproduire exactement la logique de la fonction
WITH
-- 1. Total collecté dans tournées completed
total_collecte AS (
  SELECT COALESCE(SUM(montant_collecte), 0) AS montant
  FROM tournees
  WHERE user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8'
    AND statut = 'completed'
),
-- 2. Total CB validées (avec filtre source='terrain')
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
-- 3. Total déjà déposé (statut='valide')
total_depose AS (
  SELECT COALESCE(SUM(montant_recu), 0) AS montant
  FROM demandes_depot_fonds
  WHERE user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8'
    AND statut = 'valide'
)
SELECT
  tc.montant AS total_collecte,
  tcb.montant AS total_cb,
  td.montant AS total_depose,
  GREATEST((tc.montant - tcb.montant - td.montant), 0) AS cash_a_deposer_calcule
FROM total_collecte tc
CROSS JOIN total_cb tcb
CROSS JOIN total_depose td;
