-- Migration: Système de suivi des calendriers (MVP Simple)
-- Description: Confirmation de réception + rapprochement admin
-- Date: 2025-11-17

-- =====================================================
-- ÉTAPE 1 : Ajout des colonnes de suivi dans profiles
-- =====================================================

-- Ajouter les colonnes pour le suivi individuel
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS calendriers_lot_attribue INTEGER DEFAULT 40 NOT NULL,
ADD COLUMN IF NOT EXISTS calendriers_reception_confirmee BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS calendriers_confirmation_date TIMESTAMP WITH TIME ZONE;

-- Commentaires pour la documentation
COMMENT ON COLUMN public.profiles.calendriers_lot_attribue IS
  'Nombre de calendriers attribués à cet utilisateur pour la campagne (par défaut 40)';

COMMENT ON COLUMN public.profiles.calendriers_reception_confirmee IS
  'Indique si l''utilisateur a confirmé avoir reçu ses calendriers';

COMMENT ON COLUMN public.profiles.calendriers_confirmation_date IS
  'Date et heure de confirmation de réception des calendriers';

-- =====================================================
-- ÉTAPE 2 : Ajout du suivi global par équipe
-- =====================================================

-- Ajouter la colonne pour le stock remis à l'équipe
ALTER TABLE public.equipes
ADD COLUMN IF NOT EXISTS calendriers_remis_par_admin INTEGER DEFAULT 0 NOT NULL;

-- Commentaire pour la documentation
COMMENT ON COLUMN public.equipes.calendriers_remis_par_admin IS
  'Nombre de calendriers physiquement remis à cette équipe par l''administration';

-- =====================================================
-- ÉTAPE 3 : Vue de rapprochement par équipe
-- =====================================================

CREATE OR REPLACE VIEW public.equipe_calendriers_suivi AS
SELECT
  e.id AS equipe_id,
  e.nom AS equipe_nom,
  e.numero AS equipe_numero,
  e.couleur AS equipe_couleur,

  -- Stock admin
  e.calendriers_remis_par_admin,

  -- Compteurs membres
  COUNT(p.id) FILTER (WHERE p.role IN ('membre', 'chef_equipe')) AS nb_membres_total,
  COUNT(p.id) FILTER (WHERE p.calendriers_reception_confirmee = true) AS nb_membres_confirmes,
  COALESCE(SUM(p.calendriers_lot_attribue), 0) AS total_theorique_membres,
  COALESCE(SUM(
    CASE WHEN p.calendriers_reception_confirmee
    THEN p.calendriers_lot_attribue
    ELSE 0
    END
  ), 0) AS total_confirmes_membres,

  -- Écart
  (e.calendriers_remis_par_admin - COALESCE(SUM(
    CASE WHEN p.calendriers_reception_confirmee
    THEN p.calendriers_lot_attribue
    ELSE 0
    END
  ), 0)) AS ecart,

  -- Statistiques de distribution (depuis les tournées complétées)
  COALESCE(SUM(t.calendriers_distribues), 0) AS calendriers_distribues_total,

  -- Stock dormant (confirmés mais pas encore distribués)
  (COALESCE(SUM(
    CASE WHEN p.calendriers_reception_confirmee
    THEN p.calendriers_lot_attribue
    ELSE 0
    END
  ), 0) - COALESCE(SUM(t.calendriers_distribues), 0)) AS stock_dormant

FROM public.equipes e
LEFT JOIN public.profiles p ON p.team_id = e.id AND p.role IN ('membre', 'chef_equipe')
LEFT JOIN public.tournees t ON t.user_id = p.id AND t.statut = 'completed'
WHERE e.actif = true
GROUP BY e.id, e.nom, e.numero, e.couleur, e.calendriers_remis_par_admin, e.ordre_affichage
ORDER BY e.ordre_affichage;

-- Commentaire pour la documentation
COMMENT ON VIEW public.equipe_calendriers_suivi IS
  'Vue de rapprochement entre calendriers remis par admin et confirmés par les membres';

-- =====================================================
-- ÉTAPE 4 : Vue détaillée par membre
-- =====================================================

CREATE OR REPLACE VIEW public.membres_calendriers_suivi AS
SELECT
  p.id AS user_id,
  p.full_name,
  p.display_name,
  p.team_id,
  e.nom AS equipe_nom,

  -- Calendriers
  p.calendriers_lot_attribue,
  p.calendriers_reception_confirmee,
  p.calendriers_confirmation_date,

  -- Statistiques de distribution
  COALESCE(SUM(t.calendriers_distribues), 0) AS calendriers_distribues,
  COUNT(t.id) FILTER (WHERE t.statut = 'completed') AS nb_tournees_completees,

  -- Stock en main (confirmés - distribués)
  CASE
    WHEN p.calendriers_reception_confirmee
    THEN p.calendriers_lot_attribue - COALESCE(SUM(t.calendriers_distribues), 0)
    ELSE 0
  END AS stock_en_main

FROM public.profiles p
LEFT JOIN public.equipes e ON e.id = p.team_id
LEFT JOIN public.tournees t ON t.user_id = p.id AND t.statut = 'completed'
WHERE p.role IN ('membre', 'chef_equipe')
GROUP BY p.id, p.full_name, p.display_name, p.team_id, e.nom, e.ordre_affichage,
         p.calendriers_lot_attribue, p.calendriers_reception_confirmee,
         p.calendriers_confirmation_date
ORDER BY e.ordre_affichage, p.full_name;

-- Commentaire pour la documentation
COMMENT ON VIEW public.membres_calendriers_suivi IS
  'Vue du suivi individuel des calendriers par membre';

-- =====================================================
-- ÉTAPE 5 : Fonction RPC pour confirmer la réception
-- =====================================================

CREATE OR REPLACE FUNCTION public.confirm_calendar_reception()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'utilisateur est authentifié
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Non authentifié';
  END IF;

  -- Vérifier que l'utilisateur n'a pas déjà confirmé
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND calendriers_reception_confirmee = true
  ) THEN
    RAISE EXCEPTION 'Vous avez déjà confirmé la réception de vos calendriers';
  END IF;

  -- Mettre à jour le profil
  UPDATE public.profiles
  SET
    calendriers_reception_confirmee = true,
    calendriers_confirmation_date = NOW()
  WHERE id = auth.uid();

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.confirm_calendar_reception() IS
  'Permet à un utilisateur de confirmer avoir reçu ses calendriers';

-- =====================================================
-- ÉTAPE 6 : Permissions RLS
-- =====================================================

-- Accorder les permissions sur les vues
GRANT SELECT ON public.equipe_calendriers_suivi TO authenticated;
GRANT SELECT ON public.membres_calendriers_suivi TO authenticated;

-- Accorder les permissions sur la fonction
GRANT EXECUTE ON FUNCTION public.confirm_calendar_reception() TO authenticated;

-- =====================================================
-- ÉTAPE 7 : Index pour optimiser les performances
-- =====================================================

CREATE INDEX IF NOT EXISTS profiles_calendriers_reception_idx
  ON public.profiles(calendriers_reception_confirmee);

CREATE INDEX IF NOT EXISTS profiles_team_calendriers_idx
  ON public.profiles(team_id, calendriers_reception_confirmee);
