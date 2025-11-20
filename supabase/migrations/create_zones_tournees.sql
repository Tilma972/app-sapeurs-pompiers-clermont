-- Migration: Création de la table zones_tournees
-- Description: Table pour gérer les zones de tournée individuelles des pompiers
-- Cette table permet de subdiviser chaque grand secteur en petites zones
-- de ~260 habitants assignables à un pompier individuel.

-- ============================================================================
-- 1. CRÉATION DE LA TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.zones_tournees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  equipe_id UUID NOT NULL REFERENCES public.equipes(id) ON DELETE CASCADE,
  pompier_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Identification de la zone
  code_zone TEXT UNIQUE, -- Ex: "NE-01", "NE-02" pour faciliter le tri
  nom_zone TEXT NOT NULL, -- Ex: "Ceyras - Centre Ville"
  description TEXT,

  -- Géométrie (polygone GeoJSON)
  geom JSONB NOT NULL,

  -- Données statistiques
  population_estimee INTEGER,
  nb_foyers_estimes INTEGER,

  -- Gestion de la distribution
  annee SMALLINT NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
  nb_calendriers_alloues INTEGER, -- Calculé depuis population
  nb_calendriers_distribues INTEGER DEFAULT 0,

  -- Statut et dates
  statut TEXT NOT NULL DEFAULT 'À faire' CHECK (statut IN ('À faire', 'En cours', 'Terminé', 'Annulé')),
  date_debut_tournee TIMESTAMPTZ,
  date_fin_tournee TIMESTAMPTZ,

  -- Notes du terrain
  notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. COMMENTAIRES POUR LA DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.zones_tournees IS 'Zones de tournée individuelles pour la distribution des calendriers. Chaque zone représente environ 260 habitants assignables à un pompier.';
COMMENT ON COLUMN public.zones_tournees.equipe_id IS 'Équipe (grand secteur) à laquelle cette zone appartient';
COMMENT ON COLUMN public.zones_tournees.pompier_id IS 'Pompier assigné à cette zone (optionnel)';
COMMENT ON COLUMN public.zones_tournees.code_zone IS 'Code court pour identification rapide (ex: NE-01, NE-02)';
COMMENT ON COLUMN public.zones_tournees.nom_zone IS 'Nom descriptif de la zone (ex: "Ceyras - Centre Ville")';
COMMENT ON COLUMN public.zones_tournees.geom IS 'Polygone GeoJSON de la zone';
COMMENT ON COLUMN public.zones_tournees.population_estimee IS 'Population estimée dans cette zone (INSEE)';
COMMENT ON COLUMN public.zones_tournees.nb_foyers_estimes IS 'Nombre de foyers estimés (population / 2.2)';
COMMENT ON COLUMN public.zones_tournees.annee IS 'Année de la campagne de distribution';
COMMENT ON COLUMN public.zones_tournees.nb_calendriers_alloues IS 'Nombre de calendriers alloués à cette zone';
COMMENT ON COLUMN public.zones_tournees.nb_calendriers_distribues IS 'Nombre de calendriers effectivement distribués';
COMMENT ON COLUMN public.zones_tournees.statut IS 'Statut de la tournée dans cette zone';
COMMENT ON COLUMN public.zones_tournees.date_debut_tournee IS 'Date de début de la tournée dans cette zone';
COMMENT ON COLUMN public.zones_tournees.date_fin_tournee IS 'Date de fin de la tournée dans cette zone';
COMMENT ON COLUMN public.zones_tournees.notes IS 'Notes du pompier sur le terrain (difficultés, observations, etc.)';

-- ============================================================================
-- 3. INDEX POUR LES PERFORMANCES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_zones_tournees_equipe_id ON public.zones_tournees(equipe_id);
CREATE INDEX IF NOT EXISTS idx_zones_tournees_pompier_id ON public.zones_tournees(pompier_id);
CREATE INDEX IF NOT EXISTS idx_zones_tournees_statut ON public.zones_tournees(statut);
CREATE INDEX IF NOT EXISTS idx_zones_tournees_annee ON public.zones_tournees(annee);
CREATE INDEX IF NOT EXISTS idx_zones_tournees_code_zone ON public.zones_tournees(code_zone);

-- ============================================================================
-- 4. TRIGGER POUR MISE À JOUR AUTOMATIQUE
-- ============================================================================

-- Utilisation de la fonction existante handle_updated_at()
CREATE TRIGGER set_zones_tournees_updated_at
  BEFORE UPDATE ON public.zones_tournees
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 5. FONCTION POUR CALCULER AUTOMATIQUEMENT LES CHAMPS DÉDUITS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_zones_tournees_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcul automatique du nombre de foyers (moyenne française : 2.2 personnes/foyer)
  IF NEW.population_estimee IS NOT NULL THEN
    NEW.nb_foyers_estimes = ROUND(NEW.population_estimee / 2.2);
  END IF;

  -- Calcul automatique des calendriers alloués
  -- Hypothèse : 1 calendrier pour ~6.5 habitants (environ 40 calendriers pour 260 habitants)
  IF NEW.population_estimee IS NOT NULL AND NEW.nb_calendriers_alloues IS NULL THEN
    NEW.nb_calendriers_alloues = ROUND(NEW.population_estimee / 6.5);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_zones_tournees_fields_trigger
  BEFORE INSERT OR UPDATE ON public.zones_tournees
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_zones_tournees_fields();

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.zones_tournees ENABLE ROW LEVEL SECURITY;

-- Politique : Lecture pour tous les utilisateurs authentifiés
CREATE POLICY "Lecture zones pour authentifiés"
  ON public.zones_tournees FOR SELECT
  USING (auth.role() = 'authenticated');

-- Politique : Les admins peuvent tout faire
CREATE POLICY "Admins peuvent gérer les zones"
  ON public.zones_tournees FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Politique : Les chefs d'équipe peuvent gérer les zones de leur équipe
CREATE POLICY "Chefs peuvent gérer leurs zones"
  ON public.zones_tournees FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.equipes e
      WHERE e.id = zones_tournees.equipe_id
      AND e.chef_equipe_id = auth.uid()
    )
  );

-- Politique : Les pompiers peuvent modifier leurs zones assignées
CREATE POLICY "Pompiers peuvent modifier leur zone"
  ON public.zones_tournees FOR UPDATE
  USING (pompier_id = auth.uid())
  WITH CHECK (pompier_id = auth.uid());

-- ============================================================================
-- 7. VUE ENRICHIE POUR FACILITER LES REQUÊTES
-- ============================================================================

CREATE OR REPLACE VIEW public.zones_tournees_enrichies AS
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

-- ============================================================================
-- 8. FONCTION UTILITAIRE : Obtenir les statistiques d'une équipe
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_equipe_zones_stats(p_equipe_id UUID, p_annee SMALLINT DEFAULT NULL)
RETURNS TABLE(
  total_zones BIGINT,
  zones_a_faire BIGINT,
  zones_en_cours BIGINT,
  zones_terminees BIGINT,
  total_population INTEGER,
  total_calendriers_alloues INTEGER,
  total_calendriers_distribues INTEGER,
  progression_pct NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_zones,
    COUNT(*) FILTER (WHERE statut = 'À faire')::BIGINT as zones_a_faire,
    COUNT(*) FILTER (WHERE statut = 'En cours')::BIGINT as zones_en_cours,
    COUNT(*) FILTER (WHERE statut = 'Terminé')::BIGINT as zones_terminees,
    COALESCE(SUM(population_estimee), 0)::INTEGER as total_population,
    COALESCE(SUM(nb_calendriers_alloues), 0)::INTEGER as total_calendriers_alloues,
    COALESCE(SUM(nb_calendriers_distribues), 0)::INTEGER as total_calendriers_distribues,
    CASE
      WHEN SUM(nb_calendriers_alloues) > 0 THEN
        ROUND((SUM(nb_calendriers_distribues)::NUMERIC / SUM(nb_calendriers_alloues)) * 100, 2)
      ELSE 0
    END as progression_pct
  FROM public.zones_tournees
  WHERE equipe_id = p_equipe_id
    AND (p_annee IS NULL OR annee = p_annee);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.get_equipe_zones_stats IS 'Obtient les statistiques de distribution pour une équipe donnée';

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
