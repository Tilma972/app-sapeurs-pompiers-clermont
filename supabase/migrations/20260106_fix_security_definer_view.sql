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

-- Fix autres vues avec SECURITY DEFINER

-- 1. membres_calendriers_suivi
DROP VIEW IF EXISTS public.membres_calendriers_suivi CASCADE;
CREATE OR REPLACE VIEW public.membres_calendriers_suivi
WITH (security_invoker = true)
AS
SELECT 
    p.id AS user_id,
    p.full_name,
    p.display_name,
    p.team_id,
    e.nom AS equipe_nom,
    p.calendriers_lot_attribue,
    p.calendriers_reception_confirmee,
    p.calendriers_confirmation_date,
    COALESCE(sum(t.calendriers_distribues), 0::bigint) AS calendriers_distribues,
    count(t.id) FILTER (WHERE t.statut = 'completed'::text) AS nb_tournees_completees,
    CASE
        WHEN p.calendriers_reception_confirmee THEN p.calendriers_lot_attribue - COALESCE(sum(t.calendriers_distribues), 0::bigint)
        ELSE 0::bigint
    END AS stock_en_main
FROM profiles p
LEFT JOIN equipes e ON e.id = p.team_id
LEFT JOIN tournees t ON t.user_id = p.id AND t.statut = 'completed'::text
WHERE p.role = ANY (ARRAY['membre'::text, 'chef_equipe'::text])
GROUP BY p.id, p.full_name, p.display_name, p.team_id, e.nom, e.ordre_affichage, p.calendriers_lot_attribue, p.calendriers_reception_confirmee, p.calendriers_confirmation_date
ORDER BY e.ordre_affichage, p.full_name;

GRANT SELECT ON public.membres_calendriers_suivi TO authenticated;

-- 2. zones_tournees_enrichies
DROP VIEW IF EXISTS public.zones_tournees_enrichies CASCADE;
CREATE OR REPLACE VIEW public.zones_tournees_enrichies
WITH (security_invoker = true)
AS
SELECT 
    zt.id,
    zt.equipe_id,
    zt.pompier_id,
    zt.code_zone,
    zt.nom_zone,
    zt.description,
    zt.geom,
    zt.population_estimee,
    zt.nb_foyers_estimes,
    zt.annee,
    zt.nb_calendriers_alloues,
    zt.nb_calendriers_distribues,
    zt.statut,
    zt.date_debut_tournee,
    zt.date_fin_tournee,
    zt.notes,
    zt.created_at,
    zt.updated_at,
    e.nom AS equipe_nom,
    e.numero AS equipe_numero,
    e.couleur AS equipe_couleur,
    e.secteur AS equipe_secteur,
    p.full_name AS pompier_nom,
    p.email AS pompier_email,
    p.phone AS pompier_telephone,
    CASE
        WHEN zt.nb_calendriers_alloues > 0 THEN round(zt.nb_calendriers_distribues::numeric / zt.nb_calendriers_alloues::numeric * 100::numeric, 2)
        ELSE 0::numeric
    END AS progression_pct,
    COALESCE(zt.nb_calendriers_alloues, 0) - COALESCE(zt.nb_calendriers_distribues, 0) AS nb_calendriers_restants
FROM zones_tournees zt
LEFT JOIN equipes e ON zt.equipe_id = e.id
LEFT JOIN profiles p ON zt.pompier_id = p.id;

GRANT SELECT ON public.zones_tournees_enrichies TO authenticated;

-- 3. tournee_summary
DROP VIEW IF EXISTS public.tournee_summary CASCADE;
CREATE OR REPLACE VIEW public.tournee_summary
WITH (security_invoker = true)
AS
SELECT 
    t.id AS tournee_id,
    t.user_id,
    count(st.id) AS total_transactions,
    count(st.id) FILTER (WHERE st.transaction_type::text = 'don_fiscal'::text) AS dons_count,
    COALESCE(sum(st.amount) FILTER (WHERE st.transaction_type::text = 'don_fiscal'::text), 0::numeric) AS dons_amount,
    COALESCE(sum(st.tax_reduction) FILTER (WHERE st.transaction_type::text = 'don_fiscal'::text), 0::numeric) AS total_deductions,
    count(st.id) FILTER (WHERE st.transaction_type::text = 'soutien'::text) AS soutiens_count,
    COALESCE(sum(st.amount) FILTER (WHERE st.transaction_type::text = 'soutien'::text), 0::numeric) AS soutiens_amount,
    CASE
        WHEN count(st.id) > 0 THEN count(st.id) FILTER (WHERE st.calendar_accepted = true)
        ELSE COALESCE(t.calendriers_distribues, 0)::bigint
    END AS calendars_distributed,
    CASE
        WHEN count(st.id) > 0 THEN COALESCE(sum(st.amount), 0::numeric)
        ELSE COALESCE(t.montant_collecte, 0::numeric)
    END AS montant_total,
    COALESCE(sum(st.amount) FILTER (WHERE st.payment_method = 'especes'::payment_method_enum), 0::numeric) AS especes_total,
    COALESCE(sum(st.amount) FILTER (WHERE st.payment_method = 'cheque'::payment_method_enum), 0::numeric) AS cheques_total,
    COALESCE(sum(st.amount) FILTER (WHERE st.payment_method = 'carte'::payment_method_enum), 0::numeric) AS cartes_total
FROM tournees t
LEFT JOIN support_transactions st ON st.tournee_id = t.id
GROUP BY t.id, t.user_id, t.calendriers_distribues, t.montant_collecte;

GRANT SELECT ON public.tournee_summary TO authenticated;

-- 4. equipes_stats_view
DROP VIEW IF EXISTS public.equipes_stats_view CASCADE;
CREATE OR REPLACE VIEW public.equipes_stats_view
WITH (security_invoker = true)
AS
SELECT 
    e.id AS equipe_id,
    e.nom AS equipe_nom,
    e.numero AS equipe_numero,
    e.type AS equipe_type,
    e.secteur,
    e.calendriers_alloues,
    e.couleur,
    e.ordre_affichage,
    e.chef_equipe_id,
    ce.full_name AS chef_equipe_nom,
    COALESCE(stats.calendriers_distribues, 0::bigint) AS calendriers_distribues,
    COALESCE(stats.montant_collecte, 0::numeric) AS montant_collecte,
    COALESCE(stats.nombre_tournees, 0::bigint) AS nombre_tournees,
    COALESCE(stats.tournees_actives, 0::bigint) AS tournees_actives,
    COALESCE(stats.tournees_terminees, 0::bigint) AS tournees_terminees,
    CASE
        WHEN e.calendriers_alloues > 0 THEN round(COALESCE(stats.calendriers_distribues, 0::bigint)::numeric / e.calendriers_alloues::numeric * 100::numeric, 1)
        ELSE 0::numeric
    END AS progression_pourcentage,
    CASE
        WHEN COALESCE(stats.calendriers_distribues, 0::bigint) > 0 THEN round(COALESCE(stats.montant_collecte, 0::numeric) / COALESCE(stats.calendriers_distribues, 0::bigint)::numeric, 2)
        ELSE 0::numeric
    END AS moyenne_par_calendrier,
    COALESCE(membres_count.count, 0::bigint) AS nombre_membres,
    stats.derniere_activite
FROM equipes e
LEFT JOIN (
    SELECT 
        p.team_id,
        sum(COALESCE(t.calendriers_distribues, 0)) AS calendriers_distribues,
        sum(COALESCE(t.montant_collecte, 0::numeric)) AS montant_collecte,
        count(DISTINCT t.id) AS nombre_tournees,
        count(DISTINCT CASE WHEN t.statut = 'active'::text THEN t.id ELSE NULL::uuid END) AS tournees_actives,
        count(DISTINCT CASE WHEN t.statut = 'completed'::text THEN t.id ELSE NULL::uuid END) AS tournees_terminees,
        max(t.date_debut) AS derniere_activite
    FROM profiles p
    JOIN tournees t ON t.user_id = p.id
    WHERE p.team_id IS NOT NULL
    GROUP BY p.team_id
) stats ON stats.team_id = e.id
LEFT JOIN profiles ce ON ce.id = e.chef_equipe_id
LEFT JOIN (
    SELECT 
        profiles.team_id,
        count(*) AS count
    FROM profiles
    WHERE profiles.team_id IS NOT NULL
    GROUP BY profiles.team_id
) membres_count ON membres_count.team_id = e.id
WHERE e.actif = true
ORDER BY e.ordre_affichage;

GRANT SELECT ON public.equipes_stats_view TO authenticated;

-- 5. equipes_ranking_view
DROP VIEW IF EXISTS public.equipes_ranking_view CASCADE;
CREATE OR REPLACE VIEW public.equipes_ranking_view
WITH (security_invoker = true)
AS
SELECT 
    equipe_id,
    equipe_nom,
    equipe_numero,
    equipe_type,
    secteur,
    calendriers_alloues,
    couleur,
    ordre_affichage,
    chef_equipe_id,
    chef_equipe_nom,
    calendriers_distribues,
    montant_collecte,
    nombre_tournees,
    tournees_actives,
    tournees_terminees,
    progression_pourcentage,
    moyenne_par_calendrier,
    nombre_membres,
    derniere_activite,
    row_number() OVER (ORDER BY montant_collecte DESC) AS rang_montant,
    row_number() OVER (ORDER BY calendriers_distribues DESC) AS rang_calendriers,
    row_number() OVER (ORDER BY progression_pourcentage DESC) AS rang_progression
FROM equipes_stats_view esv
ORDER BY montant_collecte DESC;

GRANT SELECT ON public.equipes_ranking_view TO authenticated;

-- 6. profiles_with_identity
DROP VIEW IF EXISTS public.profiles_with_identity CASCADE;
CREATE OR REPLACE VIEW public.profiles_with_identity
WITH (security_invoker = true)
AS
SELECT 
    id,
    full_name,
    display_name,
    first_name,
    last_name,
    role,
    team_id,
    is_active,
    created_at,
    updated_at,
    COALESCE(display_name, full_name, NULLIF(TRIM(BOTH FROM concat(first_name, ' ', last_name)), ''::text)) AS computed_display_name,
    CASE
        WHEN first_name IS NOT NULL AND last_name IS NOT NULL THEN concat(first_name, ' ', last_name)
        ELSE NULL::text
    END AS legal_name,
    identity_verified,
    verification_date,
    verification_method
FROM profiles p;

GRANT SELECT ON public.profiles_with_identity TO authenticated;

-- 7. boutique_orders
DROP VIEW IF EXISTS public.boutique_orders CASCADE;
CREATE OR REPLACE VIEW public.boutique_orders
WITH (security_invoker = true)
AS
SELECT 
    id,
    created_at,
    amount,
    supporter_name,
    supporter_email,
    stripe_session_id,
    order_status,
    notes,
    COALESCE((SELECT count(*) AS count FROM order_items oi WHERE oi.transaction_id = st.id), 0::bigint) AS items_count,
    COALESCE((SELECT jsonb_agg(jsonb_build_object('id', oi.id, 'name', oi.name, 'quantity', oi.quantity, 'unit_price', oi.unit_price, 'total_price', oi.total_price, 'image_url', oi.image_url)) AS jsonb_agg FROM order_items oi WHERE oi.transaction_id = st.id), '[]'::jsonb) AS items,
    (SELECT osh.created_at FROM order_status_history osh WHERE osh.transaction_id = st.id ORDER BY osh.created_at DESC LIMIT 1) AS last_status_change
FROM support_transactions st
WHERE source = 'boutique'::text
ORDER BY created_at DESC;

GRANT SELECT ON public.boutique_orders TO authenticated;

-- 8. equipe_calendriers_suivi
DROP VIEW IF EXISTS public.equipe_calendriers_suivi CASCADE;
CREATE OR REPLACE VIEW public.equipe_calendriers_suivi
WITH (security_invoker = true)
AS
SELECT 
    e.id AS equipe_id,
    e.nom AS equipe_nom,
    e.numero AS equipe_numero,
    e.couleur AS equipe_couleur,
    e.calendriers_remis_par_admin,
    count(p.id) FILTER (WHERE p.role = ANY (ARRAY['membre'::text, 'chef_equipe'::text])) AS nb_membres_total,
    count(p.id) FILTER (WHERE p.calendriers_reception_confirmee = true) AS nb_membres_confirmes,
    COALESCE(sum(p.calendriers_lot_attribue), 0::bigint) AS total_theorique_membres,
    COALESCE(sum(CASE WHEN p.calendriers_reception_confirmee THEN p.calendriers_lot_attribue ELSE 0 END), 0::bigint) AS total_confirmes_membres,
    e.calendriers_remis_par_admin - COALESCE(sum(CASE WHEN p.calendriers_reception_confirmee THEN p.calendriers_lot_attribue ELSE 0 END), 0::bigint) AS ecart,
    COALESCE(sum(t.calendriers_distribues), 0::bigint) AS calendriers_distribues_total,
    COALESCE(sum(CASE WHEN p.calendriers_reception_confirmee THEN p.calendriers_lot_attribue ELSE 0 END), 0::bigint) - COALESCE(sum(t.calendriers_distribues), 0::bigint) AS stock_dormant
FROM equipes e
LEFT JOIN profiles p ON p.team_id = e.id AND (p.role = ANY (ARRAY['membre'::text, 'chef_equipe'::text]))
LEFT JOIN tournees t ON t.user_id = p.id AND t.statut = 'completed'::text
WHERE e.actif = true
GROUP BY e.id, e.nom, e.numero, e.couleur, e.calendriers_remis_par_admin, e.ordre_affichage
ORDER BY e.ordre_affichage;

GRANT SELECT ON public.equipe_calendriers_suivi TO authenticated;
