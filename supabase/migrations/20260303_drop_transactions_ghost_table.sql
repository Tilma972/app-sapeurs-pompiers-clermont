-- ============================================================
-- Migration: Suppression table transactions (table fantôme)
-- Date: 2026-03-03
-- PRÉREQUIS AVANT D'APPLIQUER:
--   ✅ Vérifier que SELECT COUNT(*) FROM public.transactions; → 0
--   ✅ Vérifier que update_tournee_stats() ne lit plus depuis transactions
--   ✅ Vérifier qu'aucun code applicatif ne requête la table transactions
--      (grep -r "from.*transactions" lib/ app/ --include="*.ts")
-- Contexte: La table transactions (004) a été supersédée par
--           support_transactions (006) mais n'a jamais été droppée.
--           Elle contient un trigger update_tournee_stats() qui lit
--           depuis l'ancienne table, en conflit avec le nouveau trigger.
-- ============================================================

-- Garde-fou: refuser si la table a des données
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.transactions;
  IF v_count > 0 THEN
    RAISE EXCEPTION
      'ARRÊT: La table transactions contient % ligne(s). '
      'Migrer les données vers support_transactions avant de continuer.',
      v_count;
  END IF;
  RAISE NOTICE 'Vérification OK: transactions est vide (% lignes)', v_count;
END $$;

-- Supprimer le trigger qui lit depuis la vieille table
-- (la fonction update_tournee_stats est redéfinie plus tard pour support_transactions)
DROP TRIGGER IF EXISTS transactions_update_tournee_stats ON public.transactions;
DROP TRIGGER IF EXISTS transactions_updated_at ON public.transactions;

-- Supprimer la table fantôme et tout ce qui en dépend
DROP TABLE IF EXISTS public.transactions CASCADE;

-- Nettoyer la fonction get_tournee_detailed_stats qui joinait transactions
-- (elle est maintenant orpheline ou doit être réécrite pour support_transactions)
DROP FUNCTION IF EXISTS public.get_tournee_detailed_stats(UUID);

-- Recréer get_tournee_detailed_stats pour support_transactions
CREATE OR REPLACE FUNCTION public.get_tournee_detailed_stats(tournee_uuid UUID)
RETURNS TABLE (
  tournee_id          UUID,
  zone                TEXT,
  statut              TEXT,
  date_debut          TIMESTAMPTZ,
  date_fin            TIMESTAMPTZ,
  calendriers_alloues INTEGER,
  calendriers_distribues INTEGER,
  montant_collecte    DECIMAL(10,2),
  nombre_transactions INTEGER,
  montant_especes     DECIMAL(10,2),
  montant_cheques     DECIMAL(10,2),
  montant_cartes      DECIMAL(10,2)
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
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
    COALESCE(COUNT(st.id), 0)::INTEGER,
    COALESCE(SUM(CASE WHEN st.payment_method = 'especes' THEN st.amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN st.payment_method = 'cheque'  THEN st.amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN st.payment_method = 'carte'   THEN st.amount ELSE 0 END), 0)
  FROM public.tournees t
  LEFT JOIN public.support_transactions st ON st.tournee_id = t.id
  WHERE t.id = tournee_uuid
  GROUP BY t.id, t.zone, t.statut, t.date_debut, t.date_fin,
           t.calendriers_alloues, t.calendriers_distribues, t.montant_collecte;
END;
$$;

COMMENT ON FUNCTION public.get_tournee_detailed_stats(UUID) IS
  'Statistiques détaillées d''une tournée depuis support_transactions. '
  'Réécriture de la version 004 qui lisait depuis la table transactions (supprimée).';

RAISE NOTICE '✅ Table transactions (fantôme depuis 006) supprimée avec succès.';
RAISE NOTICE '✅ get_tournee_detailed_stats réécrite pour support_transactions.';
