-- Migration: Correctif pour zones_tournees
-- Description: Corrige la vue enrichie pour utiliser les bonnes colonnes de profiles et auth.users

-- ============================================================================
-- SUPPRESSION ET RECRÉATION DE LA VUE ENRICHIE
-- ============================================================================

-- Supprimer l'ancienne vue si elle existe
DROP VIEW IF EXISTS public.zones_tournees_enrichies;

-- Recréer la vue avec les bonnes colonnes
CREATE VIEW public.zones_tournees_enrichies AS
SELECT
  zt.*,
  e.nom AS equipe_nom,
  e.numero AS equipe_numero,
  e.couleur AS equipe_couleur,
  e.secteur AS equipe_secteur,
  p.full_name AS pompier_nom,
  u.email AS pompier_email,
  -- Calcul du pourcentage de progression
  CASE
    WHEN zt.nb_calendriers_alloues > 0 THEN
      ROUND((zt.nb_calendriers_distribues::NUMERIC / zt.nb_calendriers_alloues) * 100, 2)
    ELSE 0
  END AS progression_pct,
  -- Nombre de calendriers restants
  COALESCE(zt.nb_calendriers_alloues, 0) - COALESCE(zt.nb_calendriers_distribues, 0) AS nb_calendriers_restants
FROM public.zones_tournees zt
LEFT JOIN public.equipes e ON zt.equipe_id = e.id
LEFT JOIN public.profiles p ON zt.pompier_id = p.id
LEFT JOIN auth.users u ON p.id = u.id;

COMMENT ON VIEW public.zones_tournees_enrichies IS 'Vue enrichie des zones de tournée avec informations des équipes et pompiers';
