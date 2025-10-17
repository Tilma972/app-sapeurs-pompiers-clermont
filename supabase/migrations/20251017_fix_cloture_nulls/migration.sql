-- Fix cloture_tournee to coalesce null inputs to 0
-- This prevents NOT NULL violations when closing a tour with only card payments.

CREATE OR REPLACE FUNCTION public.cloturer_tournee(
    tournee_uuid UUID,
    calendriers_finaux INTEGER,
    montant_final DECIMAL(10,2)
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Vérifier que la tournée appartient à l'utilisateur courant
    IF NOT EXISTS (
        SELECT 1 FROM public.tournees 
        WHERE id = tournee_uuid AND user_id = auth.uid()
    ) THEN
        RETURN FALSE;
    END IF;
    
    -- Mettre à jour la tournée en forçant les valeurs nulles à 0
    UPDATE public.tournees 
    SET 
        statut = 'completed',
        date_fin = NOW(),
        calendriers_distribues = COALESCE(calendriers_finaux, 0),
        montant_collecte = COALESCE(montant_final, 0),
        updated_at = NOW()
    WHERE id = tournee_uuid;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
