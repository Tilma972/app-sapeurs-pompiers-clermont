-- Create annonces table
CREATE TABLE IF NOT EXISTS public.annonces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  description TEXT NOT NULL,
  prix DECIMAL(10, 2) NOT NULL,
  categorie TEXT NOT NULL,
  photos TEXT[] NOT NULL DEFAULT '{}',
  localisation TEXT,
  telephone TEXT,
  statut TEXT NOT NULL DEFAULT 'active' CHECK (statut IN ('active', 'desactivee', 'vendue', 'reservee')),
  vues INTEGER NOT NULL DEFAULT 0,
  favoris INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX idx_annonces_user_id ON public.annonces(user_id);
CREATE INDEX idx_annonces_statut ON public.annonces(statut);
CREATE INDEX idx_annonces_categorie ON public.annonces(categorie);
CREATE INDEX idx_annonces_created_at ON public.annonces(created_at DESC);

-- Enable RLS
ALTER TABLE public.annonces ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Tout le monde peut voir les annonces actives
CREATE POLICY "Annonces actives visibles par tous"
  ON public.annonces
  FOR SELECT
  USING (statut = 'active' OR statut = 'reservee');

-- Les utilisateurs peuvent voir toutes leurs annonces
CREATE POLICY "Utilisateurs peuvent voir leurs annonces"
  ON public.annonces
  FOR SELECT
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent créer leurs annonces
CREATE POLICY "Utilisateurs peuvent créer des annonces"
  ON public.annonces
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent modifier leurs annonces
CREATE POLICY "Utilisateurs peuvent modifier leurs annonces"
  ON public.annonces
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs annonces
CREATE POLICY "Utilisateurs peuvent supprimer leurs annonces"
  ON public.annonces
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_annonces_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_annonces_updated_at
  BEFORE UPDATE ON public.annonces
  FOR EACH ROW
  EXECUTE FUNCTION update_annonces_updated_at();

-- Create favoris table (table de jointure)
CREATE TABLE IF NOT EXISTS public.annonces_favoris (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  annonce_id UUID NOT NULL REFERENCES public.annonces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, annonce_id)
);

-- Index pour les favoris
CREATE INDEX idx_annonces_favoris_user_id ON public.annonces_favoris(user_id);
CREATE INDEX idx_annonces_favoris_annonce_id ON public.annonces_favoris(annonce_id);

-- Enable RLS sur favoris
ALTER TABLE public.annonces_favoris ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs favoris
CREATE POLICY "Utilisateurs peuvent voir leurs favoris"
  ON public.annonces_favoris
  FOR SELECT
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent ajouter des favoris
CREATE POLICY "Utilisateurs peuvent ajouter des favoris"
  ON public.annonces_favoris
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs favoris
CREATE POLICY "Utilisateurs peuvent supprimer leurs favoris"
  ON public.annonces_favoris
  FOR DELETE
  USING (auth.uid() = user_id);

-- Fonction pour incrémenter le compteur de vues
CREATE OR REPLACE FUNCTION increment_annonce_vues(annonce_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.annonces
  SET vues = vues + 1
  WHERE id = annonce_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour mettre à jour le compteur de favoris
CREATE OR REPLACE FUNCTION update_annonce_favoris_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.annonces
    SET favoris = favoris + 1
    WHERE id = NEW.annonce_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.annonces
    SET favoris = favoris - 1
    WHERE id = OLD.annonce_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_annonce_favoris_count_trigger
  AFTER INSERT OR DELETE ON public.annonces_favoris
  FOR EACH ROW
  EXECUTE FUNCTION update_annonce_favoris_count();

-- Create storage bucket for annonces photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('annonces', 'annonces', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies pour les photos d'annonces
CREATE POLICY "Tout le monde peut voir les photos d'annonces"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'annonces');

CREATE POLICY "Utilisateurs authentifiés peuvent uploader des photos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'annonces' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Utilisateurs peuvent supprimer leurs photos"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'annonces' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
