-- ============================================
-- Migration corrective: Demandes dépôt fonds
-- Date: 2025-12-05
-- Description: Correction des foreign keys et policies RLS
-- ============================================

-- 1. Ajouter les contraintes de foreign key explicites si elles n'existent pas
DO $$
BEGIN
    -- Foreign key pour user_id vers profiles
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'demandes_depot_fonds_user_id_fkey'
    ) THEN
        ALTER TABLE public.demandes_depot_fonds
        ADD CONSTRAINT demandes_depot_fonds_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- Foreign key pour valide_par vers profiles
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'demandes_depot_fonds_valide_par_fkey'
    ) THEN
        ALTER TABLE public.demandes_depot_fonds
        ADD CONSTRAINT demandes_depot_fonds_valide_par_fkey
        FOREIGN KEY (valide_par) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Ajouter une policy INSERT pour les trésoriers (dépôts directs)
DROP POLICY IF EXISTS "Les trésoriers peuvent créer des dépôts pour tous" ON public.demandes_depot_fonds;
CREATE POLICY "Les trésoriers peuvent créer des dépôts pour tous"
    ON public.demandes_depot_fonds
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('tresorier', 'admin')
        )
    );

-- 3. Mettre à jour la policy UPDATE pour les trésoriers (ajouter WITH CHECK)
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
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('tresorier', 'admin')
        )
    );

-- Commentaires
COMMENT ON CONSTRAINT demandes_depot_fonds_user_id_fkey ON public.demandes_depot_fonds IS 'Foreign key vers profiles pour user_id';
COMMENT ON CONSTRAINT demandes_depot_fonds_valide_par_fkey ON public.demandes_depot_fonds IS 'Foreign key vers profiles pour valide_par';
