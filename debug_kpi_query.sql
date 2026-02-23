-- Requêtes de débogage pour l'utilisateur c7a9dc2a-ef93-4e9a-b594-de407daa30d8

-- 1. Vérifier le montant total calculé par la nouvelle logique (KPI)
-- Cela devrait correspondre à ce que la fonction get_montant_non_depose retournera pour la partie CB
SELECT 
    COALESCE(SUM(st.amount), 0) as total_cb_terrain_calcule
FROM public.support_transactions st
INNER JOIN public.tournees t ON t.id = st.tournee_id
WHERE t.user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8'
AND t.statut = 'completed'
AND st.payment_status = 'completed'
AND st.source = 'terrain';

-- 2. Lister toutes les transactions liées à cet utilisateur pour comprendre pourquoi c'est 0
-- Vérifiez les colonnes 'source', 'payment_status' et 'tournee_statut'
SELECT 
    st.id,
    st.amount,
    st.payment_status,
    st.source,
    t.statut as tournee_statut,
    st.created_at,
    st.supporter_email
FROM public.support_transactions st
INNER JOIN public.tournees t ON t.id = st.tournee_id
WHERE t.user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8';

-- 3. Vérifier si l'utilisateur a des tournées terminées
SELECT id, statut, montant_collecte, created_at 
FROM public.tournees 
WHERE user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8';
