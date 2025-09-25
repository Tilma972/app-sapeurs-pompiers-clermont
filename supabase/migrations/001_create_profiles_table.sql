-- Migration: Création de la table profiles
-- Description: Table pour stocker les profils utilisateur de l'Amicale des Sapeurs-Pompiers

-- Création de la table profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    team TEXT,
    role TEXT DEFAULT 'membre' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Création d'un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);
CREATE INDEX IF NOT EXISTS profiles_team_idx ON public.profiles(team);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Fonction pour créer automatiquement un profil lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        'membre'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement un profil
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Politique RLS : Les utilisateurs peuvent voir tous les profils (pour l'amicale)
CREATE POLICY "Les utilisateurs peuvent voir tous les profils" ON public.profiles
    FOR SELECT USING (true);

-- Politique RLS : Les utilisateurs peuvent modifier leur propre profil
CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Politique RLS : Les utilisateurs peuvent insérer leur propre profil
CREATE POLICY "Les utilisateurs peuvent insérer leur propre profil" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Politique RLS : Les utilisateurs peuvent supprimer leur propre profil
CREATE POLICY "Les utilisateurs peuvent supprimer leur propre profil" ON public.profiles
    FOR DELETE USING (auth.uid() = id);

-- Commentaires pour la documentation
COMMENT ON TABLE public.profiles IS 'Profils utilisateur de l''Amicale des Sapeurs-Pompiers';
COMMENT ON COLUMN public.profiles.id IS 'Identifiant unique lié à auth.users';
COMMENT ON COLUMN public.profiles.full_name IS 'Nom complet de l''utilisateur';
COMMENT ON COLUMN public.profiles.team IS 'Équipe/caserne de l''utilisateur (optionnel)';
COMMENT ON COLUMN public.profiles.role IS 'Rôle dans l''amicale (membre, admin, etc.)';
COMMENT ON COLUMN public.profiles.created_at IS 'Date de création du profil';
COMMENT ON COLUMN public.profiles.updated_at IS 'Date de dernière modification du profil';

