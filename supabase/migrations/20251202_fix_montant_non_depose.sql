-- ============================================
-- Migration: Fix get_montant_non_depose to include active and completed tournees
-- Date: 2025-12-02
-- Description: Counts tournées with status 'active' or 'completed' (excludes cancelled)
-- ============================================

CREATE OR REPLACE FUNCTION public.get_montant_non_depose(p_user_id UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    v_total_collecte DECIMAL(10,2);
    v_total_depose DECIMAL(10,2);
BEGIN
    -- Total collecté dans toutes les tournées actives ou complétées
    SELECT COALESCE(SUM(montant_collecte), 0)
    INTO v_total_collecte
    FROM public.tournees
    WHERE user_id = p_user_id
    AND statut IN ('active', 'completed');  -- Inclut active ET completed

    -- Total déjà déposé (demandes validées)
    SELECT COALESCE(SUM(montant_recu), 0)
    INTO v_total_depose
    FROM public.demandes_depot_fonds
    WHERE user_id = p_user_id
    AND statut = 'valide';

    -- Retourner la différence
    RETURN GREATEST(v_total_collecte - v_total_depose, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_montant_non_depose(UUID) TO authenticated;
