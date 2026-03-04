-- ============================================================
-- Migration: Contrainte conditionnelle sur support_transactions.user_id
-- Date: 2026-03-04
-- Impact: Protège l'intégrité des transactions terrain tout en
--         permettant user_id NULL pour les commandes boutique,
--         dons landing page et webhooks HelloAsso.
--
-- Contexte:
--   - 006: user_id NOT NULL (original)
--   - 20251202: ALTER COLUMN user_id DROP NOT NULL (pour commande boutique)
--   - Résultat: user_id nullable sans garde-fou → risque pour les
--     transactions terrain qui DOIVENT avoir un user_id
--
-- Solution: CHECK conditionnel — user_id obligatoire sauf pour
--           les sources non-authentifiées
-- ============================================================

-- Ajouter la contrainte conditionnelle
ALTER TABLE public.support_transactions
  ADD CONSTRAINT check_user_id_required_for_terrain
  CHECK (
    -- Sources non-terrain : user_id peut être NULL
    source IN ('boutique', 'landing_page_donation', 'landing_page', 'helloasso')
    OR
    -- Source terrain (ou NULL/défaut) : user_id OBLIGATOIRE
    user_id IS NOT NULL
  );

-- Vérification : s'assurer qu'il n'y a pas de données existantes en violation
DO $$ 
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.support_transactions
  WHERE user_id IS NULL
    AND (source IS NULL OR source NOT IN ('boutique', 'landing_page_donation', 'landing_page', 'helloasso'));
  
  IF v_count > 0 THEN
    RAISE WARNING '% transactions terrain sans user_id détectées — à vérifier manuellement', v_count;
  ELSE
    RAISE NOTICE 'Contrainte check_user_id_required_for_terrain ajoutée — 0 violation';
  END IF;
END $$;

COMMENT ON CONSTRAINT check_user_id_required_for_terrain 
  ON public.support_transactions IS
  'user_id obligatoire pour les transactions terrain. NULL autorisé uniquement pour boutique/landing_page/helloasso.';
