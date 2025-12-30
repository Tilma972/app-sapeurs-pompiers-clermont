-- Migration: Fix Security Definer View
-- Description: Recréer la vue profiles_with_equipe_view avec SECURITY INVOKER
--              pour corriger la faille de sécurité détectée par Supabase
--
-- Problème: La vue était définie avec SECURITY DEFINER, ce qui permettait aux
--           utilisateurs de contourner les politiques RLS en utilisant les
--           privilèges du propriétaire de la vue au lieu de leurs propres droits
--
-- Solution: Recréer la vue avec SECURITY INVOKER pour que les permissions et
--           RLS soient évaluées avec les droits de l'utilisateur qui exécute
--           la requête

-- Drop et recréation de la vue avec SECURITY INVOKER
DROP VIEW IF EXISTS public.profiles_with_equipe_view CASCADE;

-- Vue pour les profils avec informations d'équipe (version sécurisée)
CREATE OR REPLACE VIEW public.profiles_with_equipe_view
WITH (security_invoker = true)
AS
SELECT
    p.id,
    p.full_name,
    p.role,
    p.created_at,
    p.updated_at,

    -- Informations d'équipe
    e.id as equipe_id,
    e.nom as equipe_nom,
    e.numero as equipe_numero,
    e.type as equipe_type,
    e.secteur,
    e.calendriers_alloues,
    e.couleur as equipe_couleur,
    e.ordre_affichage as equipe_ordre,
    e.chef_equipe_id,
    ce.full_name as chef_equipe_nom,

    -- Statistiques personnelles (depuis la table tournees uniquement)
    COALESCE(stats.calendriers_distribues, 0) as calendriers_distribues,
    COALESCE(stats.montant_collecte, 0) as montant_collecte,
    COALESCE(stats.nombre_tournees, 0) as nombre_tournees,
    COALESCE(stats.moyenne_par_calendrier, 0) as moyenne_par_calendrier

FROM public.profiles p
LEFT JOIN public.equipes e ON e.id = p.team_id
LEFT JOIN public.profiles ce ON ce.id = e.chef_equipe_id
LEFT JOIN (
    SELECT
        user_id,
        SUM(COALESCE(calendriers_distribues, 0)) as calendriers_distribues,
        SUM(COALESCE(montant_collecte, 0)) as montant_collecte,
        COUNT(*) as nombre_tournees,
        CASE
            WHEN SUM(COALESCE(calendriers_distribues, 0)) > 0 THEN
                ROUND(SUM(COALESCE(montant_collecte, 0)) / SUM(COALESCE(calendriers_distribues, 0)), 2)
            ELSE 0
        END as moyenne_par_calendrier
    FROM public.tournees
    GROUP BY user_id
) stats ON stats.user_id = p.id;

-- Permissions
GRANT SELECT ON public.profiles_with_equipe_view TO authenticated;

-- Commentaire
COMMENT ON VIEW public.profiles_with_equipe_view IS 'Vue des profils avec informations d''équipe et statistiques personnelles (source unique: table tournees avec totaux complets après clôture). SECURITY INVOKER pour respecter les politiques RLS.';

-- Recréer les fonctions qui dépendaient de la vue (elles utilisaient CASCADE dans le DROP)
-- Ces fonctions gardent SECURITY DEFINER car elles sont nécessaires pour des opérations
-- spécifiques où on veut garantir un comportement cohérent

CREATE OR REPLACE FUNCTION get_equipe_membres(equipe_id_param UUID)
RETURNS TABLE (
    membre_id UUID,
    membre_nom TEXT,
    membre_role TEXT,
    calendriers_distribues BIGINT,
    montant_collecte NUMERIC,
    moyenne_par_calendrier NUMERIC,
    nombre_tournees BIGINT,
    derniere_tournee TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        pwev.id as membre_id,
        pwev.full_name as membre_nom,
        pwev.role as membre_role,
        pwev.calendriers_distribues,
        pwev.montant_collecte,
        pwev.moyenne_par_calendrier,
        pwev.nombre_tournees,
        MAX(t.date_debut) as derniere_tournee
    FROM public.profiles_with_equipe_view pwev
    LEFT JOIN public.tournees t ON t.user_id = pwev.id
    WHERE pwev.equipe_id = equipe_id_param
    GROUP BY pwev.id, pwev.full_name, pwev.role, pwev.calendriers_distribues,
             pwev.montant_collecte, pwev.moyenne_par_calendrier, pwev.nombre_tournees
    ORDER BY pwev.montant_collecte DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_equipe_membres(UUID) TO authenticated;
COMMENT ON FUNCTION get_equipe_membres(UUID) IS 'Récupère la liste des membres d''une équipe avec leurs statistiques';
