-- Migration: Création de la table transactions
-- Description: Table pour gérer les transactions de collecte lors des tournées

-- Création de la table transactions
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tournee_id UUID REFERENCES public.tournees(id) ON DELETE CASCADE NOT NULL,
    montant DECIMAL(10,2) NOT NULL CHECK (montant > 0),
    calendars_given INTEGER NOT NULL CHECK (calendars_given > 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('espèces', 'chèque', 'carte')),
    donor_name TEXT,
    donor_email TEXT,
    donor_phone TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Création d'index pour améliorer les performances
CREATE INDEX IF NOT EXISTS transactions_tournee_id_idx ON public.transactions(tournee_id);
CREATE INDEX IF NOT EXISTS transactions_payment_method_idx ON public.transactions(payment_method);
CREATE INDEX IF NOT EXISTS transactions_created_at_idx ON public.transactions(created_at);
CREATE INDEX IF NOT EXISTS transactions_donor_name_idx ON public.transactions(donor_name);

-- Trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Trigger pour mettre à jour les statistiques de la tournée
CREATE OR REPLACE FUNCTION public.update_tournee_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour les statistiques de la tournée
    UPDATE public.tournees 
    SET 
        calendriers_distribues = (
            SELECT COALESCE(SUM(calendars_given), 0) 
            FROM public.transactions 
            WHERE tournee_id = COALESCE(NEW.tournee_id, OLD.tournee_id)
        ),
        montant_collecte = (
            SELECT COALESCE(SUM(montant), 0) 
            FROM public.transactions 
            WHERE tournee_id = COALESCE(NEW.tournee_id, OLD.tournee_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.tournee_id, OLD.tournee_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger pour INSERT, UPDATE, DELETE sur transactions
CREATE TRIGGER transactions_update_tournee_stats
    AFTER INSERT OR UPDATE OR DELETE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_tournee_stats();

-- Row Level Security (RLS)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Politique RLS : Les utilisateurs peuvent voir les transactions de leurs tournées
CREATE POLICY "Les utilisateurs peuvent voir les transactions de leurs tournées" ON public.transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tournees 
            WHERE id = tournee_id AND user_id = auth.uid()
        )
    );

-- Politique RLS : Les utilisateurs peuvent créer des transactions pour leurs tournées
CREATE POLICY "Les utilisateurs peuvent créer des transactions pour leurs tournées" ON public.transactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tournees 
            WHERE id = tournee_id AND user_id = auth.uid()
        )
    );

-- Politique RLS : Les utilisateurs peuvent modifier les transactions de leurs tournées
CREATE POLICY "Les utilisateurs peuvent modifier les transactions de leurs tournées" ON public.transactions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.tournees 
            WHERE id = tournee_id AND user_id = auth.uid()
        )
    );

-- Politique RLS : Les utilisateurs peuvent supprimer les transactions de leurs tournées
CREATE POLICY "Les utilisateurs peuvent supprimer les transactions de leurs tournées" ON public.transactions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.tournees 
            WHERE id = tournee_id AND user_id = auth.uid()
        )
    );

-- Fonction pour obtenir les statistiques d'une tournée avec détails
CREATE OR REPLACE FUNCTION public.get_tournee_detailed_stats(tournee_uuid UUID)
RETURNS TABLE (
    tournee_id UUID,
    zone TEXT,
    statut TEXT,
    date_debut TIMESTAMP WITH TIME ZONE,
    date_fin TIMESTAMP WITH TIME ZONE,
    calendriers_alloues INTEGER,
    calendriers_distribues INTEGER,
    montant_collecte DECIMAL(10,2),
    nombre_transactions INTEGER,
    montant_especes DECIMAL(10,2),
    montant_cheques DECIMAL(10,2),
    montant_cartes DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.zone,
        t.statut,
        t.date_debut,
        t.date_fin,
        t.calendriers_alloues,
        t.calendriers_distribues,
        t.montant_collecte,
        COALESCE(COUNT(tr.id), 0)::INTEGER as nombre_transactions,
        COALESCE(SUM(CASE WHEN tr.payment_method = 'espèces' THEN tr.montant ELSE 0 END), 0) as montant_especes,
        COALESCE(SUM(CASE WHEN tr.payment_method = 'chèque' THEN tr.montant ELSE 0 END), 0) as montant_cheques,
        COALESCE(SUM(CASE WHEN tr.payment_method = 'carte' THEN tr.montant ELSE 0 END), 0) as montant_cartes
    FROM public.tournees t
    LEFT JOIN public.transactions tr ON t.id = tr.tournee_id
    WHERE t.id = tournee_uuid
    GROUP BY t.id, t.zone, t.statut, t.date_debut, t.date_fin, t.calendriers_alloues, t.calendriers_distribues, t.montant_collecte;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les statistiques globales d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_user_tournee_stats(user_uuid UUID)
RETURNS TABLE (
    total_tournees INTEGER,
    tournees_actives INTEGER,
    tournees_completed INTEGER,
    total_calendriers_distribues INTEGER,
    total_montant_collecte DECIMAL(10,2),
    moyenne_calendriers_par_tournee DECIMAL(10,2),
    moyenne_montant_par_tournee DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_tournees,
        COUNT(CASE WHEN statut = 'active' THEN 1 END)::INTEGER as tournees_actives,
        COUNT(CASE WHEN statut = 'completed' THEN 1 END)::INTEGER as tournees_completed,
        COALESCE(SUM(calendriers_distribues), 0)::INTEGER as total_calendriers_distribues,
        COALESCE(SUM(montant_collecte), 0) as total_montant_collecte,
        COALESCE(AVG(calendriers_distribues), 0) as moyenne_calendriers_par_tournee,
        COALESCE(AVG(montant_collecte), 0) as moyenne_montant_par_tournee
    FROM public.tournees
    WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires pour la documentation
COMMENT ON TABLE public.transactions IS 'Transactions de collecte lors des tournées';
COMMENT ON COLUMN public.transactions.id IS 'Identifiant unique de la transaction';
COMMENT ON COLUMN public.transactions.tournee_id IS 'Identifiant de la tournée associée';
COMMENT ON COLUMN public.transactions.montant IS 'Montant du don en euros';
COMMENT ON COLUMN public.transactions.calendars_given IS 'Nombre de calendriers donnés';
COMMENT ON COLUMN public.transactions.payment_method IS 'Mode de paiement (espèces, chèque, carte)';
COMMENT ON COLUMN public.transactions.donor_name IS 'Nom du donateur (optionnel)';
COMMENT ON COLUMN public.transactions.donor_email IS 'Email du donateur (optionnel)';
COMMENT ON COLUMN public.transactions.donor_phone IS 'Téléphone du donateur (optionnel)';
COMMENT ON COLUMN public.transactions.notes IS 'Notes sur la transaction';
COMMENT ON COLUMN public.transactions.created_at IS 'Date de création de la transaction';
COMMENT ON COLUMN public.transactions.updated_at IS 'Date de dernière modification';




