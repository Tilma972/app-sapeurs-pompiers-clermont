-- Migration pour créer la fonction get_global_tournee_stats
-- Cette fonction retourne les statistiques globales de toutes les tournées

-- Créer la fonction get_global_tournee_stats
CREATE OR REPLACE FUNCTION get_global_tournee_stats()
RETURNS TABLE (
    total_calendriers_distribues BIGINT,
    total_montant_collecte NUMERIC,
    total_tournees_actives BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(calendriers_distribues), 0) as total_calendriers_distribues,
        COALESCE(SUM(montant_collecte), 0) as total_montant_collecte,
        COUNT(CASE WHEN statut = 'active' THEN 1 END) as total_tournees_actives
    FROM public.tournees;
END;
$$;

-- Commentaire sur la fonction
COMMENT ON FUNCTION get_global_tournee_stats() IS 'Retourne les statistiques globales de toutes les tournées : total calendriers distribués, total montant collecté, et nombre de tournées actives';

-- Donner les permissions d'exécution à tous les utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION get_global_tournee_stats() TO authenticated;

-- Optionnel : Créer un index pour optimiser les requêtes sur le statut
CREATE INDEX IF NOT EXISTS idx_tournees_statut ON public.tournees(statut);

-- Optionnel : Créer un index pour optimiser les requêtes sur les colonnes agrégées
CREATE INDEX IF NOT EXISTS idx_tournees_calendriers_distribues ON public.tournees(calendriers_distribues) WHERE calendriers_distribues IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tournees_montant_collecte ON public.tournees(montant_collecte) WHERE montant_collecte IS NOT NULL;

