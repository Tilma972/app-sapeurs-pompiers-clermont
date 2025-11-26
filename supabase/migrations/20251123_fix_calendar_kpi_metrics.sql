-- Migration: Fix Calendar KPI Metrics
-- Description: Mise à jour de la vue profiles_with_equipe_view pour utiliser uniquement la table tournees
-- Les KPI de la page calendrier reflètent l'activité après clôture (seules les tournées complétées comptent)
--
-- SOLUTION SIMPLIFIÉE:
-- - Le modal de clôture additionne déjà carte bleue + espèces + chèques
-- - Ces totaux complets sont enregistrés dans tournees.calendriers_distribues et montant_collecte
-- - Les tournées actives affichent 0 jusqu'à leur clôture (suffisant pour les besoins)
-- - Une seule source de vérité: la table tournees

-- Drop et recréation de la vue profiles_with_equipe_view
DROP VIEW IF EXISTS public.profiles_with_equipe_view CASCADE;

-- Vue pour les profils avec informations d'équipe (version simplifiée)
CREATE OR REPLACE VIEW public.profiles_with_equipe_view AS
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
COMMENT ON VIEW public.profiles_with_equipe_view IS 'Vue des profils avec informations d''équipe et statistiques personnelles (source unique: table tournees avec totaux complets après clôture)';
