-- Migration: Fix Equipes Stats View - Version Simplifiée
-- Description: Mise à jour de equipes_stats_view pour utiliser uniquement la table tournees
-- Les statistiques d'équipe reflètent l'activité après clôture (seules les tournées complétées comptent)
--
-- SOLUTION SIMPLIFIÉE:
-- - Le modal de clôture additionne déjà carte bleue + espèces + chèques
-- - Ces totaux complets sont enregistrés dans tournees.calendriers_distribues et montant_collecte
-- - Les tournées actives affichent 0 jusqu'à leur clôture (suffisant pour les besoins)
-- - Une seule source de vérité: la table tournees

-- Drop et recréation de la vue equipes_stats_view
DROP VIEW IF EXISTS public.equipes_ranking_view CASCADE;
DROP VIEW IF EXISTS public.equipes_stats_view CASCADE;

-- Vue pour les statistiques d'équipes avec progression (VERSION SIMPLIFIÉE)
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

    -- Statistiques calculées (depuis la table tournees uniquement)
    COALESCE(stats.calendriers_distribues, 0) as calendriers_distribues,
    COALESCE(stats.montant_collecte, 0) as montant_collecte,
    COALESCE(stats.nombre_tournees, 0) as nombre_tournees,
    COALESCE(stats.tournees_actives, 0) as tournees_actives,
    COALESCE(stats.tournees_terminees, 0) as tournees_terminees,

    -- Calculs de progression
    CASE
        WHEN e.calendriers_alloues > 0 THEN
            ROUND((COALESCE(stats.calendriers_distribues, 0)::DECIMAL / e.calendriers_alloues) * 100, 1)
        ELSE 0
    END as progression_pourcentage,

    -- Moyenne par calendrier
    CASE
        WHEN COALESCE(stats.calendriers_distribues, 0) > 0 THEN
            ROUND(COALESCE(stats.montant_collecte, 0) / COALESCE(stats.calendriers_distribues, 0), 2)
        ELSE 0
    END as moyenne_par_calendrier,

    -- Nombre de membres dans l'équipe
    COALESCE(membres_count.count, 0) as nombre_membres,

    -- Dernière activité
    stats.derniere_activite

FROM public.equipes e
LEFT JOIN (
    SELECT
        p.team_id,
        SUM(COALESCE(t.calendriers_distribues, 0)) as calendriers_distribues,
        SUM(COALESCE(t.montant_collecte, 0)) as montant_collecte,
        COUNT(DISTINCT t.id) as nombre_tournees,
        COUNT(DISTINCT CASE WHEN t.statut = 'active' THEN t.id END) as tournees_actives,
        COUNT(DISTINCT CASE WHEN t.statut = 'completed' THEN t.id END) as tournees_terminees,
        MAX(t.date_debut) as derniere_activite
    FROM public.profiles p
    INNER JOIN public.tournees t ON t.user_id = p.id
    WHERE p.team_id IS NOT NULL
    GROUP BY p.team_id
) stats ON stats.team_id = e.id
LEFT JOIN public.profiles ce ON ce.id = e.chef_equipe_id
LEFT JOIN (
    SELECT team_id, COUNT(*) as count
    FROM public.profiles
    WHERE team_id IS NOT NULL
    GROUP BY team_id
) membres_count ON membres_count.team_id = e.id
WHERE e.actif = true
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
COMMENT ON VIEW public.equipes_stats_view IS 'Vue des statistiques complètes des équipes (source unique: table tournees avec totaux complets après clôture)';
COMMENT ON VIEW public.equipes_ranking_view IS 'Vue du classement des équipes par performance (source unique: table tournees)';
