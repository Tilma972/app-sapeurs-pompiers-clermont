-- Migration: Vues et fonctions pour exploiter la table equipes
-- Description: Création des vues et fonctions pour alimenter les interfaces avec les données des équipes

-- Vue pour les statistiques d'équipes avec progression
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
    
    -- Statistiques calculées
    COALESCE(SUM(t.calendriers_distribues), 0) as calendriers_distribues,
    COALESCE(SUM(t.montant_collecte), 0) as montant_collecte,
    COALESCE(COUNT(t.id), 0) as nombre_tournees,
    COALESCE(COUNT(CASE WHEN t.statut = 'active' THEN 1 END), 0) as tournees_actives,
    COALESCE(COUNT(CASE WHEN t.statut = 'completed' THEN 1 END), 0) as tournees_terminees,
    
    -- Calculs de progression
    CASE 
        WHEN e.calendriers_alloues > 0 THEN 
            ROUND((COALESCE(SUM(t.calendriers_distribues), 0)::DECIMAL / e.calendriers_alloues) * 100, 1)
        ELSE 0 
    END as progression_pourcentage,
    
    -- Moyenne par calendrier
    CASE 
        WHEN COALESCE(SUM(t.calendriers_distribues), 0) > 0 THEN 
            ROUND(COALESCE(SUM(t.montant_collecte), 0) / COALESCE(SUM(t.calendriers_distribues), 0), 2)
        ELSE 0 
    END as moyenne_par_calendrier,
    
    -- Nombre de membres dans l'équipe
    COALESCE(membres_count.count, 0) as nombre_membres,
    
    -- Dernière activité
    MAX(t.date_debut) as derniere_activite

FROM public.equipes e
LEFT JOIN public.profiles p ON p.team_id = e.id
LEFT JOIN public.tournees t ON t.user_id = p.id
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

-- Vue pour les profils avec informations d'équipe
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
    
    -- Statistiques personnelles
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
        SUM(calendriers_distribues) as calendriers_distribues,
        SUM(montant_collecte) as montant_collecte,
        COUNT(*) as nombre_tournees,
        CASE 
            WHEN SUM(calendriers_distribues) > 0 THEN 
                ROUND(SUM(montant_collecte) / SUM(calendriers_distribues), 2)
            ELSE 0 
        END as moyenne_par_calendrier
    FROM public.tournees 
    WHERE statut = 'completed'
    GROUP BY user_id
) stats ON stats.user_id = p.id;

-- Vue pour le classement des équipes
CREATE OR REPLACE VIEW public.equipes_ranking_view AS
SELECT 
    esv.*,
    ROW_NUMBER() OVER (ORDER BY esv.montant_collecte DESC) as rang_montant,
    ROW_NUMBER() OVER (ORDER BY esv.calendriers_distribues DESC) as rang_calendriers,
    ROW_NUMBER() OVER (ORDER BY esv.progression_pourcentage DESC) as rang_progression
FROM public.equipes_stats_view esv
ORDER BY esv.montant_collecte DESC;

-- Fonction pour récupérer les statistiques d'une équipe spécifique
CREATE OR REPLACE FUNCTION get_equipe_stats(equipe_id_param UUID)
RETURNS TABLE (
    equipe_id UUID,
    equipe_nom TEXT,
    equipe_numero INTEGER,
    secteur TEXT,
    calendriers_alloues INTEGER,
    calendriers_distribues BIGINT,
    montant_collecte NUMERIC,
    progression_pourcentage NUMERIC,
    moyenne_par_calendrier NUMERIC,
    nombre_membres BIGINT,
    tournees_actives BIGINT,
    couleur TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        esv.equipe_id,
        esv.equipe_nom,
        esv.equipe_numero,
        esv.secteur,
        esv.calendriers_alloues,
        esv.calendriers_distribues,
        esv.montant_collecte,
        esv.progression_pourcentage,
        esv.moyenne_par_calendrier,
        esv.nombre_membres,
        esv.tournees_actives,
        esv.couleur
    FROM public.equipes_stats_view esv
    WHERE esv.equipe_id = equipe_id_param;
END;
$$;

-- Fonction pour récupérer le classement des équipes
CREATE OR REPLACE FUNCTION get_equipes_ranking()
RETURNS TABLE (
    rang INTEGER,
    equipe_nom TEXT,
    equipe_numero INTEGER,
    secteur TEXT,
    montant_collecte NUMERIC,
    calendriers_distribues BIGINT,
    progression_pourcentage NUMERIC,
    couleur TEXT,
    nombre_membres BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        erv.rang_montant::INTEGER as rang,
        erv.equipe_nom,
        erv.equipe_numero,
        erv.secteur,
        erv.montant_collecte,
        erv.calendriers_distribues,
        erv.progression_pourcentage,
        erv.couleur,
        erv.nombre_membres
    FROM public.equipes_ranking_view erv
    ORDER BY erv.rang_montant;
END;
$$;

-- Fonction pour récupérer les membres d'une équipe
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

-- Fonction pour récupérer les statistiques globales par équipe (pour les graphiques)
CREATE OR REPLACE FUNCTION get_equipes_summary_for_charts()
RETURNS TABLE (
    team TEXT,
    totalAmountCollected NUMERIC,
    totalCalendarsDistributed BIGINT,
    progression_pourcentage NUMERIC,
    couleur TEXT,
    secteur TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        esv.equipe_nom as team,
        esv.montant_collecte as totalAmountCollected,
        esv.calendriers_distribues as totalCalendarsDistributed,
        esv.progression_pourcentage,
        esv.couleur,
        esv.secteur
    FROM public.equipes_stats_view esv
    ORDER BY esv.ordre_affichage;
END;
$$;

-- Permissions pour les vues et fonctions
GRANT SELECT ON public.equipes_stats_view TO authenticated;
GRANT SELECT ON public.profiles_with_equipe_view TO authenticated;
GRANT SELECT ON public.equipes_ranking_view TO authenticated;
GRANT EXECUTE ON FUNCTION get_equipe_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_equipes_ranking() TO authenticated;
GRANT EXECUTE ON FUNCTION get_equipe_membres(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_equipes_summary_for_charts() TO authenticated;

-- Commentaires pour la documentation
COMMENT ON VIEW public.equipes_stats_view IS 'Vue des statistiques complètes des équipes avec progression';
COMMENT ON VIEW public.profiles_with_equipe_view IS 'Vue des profils avec informations d''équipe et statistiques personnelles';
COMMENT ON VIEW public.equipes_ranking_view IS 'Vue du classement des équipes par performance';
COMMENT ON FUNCTION get_equipe_stats(UUID) IS 'Récupère les statistiques d''une équipe spécifique';
COMMENT ON FUNCTION get_equipes_ranking() IS 'Récupère le classement des équipes par montant collecté';
COMMENT ON FUNCTION get_equipe_membres(UUID) IS 'Récupère la liste des membres d''une équipe avec leurs statistiques';
COMMENT ON FUNCTION get_equipes_summary_for_charts() IS 'Récupère le résumé des équipes pour les graphiques (compatible avec l''interface existante)';



