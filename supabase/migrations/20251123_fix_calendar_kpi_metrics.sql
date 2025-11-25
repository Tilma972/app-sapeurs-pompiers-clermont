-- Migration: Fix Calendar KPI Metrics
-- Description: Mise à jour de la vue profiles_with_equipe_view pour inclure les tournées actives
-- Les KPI de la page calendrier doivent refléter l'activité complète (tournées actives + complétées)
--
-- PROBLÈME IDENTIFIÉ:
-- - La vue actuelle ne comptait que les tournées avec statut='completed'
-- - Les champs calendriers_distribues et montant_collecte dans la table tournees
--   peuvent être incorrects (ex: clôture manuelle avec 0 alors que des transactions existent)
-- - Les statistiques ignoraient donc les tournées actives ET les vraies transactions
--
-- SOLUTION:
-- - Utiliser UNIQUEMENT tournee_summary comme source de vérité
-- - Cette vue agrège les vraies transactions de support_transactions
-- - Fonctionne pour TOUTES les tournées (actives ET complétées)

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
    -- Source de vérité unique: tournee_summary qui agrège les vraies transactions
    -- Fonctionne pour TOUTES les tournées (actives ET complétées)
    SELECT
        t.user_id,
        SUM(COALESCE(ts.calendars_distributed, 0)) as calendriers_distribues,
        SUM(COALESCE(ts.montant_total, 0)) as montant_collecte,
        COUNT(DISTINCT t.id) as nombre_tournees,
        CASE
            WHEN SUM(COALESCE(ts.calendars_distributed, 0)) > 0 THEN
                ROUND(SUM(COALESCE(ts.montant_total, 0)) / SUM(COALESCE(ts.calendars_distributed, 0)), 2)
            ELSE 0
        END as moyenne_par_calendrier
    FROM public.tournees t
    LEFT JOIN public.tournee_summary ts ON ts.tournee_id = t.id
    -- Inclure TOUTES les tournées (actives ET complétées)
    WHERE t.statut IN ('active', 'completed')
    GROUP BY t.user_id
) stats ON stats.user_id = p.id;

-- Permissions
GRANT SELECT ON public.profiles_with_equipe_view TO authenticated;

-- Commentaire
COMMENT ON VIEW public.profiles_with_equipe_view IS 'Vue des profils avec informations d''équipe et statistiques personnelles (source unique: tournee_summary pour toutes les tournées)';
