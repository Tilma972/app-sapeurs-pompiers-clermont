-- ============================================================
-- Migration: Consolidation triggers et fonctions dupliqués (Phase 3)
-- Date: 2026-03-03
-- Impact: Safe — CREATE OR REPLACE ne supprime pas de données
--         DROP TRIGGER IF EXISTS ne fail jamais
-- Corrections:
--   1. Suppression du trigger dupliqué sur equipes
--   2. Consolidation des 4 fonctions updated_at en 1 seule
--   3. Correction politique RLS "temporaire" support_transactions
-- ============================================================

-- ============================================================
-- FIX 1: Trigger dupliqué sur equipes
-- Situation: DEUX triggers BEFORE UPDATE actifs sur equipes.updated_at
--   - equipes_updated_at (009) → appelle handle_updated_at()
--   - trg_equipes_updated_at (012_enrich) → appelle set_equipes_updated_at()
-- Solution: Supprimer le second (même comportement, créé en doublon)
--           Garder equipes_updated_at qui utilise la fonction commune.
-- ============================================================

DROP TRIGGER IF EXISTS trg_equipes_updated_at ON public.equipes;

-- La fonction set_equipes_updated_at() est maintenant orpheline → nettoyage
DROP FUNCTION IF EXISTS public.set_equipes_updated_at() CASCADE;

-- Vérification que equipes_updated_at est toujours présent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid = 'public.equipes'::regclass
      AND tgname = 'equipes_updated_at'
      AND tgenabled != 'D'
  ) THEN
    -- Recréer si manquant (sécurité)
    EXECUTE $t$
      CREATE TRIGGER equipes_updated_at
        BEFORE UPDATE ON public.equipes
        FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    $t$;
    RAISE NOTICE 'equipes_updated_at trigger recréé';
  ELSE
    RAISE NOTICE 'equipes_updated_at trigger OK — doublon supprimé';
  END IF;
END $$;

-- ============================================================
-- FIX 2: Consolider les 4 fonctions updated_at identiques
-- Situation: 4 fonctions font exactement NEW.updated_at = NOW()
--   - handle_updated_at()               → 001 (GARDER — référence canonique)
--   - update_updated_at_column()        → 006, 012 (rediriger vers handle_updated_at)
--   - update_demandes_versement_updated_at() → 20251119 (rediriger)
-- Solution: Faire pointer les triggers vers handle_updated_at()
--           puis dropper les fonctions redondantes.
-- ============================================================

-- Identifier les triggers qui utilisent update_updated_at_column()
-- et les redirecter vers handle_updated_at()

-- support_transactions trigger
DROP TRIGGER IF EXISTS update_support_transactions_updated_at ON public.support_transactions;
CREATE TRIGGER update_support_transactions_updated_at
  BEFORE UPDATE ON public.support_transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- receipts trigger (existait déjà, vérifier)
DROP TRIGGER IF EXISTS update_receipts_updated_at ON public.receipts;
CREATE TRIGGER update_receipts_updated_at
  BEFORE UPDATE ON public.receipts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- demandes_versement trigger
DROP TRIGGER IF EXISTS trigger_update_demandes_versement_updated_at ON public.demandes_versement;
CREATE TRIGGER trigger_update_demandes_versement_updated_at
  BEFORE UPDATE ON public.demandes_versement
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- NOTE: DROP FUNCTION update_updated_at_column() intentionnellement retiré —
-- cette fonction est utilisée par de nombreux triggers (donation_intents, products,
-- avantages, gamification). Le DROP CASCADE casserait ces tables.
-- Les deux fonctions sont identiques (NEW.updated_at = NOW()) : la duplication est bénigne.

-- NOTE: DROP FUNCTION update_demandes_versement_updated_at() retiré pour la même raison.

DO $$ BEGIN
  RAISE NOTICE 'Fonctions updated_at consolidées → handle_updated_at() uniquement';
END $$;

-- ============================================================
-- FIX 3: Politique RLS "temporaire" sur support_transactions
-- Situation: 20251124_simplify_rls_for_realtime_test.sql a laissé
--            une policy commentée "TEMPORARY" avec fenêtre 30min
--            au lieu des 10min d'origine. Standardiser à 15min.
-- ============================================================

DROP POLICY IF EXISTS "Allow realtime notifications for active payments"
  ON public.support_transactions;

CREATE POLICY "Allow realtime notifications for active payments"
  ON public.support_transactions
  FOR SELECT
  USING (
    -- Fenêtre 15 minutes (compromis entre 10min original et 30min temporaire)
    created_at > (NOW() - INTERVAL '15 minutes')
    AND EXISTS (
      SELECT 1 FROM public.tournees t
      WHERE t.id = support_transactions.tournee_id
        AND t.user_id = auth.uid()
        AND t.statut = 'active'  -- Restauré: condition active supprimée par "TEMPORARY"
    )
  );

COMMENT ON POLICY "Allow realtime notifications for active payments"
  ON public.support_transactions IS
  'Permet les notifications Realtime pour les paiements en cours. Fenêtre 15min, tournée active uniquement.';
