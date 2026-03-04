-- Migration: Enrichir équipes pour admin robuste
-- Description: Ajouter archivage + contrainte unicité

-- 1. Ajouter colonnes d'archivage (traçabilité)
ALTER TABLE public.equipes 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES profiles(id);

-- 2. Contrainte sur status
ALTER TABLE public.equipes 
ADD CONSTRAINT equipes_status_check 
CHECK (status IN ('active', 'archived'));

-- 3. Synchroniser "actif" avec "status" (migration données)
UPDATE public.equipes 
SET status = CASE 
  WHEN actif = true THEN 'active' 
  ELSE 'archived' 
END
WHERE status = 'active'; -- Éviter de ré-écrire si déjà fait

-- 4. Contrainte unicité nom (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS equipes_nom_lower_uniq 
ON public.equipes (lower(nom));

-- 5. Trigger updated_at (si pas déjà présent)
CREATE OR REPLACE FUNCTION public.set_equipes_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_equipes_updated_at ON public.equipes;
CREATE TRIGGER trg_equipes_updated_at
BEFORE UPDATE ON public.equipes
FOR EACH ROW EXECUTE FUNCTION public.set_equipes_updated_at();

-- 6. Mettre à jour la vue equipes_stats_view pour inclure status
DROP VIEW IF EXISTS public.equipes_stats_view CASCADE;

CREATE OR REPLACE VIEW public.equipes_stats_view AS
SELECT 
    e.id as equipe_id,
    e.nom as equipe_nom,
    e.numero as equipe_numero,
    e.type as equipe_type,
    e.secteur,
    
    -- Données géographiques (déjà présentes)
    e.communes,
    e.secteur_centre_lat,
    e.secteur_centre_lon,
    
    e.calendriers_alloues,
    e.couleur,
    e.ordre_affichage,
    e.chef_equipe_id,
    
    -- NOUVEAU : status au lieu de actif
    e.status,
    e.archived_at,
    
    ce.full_name as chef_equipe_nom,
    
    -- Stats calculées (inchangé)
    COALESCE(SUM(t.calendriers_distribues), 0) as calendriers_distribues,
    COALESCE(SUM(t.montant_collecte), 0) as montant_collecte,
    COALESCE(COUNT(t.id), 0) as nombre_tournees,
    COALESCE(COUNT(CASE WHEN t.statut = 'active' THEN 1 END), 0) as tournees_actives,
    COALESCE(COUNT(CASE WHEN t.statut = 'completed' THEN 1 END), 0) as tournees_terminees,
    
    -- Progression (inchangé)
    CASE 
        WHEN e.calendriers_alloues > 0 THEN 
            ROUND((COALESCE(SUM(t.calendriers_distribues), 0)::DECIMAL / e.calendriers_alloues) * 100, 1)
        ELSE 0 
    END as progression_pourcentage,
    
    CASE 
        WHEN COALESCE(SUM(t.calendriers_distribues), 0) > 0 THEN 
            ROUND(COALESCE(SUM(t.montant_collecte), 0) / COALESCE(SUM(t.calendriers_distribues), 0), 2)
        ELSE 0 
    END as moyenne_par_calendrier,
    
    COALESCE(membres_count.count, 0) as nombre_membres,
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
WHERE e.status = 'active' -- Filtrer par status au lieu de actif
GROUP BY e.id, e.nom, e.numero, e.type, e.secteur, 
         e.communes, e.secteur_centre_lat, e.secteur_centre_lon,
         e.calendriers_alloues, e.couleur, e.ordre_affichage, 
         e.chef_equipe_id, e.status, e.archived_at, ce.full_name, membres_count.count
ORDER BY e.ordre_affichage;

-- Permissions (inchangées)
GRANT SELECT ON public.equipes_stats_view TO authenticated;

-- Commentaires
COMMENT ON COLUMN public.equipes.status IS 'Statut de l''équipe: active ou archived';
COMMENT ON COLUMN public.equipes.archived_at IS 'Date d''archivage de l''équipe';
COMMENT ON COLUMN public.equipes.archived_by IS 'Utilisateur ayant archivé l''équipe';
