-- Migration pour corriger la fonction get_global_tournee_stats
-- Elle doit compter les calendriers depuis tournees.calendriers_distribues (tournées complétées)
-- ET depuis support_transactions (tournées actives)

CREATE OR REPLACE FUNCTION get_global_tournee_stats()
RETURNS TABLE (
    total_calendriers_distribues BIGINT,
    total_montant_collecte NUMERIC,
    total_tournees_actives BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_calendriers_completed BIGINT;
    v_montant_completed NUMERIC;
    v_calendriers_actives BIGINT;
    v_montant_actives NUMERIC;
    v_tournees_actives_count BIGINT;
BEGIN
    -- 1. Compter les calendriers des tournées COMPLÉTÉES (source de vérité finale)
    SELECT
        COALESCE(SUM(calendriers_distribues), 0),
        COALESCE(SUM(montant_collecte), 0)
    INTO v_calendriers_completed, v_montant_completed
    FROM public.tournees
    WHERE statut = 'completed';

    -- 2. Compter les calendriers des tournées ACTIVES via support_transactions
    -- (car elles n'ont pas encore de valeur finale dans calendriers_distribues)
    SELECT
        COALESCE(COUNT(*) FILTER (WHERE st.calendar_accepted = true), 0),
        COALESCE(SUM(st.amount), 0)
    INTO v_calendriers_actives, v_montant_actives
    FROM public.tournees t
    LEFT JOIN public.support_transactions st ON st.tournee_id = t.id AND st.payment_status = 'completed'
    WHERE t.statut = 'active';

    -- 3. Compter le nombre de tournées actives
    SELECT COUNT(*)
    INTO v_tournees_actives_count
    FROM public.tournees
    WHERE statut = 'active';

    -- 4. Retourner les totaux
    RETURN QUERY
    SELECT
        (v_calendriers_completed + v_calendriers_actives)::BIGINT as total_calendriers_distribues,
        (v_montant_completed + v_montant_actives)::NUMERIC as total_montant_collecte,
        v_tournees_actives_count::BIGINT as total_tournees_actives;
END;
$$;

-- Commentaire sur la fonction
COMMENT ON FUNCTION get_global_tournee_stats() IS 'Retourne les statistiques globales de toutes les tournées : total calendriers distribués (complétées + actives), total montant collecté, et nombre de tournées actives';

-- S'assurer que les permissions sont correctes
GRANT EXECUTE ON FUNCTION get_global_tournee_stats() TO authenticated;
