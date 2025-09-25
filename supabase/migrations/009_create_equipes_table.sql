-- Migration: Création de la table equipes
-- Description: Table pour gérer les équipes de l'Amicale des Sapeurs-Pompiers de Clermont l'Hérault

-- Création de la table equipes
CREATE TABLE IF NOT EXISTS public.equipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom TEXT NOT NULL UNIQUE,
    numero INTEGER UNIQUE, -- Pour les équipes numérotées (1, 2, 3, 4)
    type TEXT DEFAULT 'standard' NOT NULL CHECK (type IN ('standard', 'spp')), -- standard ou spp
    description TEXT,
    chef_equipe_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    secteur TEXT NOT NULL, -- Secteur géographique affecté à l'équipe
    calendriers_alloues INTEGER DEFAULT 0 NOT NULL, -- Nombre de calendriers alloués à cette équipe
    couleur TEXT DEFAULT '#3b82f6', -- Couleur pour l'affichage (hex)
    ordre_affichage INTEGER DEFAULT 0, -- Pour ordonner l'affichage
    actif BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Création d'index pour améliorer les performances
CREATE INDEX IF NOT EXISTS equipes_nom_idx ON public.equipes(nom);
CREATE INDEX IF NOT EXISTS equipes_numero_idx ON public.equipes(numero);
CREATE INDEX IF NOT EXISTS equipes_type_idx ON public.equipes(type);
CREATE INDEX IF NOT EXISTS equipes_secteur_idx ON public.equipes(secteur);
CREATE INDEX IF NOT EXISTS equipes_chef_equipe_id_idx ON public.equipes(chef_equipe_id);
CREATE INDEX IF NOT EXISTS equipes_actif_idx ON public.equipes(actif);
CREATE INDEX IF NOT EXISTS equipes_ordre_affichage_idx ON public.equipes(ordre_affichage);

-- Trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER equipes_updated_at
    BEFORE UPDATE ON public.equipes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Insertion des équipes réelles de Clermont l'Hérault
-- Note: Les chefs d'équipe et secteurs sont à configurer selon la réalité locale
INSERT INTO public.equipes (nom, numero, type, description, secteur, calendriers_alloues, couleur, ordre_affichage) VALUES
('Équipe 1', 1, 'standard', 'Première équipe de sapeurs-pompiers', 'Secteur Centre-Ville', 50, '#ef4444', 1),
('Équipe 2', 2, 'standard', 'Deuxième équipe de sapeurs-pompiers', 'Secteur Nord', 45, '#f97316', 2),
('Équipe 3', 3, 'standard', 'Troisième équipe de sapeurs-pompiers', 'Secteur Sud', 40, '#eab308', 3),
('Équipe 4', 4, 'standard', 'Quatrième équipe de sapeurs-pompiers', 'Secteur Est', 35, '#22c55e', 4),
('Équipe SPP', NULL, 'spp', 'Équipe de Sapeurs-Pompiers Professionnels', 'Secteur Professionnel', 30, '#8b5cf6', 5)
ON CONFLICT (nom) DO NOTHING;

-- Ajout de la colonne team_id à la table profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.equipes(id) ON DELETE SET NULL;

-- Création d'un index pour la nouvelle colonne
CREATE INDEX IF NOT EXISTS profiles_team_id_idx ON public.profiles(team_id);

-- Migration des données existantes : mapping des équipes actuelles vers les nouvelles équipes
-- Cette fonction migre les données existantes du champ team (TEXT) vers team_id (UUID)
CREATE OR REPLACE FUNCTION migrate_team_data()
RETURNS void AS $$
BEGIN
    -- Migration des équipes numérotées
    UPDATE public.profiles 
    SET team_id = (
        SELECT id FROM public.equipes 
        WHERE numero::text = profiles.team 
        AND type = 'standard'
    )
    WHERE team IS NOT NULL 
    AND team ~ '^[0-9]+$' -- Équipes numérotées uniquement
    AND team_id IS NULL;

    -- Migration des équipes SPP (variations possibles)
    UPDATE public.profiles 
    SET team_id = (
        SELECT id FROM public.equipes 
        WHERE type = 'spp'
    )
    WHERE team IS NOT NULL 
    AND LOWER(team) LIKE '%spp%' -- Contient "spp"
    AND team_id IS NULL;

    -- Migration des équipes "Alpha" (équipe de test) vers Équipe 1
    UPDATE public.profiles 
    SET team_id = (
        SELECT id FROM public.equipes 
        WHERE numero = 1
    )
    WHERE team IS NOT NULL 
    AND LOWER(team) LIKE '%alpha%' -- Contient "alpha"
    AND team_id IS NULL;

    -- Log des profils non migrés pour vérification
    RAISE NOTICE 'Profils avec équipe non migrée: %', (
        SELECT COUNT(*) FROM public.profiles 
        WHERE team IS NOT NULL AND team_id IS NULL
    );
END;
$$ LANGUAGE plpgsql;

-- Exécution de la migration des données
SELECT migrate_team_data();

-- Suppression de la fonction temporaire
DROP FUNCTION migrate_team_data();

-- Row Level Security (RLS)
ALTER TABLE public.equipes ENABLE ROW LEVEL SECURITY;

-- Politique RLS : Tous les utilisateurs authentifiés peuvent voir les équipes
CREATE POLICY "Tous les utilisateurs peuvent voir les équipes" ON public.equipes
    FOR SELECT USING (auth.role() = 'authenticated');

-- Politique RLS : Seuls les admins peuvent modifier les équipes
CREATE POLICY "Seuls les admins peuvent modifier les équipes" ON public.equipes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Mise à jour de la politique RLS des profiles pour inclure team_id
-- (Les politiques existantes restent valides)

-- Commentaires pour la documentation
COMMENT ON TABLE public.equipes IS 'Équipes de l''Amicale des Sapeurs-Pompiers de Clermont l''Hérault';
COMMENT ON COLUMN public.equipes.id IS 'Identifiant unique de l''équipe';
COMMENT ON COLUMN public.equipes.nom IS 'Nom de l''équipe (ex: "Équipe 1", "Équipe SPP")';
COMMENT ON COLUMN public.equipes.numero IS 'Numéro de l''équipe pour les équipes standard (1-4)';
COMMENT ON COLUMN public.equipes.type IS 'Type d''équipe (standard ou spp)';
COMMENT ON COLUMN public.equipes.description IS 'Description de l''équipe';
COMMENT ON COLUMN public.equipes.chef_equipe_id IS 'ID du chef d''équipe (référence vers auth.users)';
COMMENT ON COLUMN public.equipes.secteur IS 'Secteur géographique affecté à l''équipe';
COMMENT ON COLUMN public.equipes.calendriers_alloues IS 'Nombre de calendriers alloués à cette équipe';
COMMENT ON COLUMN public.equipes.couleur IS 'Couleur hexadécimale pour l''affichage';
COMMENT ON COLUMN public.equipes.ordre_affichage IS 'Ordre d''affichage dans les listes';
COMMENT ON COLUMN public.equipes.actif IS 'Équipe active ou non';

COMMENT ON COLUMN public.profiles.team_id IS 'Référence vers l''équipe de l''utilisateur';
