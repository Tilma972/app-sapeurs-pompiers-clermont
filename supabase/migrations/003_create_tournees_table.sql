-- Migration: Création de la table tournees
-- Description: Table pour gérer les tournées de collecte des sapeurs-pompiers

-- Création de la table tournees
CREATE TABLE IF NOT EXISTS public.tournees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date_debut TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    date_fin TIMESTAMP WITH TIME ZONE,
    statut TEXT DEFAULT 'active' NOT NULL CHECK (statut IN ('active', 'completed', 'cancelled')),
    zone TEXT NOT NULL,
    calendriers_alloues INTEGER DEFAULT 0 NOT NULL,
    calendriers_distribues INTEGER DEFAULT 0 NOT NULL,
    montant_collecte DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Création d'index pour améliorer les performances
CREATE INDEX IF NOT EXISTS tournees_user_id_idx ON public.tournees(user_id);
CREATE INDEX IF NOT EXISTS tournees_statut_idx ON public.tournees(statut);
CREATE INDEX IF NOT EXISTS tournees_date_debut_idx ON public.tournees(date_debut);
CREATE INDEX IF NOT EXISTS tournees_zone_idx ON public.tournees(zone);

-- Trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER tournees_updated_at
    BEFORE UPDATE ON public.tournees
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Row Level Security (RLS)
ALTER TABLE public.tournees ENABLE ROW LEVEL SECURITY;

-- Politique RLS : Les utilisateurs peuvent voir leurs propres tournées
CREATE POLICY "Les utilisateurs peuvent voir leurs propres tournées" ON public.tournees
    FOR SELECT USING (auth.uid() = user_id);

-- Politique RLS : Les utilisateurs peuvent créer leurs propres tournées
CREATE POLICY "Les utilisateurs peuvent créer leurs propres tournées" ON public.tournees
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politique RLS : Les utilisateurs peuvent modifier leurs propres tournées
CREATE POLICY "Les utilisateurs peuvent modifier leurs propres tournées" ON public.tournees
    FOR UPDATE USING (auth.uid() = user_id);

-- Politique RLS : Les utilisateurs peuvent supprimer leurs propres tournées
CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres tournées" ON public.tournees
    FOR DELETE USING (auth.uid() = user_id);

-- Fonction pour obtenir les statistiques d'une tournée
CREATE OR REPLACE FUNCTION public.get_tournee_stats(tournee_uuid UUID)
RETURNS TABLE (
    calendriers_distribues INTEGER,
    montant_collecte DECIMAL(10,2),
    nombre_transactions INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.calendriers_distribues,
        t.montant_collecte,
        COALESCE(COUNT(tr.id), 0)::INTEGER as nombre_transactions
    FROM public.tournees t
    LEFT JOIN public.transactions tr ON t.id = tr.tournee_id
    WHERE t.id = tournee_uuid
    GROUP BY t.id, t.calendriers_distribues, t.montant_collecte;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour clôturer une tournée
CREATE OR REPLACE FUNCTION public.cloturer_tournee(
    tournee_uuid UUID,
    calendriers_finaux INTEGER,
    montant_final DECIMAL(10,2)
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Vérifier que la tournée appartient à l'utilisateur
    IF NOT EXISTS (
        SELECT 1 FROM public.tournees 
        WHERE id = tournee_uuid AND user_id = auth.uid()
    ) THEN
        RETURN FALSE;
    END IF;
    
    -- Mettre à jour la tournée
    UPDATE public.tournees 
    SET 
        statut = 'completed',
        date_fin = NOW(),
        calendriers_distribues = calendriers_finaux,
        montant_collecte = montant_final,
        updated_at = NOW()
    WHERE id = tournee_uuid;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires pour la documentation
COMMENT ON TABLE public.tournees IS 'Tournées de collecte des sapeurs-pompiers';
COMMENT ON COLUMN public.tournees.id IS 'Identifiant unique de la tournée';
COMMENT ON COLUMN public.tournees.user_id IS 'Identifiant de l''utilisateur (sapeur-pompier)';
COMMENT ON COLUMN public.tournees.date_debut IS 'Date et heure de début de la tournée';
COMMENT ON COLUMN public.tournees.date_fin IS 'Date et heure de fin de la tournée (NULL si active)';
COMMENT ON COLUMN public.tournees.statut IS 'Statut de la tournée (active, completed, cancelled)';
COMMENT ON COLUMN public.tournees.zone IS 'Zone géographique de la tournée';
COMMENT ON COLUMN public.tournees.calendriers_alloues IS 'Nombre de calendriers alloués pour cette tournée';
COMMENT ON COLUMN public.tournees.calendriers_distribues IS 'Nombre de calendriers distribués';
COMMENT ON COLUMN public.tournees.montant_collecte IS 'Montant total collecté en euros';
COMMENT ON COLUMN public.tournees.notes IS 'Notes sur la tournée';
COMMENT ON COLUMN public.tournees.created_at IS 'Date de création de la tournée';
COMMENT ON COLUMN public.tournees.updated_at IS 'Date de dernière modification';


