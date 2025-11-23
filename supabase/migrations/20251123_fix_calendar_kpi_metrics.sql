-- Migration: Fix Calendar KPI Metrics
-- Description: Mise à jour de la vue profiles_with_equipe_view pour inclure les tournées actives
-- Les KPI de la page calendrier doivent refléter l'activité complète (tournées actives + complétées)
--
-- PROBLÈME IDENTIFIÉ:
-- - Les tournées complétées manuellement (avec valeurs globales) n'ont pas de transactions individuelles
-- - La vue actuelle utilise uniquement tournee_summary (basé sur support_transactions)
-- - Les statistiques ignorent donc les tournées clôturées manuellement
--
-- SOLUTION:
-- - Tournées complétées: utiliser calendriers_distribues et montant_collecte de la table tournees
-- - Tournées actives: utiliser les transactions en temps réel via tournee_summary

-- Drop et recréation de la vue profiles_with_equipe_view
DROP VIEW IF EXISTS public.profiles_with_equipe_view CASCADE;

-- Vue pour les profils avec informations d'équipe (version corrigée)
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

    -- Statistiques personnelles (TOUTES les tournées: actives + complétées)
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
        -- Somme des calendriers: tournées complétées (valeur finale) + tournées actives (transactions)
        SUM(calendriers_distribues) as calendriers_distribues,
        SUM(montant_collecte) as montant_collecte,
        COUNT(*) as nombre_tournees,
        CASE
            WHEN SUM(calendriers_distribues) > 0 THEN
                ROUND(SUM(montant_collecte) / SUM(calendriers_distribues), 2)
            ELSE 0
        END as moyenne_par_calendrier
    FROM (
        -- Tournées COMPLÉTÉES: utiliser les valeurs finales de la table tournees
        SELECT
            t.user_id,
            COALESCE(t.calendriers_distribues, 0) as calendriers_distribues,
            COALESCE(t.montant_collecte, 0) as montant_collecte
        FROM public.tournees t
        WHERE t.statut = 'completed'

        UNION ALL

        -- Tournées ACTIVES: utiliser les transactions en temps réel
        SELECT
            t.user_id,
            COALESCE(ts.calendars_distributed, 0) as calendriers_distribues,
            COALESCE(ts.montant_total, 0) as montant_collecte
        FROM public.tournees t
        LEFT JOIN public.tournee_summary ts ON ts.tournee_id = t.id
        WHERE t.statut = 'active'
    ) combined_stats
    GROUP BY user_id
) stats ON stats.user_id = p.id;

-- Permissions
GRANT SELECT ON public.profiles_with_equipe_view TO authenticated;

-- Commentaire
COMMENT ON VIEW public.profiles_with_equipe_view IS 'Vue des profils avec informations d''équipe et statistiques personnelles (tournées complétées depuis table tournees + tournées actives depuis transactions)';
