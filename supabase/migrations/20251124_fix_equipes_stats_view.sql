-- Migration: Fix Equipes Stats View to Include Card Transactions
-- Description: Mise à jour de equipes_stats_view pour utiliser tournee_summary
-- Même problème que profiles_with_equipe_view: les stats n'incluaient pas les transactions carte

-- Drop et recréation de la vue equipes_stats_view
DROP VIEW IF EXISTS public.equipes_ranking_view CASCADE;
DROP VIEW IF EXISTS public.equipes_stats_view CASCADE;

-- Vue pour les statistiques d'équipes avec progression (VERSION CORRIGÉE)
CREATE OR REPLACE VIEW public.equipes_stats_view AS
SELECT
    e.id as equipe_id,
    e.nom as equipe_nom,
    e.numero as equipe_numero,
    e.type as equipe_type,
    e.secteur,
    e.calendriers_alloues,
    e.couleur,
    e.ordre_affichage,
    e.chef_equipe_id,
    ce.full_name as chef_equipe_nom,

    -- Statistiques calculées depuis tournee_summary (source de vérité)
    COALESCE(SUM(ts.calendars_distributed), 0) as calendriers_distribues,
    COALESCE(SUM(ts.montant_total), 0) as montant_collecte,
    COALESCE(COUNT(DISTINCT t.id), 0) as nombre_tournees,
    COALESCE(COUNT(DISTINCT CASE WHEN t.statut = 'active' THEN t.id END), 0) as tournees_actives,
    COALESCE(COUNT(DISTINCT CASE WHEN t.statut = 'completed' THEN t.id END), 0) as tournees_terminees,

    -- Calculs de progression
    CASE
        WHEN e.calendriers_alloues > 0 THEN
            ROUND((COALESCE(SUM(ts.calendars_distributed), 0)::DECIMAL / e.calendriers_alloues) * 100, 1)
        ELSE 0
    END as progression_pourcentage,

    -- Moyenne par calendrier
    CASE
        WHEN COALESCE(SUM(ts.calendars_distributed), 0) > 0 THEN
            ROUND(COALESCE(SUM(ts.montant_total), 0) / COALESCE(SUM(ts.calendars_distributed), 0), 2)
        ELSE 0
    END as moyenne_par_calendrier,

    -- Nombre de membres dans l'équipe
    COALESCE(membres_count.count, 0) as nombre_membres,

    -- Dernière activité
    MAX(t.date_debut) as derniere_activite

FROM public.equipes e
LEFT JOIN public.profiles p ON p.team_id = e.id
LEFT JOIN public.tournees t ON t.user_id = p.id AND t.statut IN ('active', 'completed')
LEFT JOIN public.tournee_summary ts ON ts.tournee_id = t.id
LEFT JOIN public.profiles ce ON ce.id = e.chef_equipe_id
LEFT JOIN (
    SELECT team_id, COUNT(*) as count
    FROM public.profiles
    WHERE team_id IS NOT NULL
    GROUP BY team_id
) membres_count ON membres_count.team_id = e.id
WHERE e.actif = true
GROUP BY e.id, e.nom, e.numero, e.type, e.secteur, e.calendriers_alloues,
         e.couleur, e.ordre_affichage, e.chef_equipe_id, ce.full_name, membres_count.count
ORDER BY e.ordre_affichage;

-- Recréer la vue de classement qui dépend de equipes_stats_view
CREATE OR REPLACE VIEW public.equipes_ranking_view AS
SELECT
    esv.*,
    ROW_NUMBER() OVER (ORDER BY esv.montant_collecte DESC) as rang_montant,
    ROW_NUMBER() OVER (ORDER BY esv.calendriers_distribues DESC) as rang_calendriers,
    ROW_NUMBER() OVER (ORDER BY esv.progression_pourcentage DESC) as rang_progression
FROM public.equipes_stats_view esv
ORDER BY esv.montant_collecte DESC;

-- Permissions
GRANT SELECT ON public.equipes_stats_view TO authenticated;
GRANT SELECT ON public.equipes_ranking_view TO authenticated;

-- Commentaires
COMMENT ON VIEW public.equipes_stats_view IS 'Vue des statistiques complètes des équipes (utilise tournee_summary pour inclure les transactions carte bleue)';
COMMENT ON VIEW public.equipes_ranking_view IS 'Vue du classement des équipes par performance (basé sur tournee_summary)';
