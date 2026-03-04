-- ============================================
-- Migration: Système de dépôt de fonds physiques
-- Date: 2025-12-02
-- Description: Permet aux utilisateurs de demander un RDV pour déposer leurs fonds collectés physiquement au trésorier
-- ============================================

-- Création de la table demandes_depot_fonds
CREATE TABLE IF NOT EXISTS public.demandes_depot_fonds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Montants
    montant_a_deposer DECIMAL(10,2) NOT NULL CHECK (montant_a_deposer > 0),
    montant_recu DECIMAL(10,2) CHECK (montant_recu >= 0),

    -- Statut de la demande
    statut TEXT DEFAULT 'en_attente' NOT NULL CHECK (statut IN ('en_attente', 'valide', 'ecart', 'annule')),

    -- Organisation du RDV
    disponibilites_proposees TEXT,
    date_depot_prevue TIMESTAMP WITH TIME ZONE,

    -- Validation par le trésorier
    valide_par UUID REFERENCES auth.users(id),
    valide_le TIMESTAMP WITH TIME ZONE,

    -- Notes
    notes_utilisateur TEXT,
    notes_tresorier TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS demandes_depot_fonds_user_id_idx ON public.demandes_depot_fonds(user_id);
CREATE INDEX IF NOT EXISTS demandes_depot_fonds_statut_idx ON public.demandes_depot_fonds(statut);
CREATE INDEX IF NOT EXISTS demandes_depot_fonds_created_at_idx ON public.demandes_depot_fonds(created_at);

-- Trigger pour mettre à jour automatiquement updated_at
DROP TRIGGER IF EXISTS demandes_depot_fonds_updated_at ON public.demandes_depot_fonds;
CREATE TRIGGER demandes_depot_fonds_updated_at
    BEFORE UPDATE ON public.demandes_depot_fonds
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Row Level Security (RLS)
ALTER TABLE public.demandes_depot_fonds ENABLE ROW LEVEL SECURITY;

-- Politique RLS: Les utilisateurs peuvent voir leurs propres demandes
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres demandes de dépôt" ON public.demandes_depot_fonds;
CREATE POLICY "Les utilisateurs peuvent voir leurs propres demandes de dépôt"
    ON public.demandes_depot_fonds
    FOR SELECT
    USING (auth.uid() = user_id);

-- Politique RLS: Les trésoriers peuvent voir toutes les demandes
DROP POLICY IF EXISTS "Les trésoriers peuvent voir toutes les demandes de dépôt" ON public.demandes_depot_fonds;
CREATE POLICY "Les trésoriers peuvent voir toutes les demandes de dépôt"
    ON public.demandes_depot_fonds
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('tresorier', 'admin')
        )
    );

-- Politique RLS: Les utilisateurs peuvent créer leurs propres demandes
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leurs propres demandes de dépôt" ON public.demandes_depot_fonds;
CREATE POLICY "Les utilisateurs peuvent créer leurs propres demandes de dépôt"
    ON public.demandes_depot_fonds
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Politique RLS: Les utilisateurs peuvent annuler leurs propres demandes en attente
DROP POLICY IF EXISTS "Les utilisateurs peuvent annuler leurs demandes en attente" ON public.demandes_depot_fonds;
CREATE POLICY "Les utilisateurs peuvent annuler leurs demandes en attente"
    ON public.demandes_depot_fonds
    FOR UPDATE
    USING (auth.uid() = user_id AND statut = 'en_attente')
    WITH CHECK (auth.uid() = user_id AND statut = 'en_attente');

-- Politique RLS: Les trésoriers peuvent mettre à jour toutes les demandes
DROP POLICY IF EXISTS "Les trésoriers peuvent valider les demandes de dépôt" ON public.demandes_depot_fonds;
CREATE POLICY "Les trésoriers peuvent valider les demandes de dépôt"
    ON public.demandes_depot_fonds
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('tresorier', 'admin')
        )
    );

-- Fonction pour calculer le montant total non déposé d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_montant_non_depose(p_user_id UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    v_total_collecte DECIMAL(10,2);
    v_total_depose DECIMAL(10,2);
BEGIN
    -- Total collecté dans toutes les tournées
    SELECT COALESCE(SUM(montant_collecte), 0)
    INTO v_total_collecte
    FROM public.tournees
    WHERE user_id = p_user_id
    AND statut = 'completed';

    -- Total déjà déposé (demandes validées)
    SELECT COALESCE(SUM(montant_recu), 0)
    INTO v_total_depose
    FROM public.demandes_depot_fonds
    WHERE user_id = p_user_id
    AND statut = 'valide';

    -- Retourner la différence
    RETURN GREATEST(v_total_collecte - v_total_depose, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour valider une demande de dépôt
CREATE OR REPLACE FUNCTION public.valider_demande_depot(
    p_demande_id UUID,
    p_montant_recu DECIMAL(10,2),
    p_notes_tresorier TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_montant_declare DECIMAL(10,2);
    v_statut TEXT;
    v_ecart DECIMAL(10,2);
    v_result JSON;
BEGIN
    -- Vérifier que la demande existe et récupérer les infos
    SELECT user_id, montant_a_deposer, statut
    INTO v_user_id, v_montant_declare, v_statut
    FROM public.demandes_depot_fonds
    WHERE id = p_demande_id;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Demande introuvable';
    END IF;

    IF v_statut != 'en_attente' THEN
        RAISE EXCEPTION 'Cette demande a déjà été traitée';
    END IF;

    -- Calculer l'écart
    v_ecart := p_montant_recu - v_montant_declare;

    -- Déterminer le statut final
    IF ABS(v_ecart) < 0.01 THEN
        v_statut := 'valide';
    ELSE
        v_statut := 'ecart';
    END IF;

    -- Mettre à jour la demande
    UPDATE public.demandes_depot_fonds
    SET
        montant_recu = p_montant_recu,
        statut = v_statut,
        valide_par = auth.uid(),
        valide_le = NOW(),
        notes_tresorier = p_notes_tresorier,
        updated_at = NOW()
    WHERE id = p_demande_id;

    -- Construire le résultat
    v_result := json_build_object(
        'success', true,
        'demande_id', p_demande_id,
        'statut', v_statut,
        'montant_declare', v_montant_declare,
        'montant_recu', p_montant_recu,
        'ecart', v_ecart
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_montant_non_depose(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.valider_demande_depot(UUID, DECIMAL, TEXT) TO authenticated;

-- Commentaires pour la documentation
COMMENT ON TABLE public.demandes_depot_fonds IS 'Demandes de dépôt de fonds physiques collectés lors des tournées';
COMMENT ON COLUMN public.demandes_depot_fonds.montant_a_deposer IS 'Montant que l''utilisateur déclare vouloir déposer';
COMMENT ON COLUMN public.demandes_depot_fonds.montant_recu IS 'Montant réellement reçu par le trésorier';
COMMENT ON COLUMN public.demandes_depot_fonds.statut IS 'Statut: en_attente, valide, ecart, annule';
COMMENT ON COLUMN public.demandes_depot_fonds.disponibilites_proposees IS 'Créneaux proposés par l''utilisateur';
COMMENT ON FUNCTION public.get_montant_non_depose(UUID) IS 'Calcule le montant total non encore déposé d''un utilisateur';
COMMENT ON FUNCTION public.valider_demande_depot(UUID, DECIMAL, TEXT) IS 'Valide une demande de dépôt et détecte les écarts';
