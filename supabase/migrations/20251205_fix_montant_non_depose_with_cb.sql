-- ============================================
-- Migration: Correction calcul montant non déposé avec paiements CB
-- Date: 2025-12-05
-- Description: Prend en compte les paiements par carte bleue dans le calcul
-- ============================================

-- Fonction corrigée pour calculer le montant cash non encore déposé
-- En tenant compte des paiements par carte bleue déjà sécurisés
CREATE OR REPLACE FUNCTION public.get_montant_non_depose(p_user_id UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    v_total_collecte DECIMAL(10,2);
    v_total_cb DECIMAL(10,2);
    v_total_depose DECIMAL(10,2);
    v_cash_a_deposer DECIMAL(10,2);
BEGIN
    -- 1. Total collecté dans toutes les tournées completed
    SELECT COALESCE(SUM(montant_collecte), 0)
    INTO v_total_collecte
    FROM public.tournees
    WHERE user_id = p_user_id
    AND statut = 'completed';

    -- 2. Total des paiements CB validés (succeeded) pour les tournées de cet utilisateur
    -- Ces montants sont déjà sécurisés via Stripe, pas besoin de les déposer
    SELECT COALESCE(SUM(cp.amount), 0)
    INTO v_total_cb
    FROM public.card_payments cp
    INNER JOIN public.tournees t ON t.id = cp.tournee_id
    WHERE t.user_id = p_user_id
    AND t.statut = 'completed'
    AND cp.status = 'succeeded';

    -- 3. Total déjà déposé en cash (demandes validées)
    SELECT COALESCE(SUM(montant_recu), 0)
    INTO v_total_depose
    FROM public.demandes_depot_fonds
    WHERE user_id = p_user_id
    AND statut = 'valide';

    -- 4. Cash restant à déposer = (Total collecté - CB validés) - Cash déjà déposé
    v_cash_a_deposer := v_total_collecte - v_total_cb - v_total_depose;

    -- Retourner 0 si négatif (cas où il y aurait eu trop de dépôts par erreur)
    RETURN GREATEST(v_cash_a_deposer, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mise à jour du commentaire pour documenter le changement
COMMENT ON FUNCTION public.get_montant_non_depose(UUID) IS
'Calcule le montant cash non encore déposé pour un utilisateur.
Formule: (Total collecté - Paiements CB validés) - Dépôts cash validés
Les paiements CB (Stripe) avec status=succeeded sont considérés comme déjà sécurisés.';

-- Fonction complémentaire pour obtenir le détail des fonds (optionnel, pour UI améliorée)
CREATE OR REPLACE FUNCTION public.get_detail_fonds_utilisateur(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_total_collecte DECIMAL(10,2);
    v_total_cb DECIMAL(10,2);
    v_total_depose DECIMAL(10,2);
    v_cash_a_deposer DECIMAL(10,2);
    v_result JSON;
BEGIN
    -- 1. Total collecté
    SELECT COALESCE(SUM(montant_collecte), 0)
    INTO v_total_collecte
    FROM public.tournees
    WHERE user_id = p_user_id
    AND statut = 'completed';

    -- 2. Total CB validés
    SELECT COALESCE(SUM(cp.amount), 0)
    INTO v_total_cb
    FROM public.card_payments cp
    INNER JOIN public.tournees t ON t.id = cp.tournee_id
    WHERE t.user_id = p_user_id
    AND t.statut = 'completed'
    AND cp.status = 'succeeded';

    -- 3. Total cash déposé
    SELECT COALESCE(SUM(montant_recu), 0)
    INTO v_total_depose
    FROM public.demandes_depot_fonds
    WHERE user_id = p_user_id
    AND statut = 'valide';

    -- 4. Cash à déposer
    v_cash_a_deposer := GREATEST(v_total_collecte - v_total_cb - v_total_depose, 0);

    -- Construire le résultat JSON
    v_result := json_build_object(
        'total_collecte', v_total_collecte,
        'total_cb_valide', v_total_cb,
        'total_cash_depose', v_total_depose,
        'cash_a_deposer', v_cash_a_deposer
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_detail_fonds_utilisateur(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_detail_fonds_utilisateur(UUID) IS
'Retourne le détail complet des fonds d''un utilisateur pour affichage UI.
Retourne un JSON avec: total_collecte, total_cb_valide, total_cash_depose, cash_a_deposer';
