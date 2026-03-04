-- ============================================
-- Migration: Add treasurer access to all comptes_sp
-- Date: 2025-12-05
-- Description: Allow treasurers and admins to view all user accounts for KPI calculations
-- ============================================

-- Policy: Trésoriers et admins voient tous les comptes
DO origin/claude/audit-deposit-workflow-01JyM7cXXKVmdtUtXG2TsHeF BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'comptes_sp'
    AND policyname = 'Trésoriers voient tous les comptes'
  ) THEN
    CREATE POLICY "Trésoriers voient tous les comptes"
    ON public.comptes_sp FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('tresorier', 'admin')
      )
    );
  END IF;
END origin/claude/audit-deposit-workflow-01JyM7cXXKVmdtUtXG2TsHeF;

COMMENT ON POLICY "Trésoriers voient tous les comptes" ON public.comptes_sp
IS 'Permet aux trésoriers et admins de voir tous les comptes pour calcul des KPIs';
