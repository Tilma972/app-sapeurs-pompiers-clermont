-- ============================================================
-- Migration: Contrainte conditionnelle sur support_transactions.user_id
-- Date: 2026-03-04  (v2 — corrige les 5 lignes terrain anonymes)
-- Impact: Protège l'intégrité des transactions terrain tout en
--         permettant user_id NULL pour les commandes boutique,
--         dons landing page, webhooks HelloAsso et paiements
--         terrain anonymes (carte sans session sapeur).
--
-- Contexte:
--   - 006: user_id NOT NULL (original)
--   - 20251202: ALTER COLUMN user_id DROP NOT NULL (pour commande boutique)
--   - Résultat: user_id nullable sans garde-fou → risque pour les
--     transactions terrain qui DOIVENT avoir un user_id
--   - 5 transactions terrain existantes n'ont ni user_id ni tournee_id
--     (paiements carte QR sans session sapeur) → reclassées en
--     'terrain_anonymous' avant la pose de la contrainte.
--
-- Solution: CHECK conditionnel — user_id obligatoire sauf pour
--           les sources non-authentifiées
-- ============================================================

-- 1. Reclasser les 5 transactions terrain sans user_id ni tournee_id
--    Elles proviennent de paiements carte (QR code) sans session sapeur.
UPDATE public.support_transactions
SET    source = 'terrain_anonymous',
       updated_at = NOW()
WHERE  source = 'terrain'
  AND  user_id IS NULL
  AND  tournee_id IS NULL;

-- 2. Ajouter la contrainte conditionnelle
ALTER TABLE public.support_transactions
  ADD CONSTRAINT check_user_id_required_for_terrain
  CHECK (
    -- Sources non-terrain : user_id peut être NULL
    source IN (
      'boutique',
      'landing_page_donation',
      'landing_page',
      'helloasso',
      'terrain_anonymous'
    )
    OR
    -- Source terrain (ou NULL/défaut) : user_id OBLIGATOIRE
    user_id IS NOT NULL
  );

-- 3. Vérification post-contrainte
DO $$
DECLARE
  v_updated INTEGER;
  v_remaining INTEGER;
BEGIN
  GET DIAGNOSTICS v_updated = ROW_COUNT;   -- lignes affectées par l'UPDATE

  SELECT COUNT(*) INTO v_remaining
  FROM public.support_transactions
  WHERE user_id IS NULL
    AND source NOT IN (
          'boutique','landing_page_donation','landing_page',
          'helloasso','terrain_anonymous');

  RAISE NOTICE 'terrain_anonymous reclassées: %, violations restantes: %',
               v_updated, v_remaining;
END $$;

COMMENT ON CONSTRAINT check_user_id_required_for_terrain
  ON public.support_transactions IS
  'user_id obligatoire pour les transactions terrain. NULL autorisé pour boutique/landing_page/helloasso/terrain_anonymous.';
