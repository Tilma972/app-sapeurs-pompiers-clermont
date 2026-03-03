-- =====================================================
-- BACKFILL - Générer les reçus fiscaux manquants
-- =====================================================
-- Ce script identifie toutes les transactions éligibles qui n'ont pas encore
-- reçu de reçu fiscal PDF et envoie les webhooks correspondants à n8n.
--
-- ATTENTION : Ce script doit être exécuté APRÈS avoir appliqué les migrations :
-- - 20251130_fix_n8n_trigger_use_pg_net.sql
-- - 20251130_fix_n8n_trigger_calendar_filter.sql
--
-- PRÉREQUIS :
-- - Extension pg_net activée
-- - URL webhook n8n configurée
-- - Workflow n8n actif

-- =====================================================
-- 1. FONCTION POUR RETRAITER UNE TRANSACTION
-- =====================================================
-- Cette fonction envoie manuellement le webhook n8n pour une transaction donnée
-- Elle reproduit exactement la logique du trigger, mais peut être appelée manuellement

CREATE OR REPLACE FUNCTION backfill_send_receipt_webhook(p_transaction_id UUID)
RETURNS TABLE(
  transaction_id UUID,
  status TEXT,
  message TEXT,
  request_id BIGINT
) AS $$
DECLARE
  v_webhook_url TEXT;
  v_payload JSONB;
  v_request_id BIGINT;
  v_transaction RECORD;
BEGIN
  -- Récupérer l'URL du webhook
  v_webhook_url := get_n8n_webhook_url();

  IF v_webhook_url IS NULL OR v_webhook_url = '' THEN
    RETURN QUERY SELECT
      p_transaction_id,
      'skipped'::TEXT,
      'N8N_WEBHOOK_URL non configuré'::TEXT,
      NULL::BIGINT;
    RETURN;
  END IF;

  -- Récupérer les données de la transaction
  SELECT * INTO v_transaction
  FROM support_transactions
  WHERE id = p_transaction_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT
      p_transaction_id,
      'error'::TEXT,
      'Transaction introuvable'::TEXT,
      NULL::BIGINT;
    RETURN;
  END IF;

  -- Vérifier l'éligibilité (même filtre que le trigger)
  IF v_transaction.amount < 6 OR v_transaction.supporter_email IS NULL THEN
    RETURN QUERY SELECT
      p_transaction_id,
      'skipped'::TEXT,
      'Transaction non éligible (amount < 6€ ou email manquant)'::TEXT,
      NULL::BIGINT;
    RETURN;
  END IF;

  -- Construire le payload JSON (IDENTIQUE au trigger)
  v_payload := jsonb_build_object(
    'event', 'receipt.generate',
    'transaction_id', v_transaction.id,
    'receipt_number', v_transaction.receipt_number,
    'amount', v_transaction.amount,
    'payment_method', v_transaction.payment_method,
    'calendar_accepted', v_transaction.calendar_accepted,
    'calendar_value', 1.33,
    'created_at', v_transaction.created_at,
    'donor', jsonb_build_object(
      'email', v_transaction.supporter_email,
      'name', v_transaction.supporter_name,
      'first_name', v_transaction.donor_first_name,
      'last_name', v_transaction.donor_last_name,
      'address', v_transaction.donor_address,
      'zip', v_transaction.donor_zip,
      'city', v_transaction.donor_city
    ),
    'receipt_url', v_transaction.receipt_url,
    'user_id', v_transaction.user_id,
    'tournee_id', v_transaction.tournee_id,
    'deductible_amount', CASE
      WHEN v_transaction.calendar_accepted = true THEN v_transaction.amount - 1.33
      ELSE v_transaction.amount
    END,
    'tax_reduction', CASE
      WHEN v_transaction.calendar_accepted = true THEN ROUND((v_transaction.amount - 1.33) * 0.66, 2)
      ELSE ROUND(v_transaction.amount * 0.66, 2)
    END,
    'backfill', true  -- Flag pour indiquer que c'est un rattrapage
  );

  -- Envoyer le webhook via pg_net
  BEGIN
    SELECT net.http_post(
      url := v_webhook_url,
      body := v_payload,
      headers := '{"Content-Type": "application/json"}'::jsonb
    ) INTO v_request_id;

    -- Logger dans webhook_logs
    INSERT INTO webhook_logs (source, event_type, payload, status)
    VALUES ('backfill_manual', 'receipt.generate', v_payload, 'sent');

    RETURN QUERY SELECT
      p_transaction_id,
      'sent'::TEXT,
      format('Webhook envoyé (request_id: %s)', v_request_id)::TEXT,
      v_request_id;

  EXCEPTION WHEN OTHERS THEN
    -- Logger l'erreur
    INSERT INTO webhook_logs (source, event_type, payload, status, error_message)
    VALUES ('backfill_manual', 'receipt.generate', v_payload, 'error', SQLERRM);

    RETURN QUERY SELECT
      p_transaction_id,
      'error'::TEXT,
      format('Erreur: %s', SQLERRM)::TEXT,
      NULL::BIGINT;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION backfill_send_receipt_webhook(UUID) IS 'Envoie manuellement le webhook n8n pour une transaction existante (rattrapage). Utile pour traiter les transactions antérieures à l''activation du trigger.';


-- =====================================================
-- 2. FONCTION POUR RETRAITER TOUTES LES TRANSACTIONS MANQUANTES
-- =====================================================

CREATE OR REPLACE FUNCTION backfill_all_missing_receipts()
RETURNS TABLE(
  total_eligible INTEGER,
  total_sent INTEGER,
  total_skipped INTEGER,
  total_errors INTEGER,
  details JSONB
) AS $$
DECLARE
  v_transaction_id UUID;
  v_result RECORD;
  v_total_eligible INTEGER := 0;
  v_total_sent INTEGER := 0;
  v_total_skipped INTEGER := 0;
  v_total_errors INTEGER := 0;
  v_details JSONB := '[]'::jsonb;
BEGIN
  RAISE NOTICE '=== BACKFILL - Génération des reçus fiscaux manquants ===';

  -- Parcourir toutes les transactions éligibles
  FOR v_transaction_id IN (
    SELECT id
    FROM support_transactions
    WHERE amount >= 6
      AND supporter_email IS NOT NULL
      -- Optionnel : filtrer uniquement celles sans reçu généré
      -- AND (receipt_generated IS NULL OR receipt_sent IS NULL)
    ORDER BY created_at ASC  -- Traiter les plus anciennes en premier
  ) LOOP
    v_total_eligible := v_total_eligible + 1;

    -- Envoyer le webhook pour cette transaction
    SELECT * INTO v_result
    FROM backfill_send_receipt_webhook(v_transaction_id);

    -- Compter les résultats
    IF v_result.status = 'sent' THEN
      v_total_sent := v_total_sent + 1;
      RAISE NOTICE '[%/%] ✅ Envoyé - Transaction %', v_total_eligible, v_total_eligible, v_transaction_id;
    ELSIF v_result.status = 'skipped' THEN
      v_total_skipped := v_total_skipped + 1;
      RAISE NOTICE '[%/%] ⏭️  Ignoré - Transaction % : %', v_total_eligible, v_total_eligible, v_transaction_id, v_result.message;
    ELSE
      v_total_errors := v_total_errors + 1;
      RAISE WARNING '[%/%] ❌ Erreur - Transaction % : %', v_total_eligible, v_total_eligible, v_transaction_id, v_result.message;
    END IF;

    -- Ajouter aux détails
    v_details := v_details || jsonb_build_object(
      'transaction_id', v_transaction_id,
      'status', v_result.status,
      'message', v_result.message,
      'request_id', v_result.request_id
    );

    -- Pause de 100ms entre chaque requête pour ne pas surcharger n8n
    PERFORM pg_sleep(0.1);
  END LOOP;

  RAISE NOTICE '=== RÉSUMÉ ===';
  RAISE NOTICE 'Total éligible : %', v_total_eligible;
  RAISE NOTICE 'Envoyés avec succès : %', v_total_sent;
  RAISE NOTICE 'Ignorés : %', v_total_skipped;
  RAISE NOTICE 'Erreurs : %', v_total_errors;

  RETURN QUERY SELECT
    v_total_eligible,
    v_total_sent,
    v_total_skipped,
    v_total_errors,
    v_details;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION backfill_all_missing_receipts() IS 'Traite en masse toutes les transactions éligibles pour envoyer les webhooks n8n manquants. Inclut une pause de 100ms entre chaque requête.';


-- =====================================================
-- 3. REQUÊTES D'ANALYSE AVANT LE BACKFILL
-- =====================================================

-- 3.1. Combien de transactions éligibles au total ?
SELECT
  COUNT(*) as total_transactions_eligibles,
  SUM(amount) as montant_total,
  MIN(created_at) as premiere_transaction,
  MAX(created_at) as derniere_transaction
FROM support_transactions
WHERE amount >= 6
  AND supporter_email IS NOT NULL;


-- 3.2. Combien ont déjà un reçu généré (via webhook Stripe ou autre) ?
SELECT
  COUNT(*) as transactions_avec_recu,
  COUNT(*) FILTER (WHERE calendar_accepted = false) as dons_purs,
  COUNT(*) FILTER (WHERE calendar_accepted = true) as dons_avec_calendrier
FROM support_transactions
WHERE amount >= 6
  AND supporter_email IS NOT NULL
  AND receipt_generated IS NOT NULL;


-- 3.3. Combien n'ont PAS de reçu généré ?
SELECT
  COUNT(*) as transactions_sans_recu,
  SUM(amount) as montant_total,
  COUNT(*) FILTER (WHERE calendar_accepted = false) as dons_purs,
  COUNT(*) FILTER (WHERE calendar_accepted = true) as dons_avec_calendrier
FROM support_transactions
WHERE amount >= 6
  AND supporter_email IS NOT NULL
  AND receipt_generated IS NULL;


-- 3.4. Liste détaillée des 10 premières transactions sans reçu
SELECT
  id,
  amount,
  calendar_accepted,
  supporter_email,
  supporter_name,
  payment_method,
  receipt_generated,
  receipt_sent,
  created_at,
  CASE
    WHEN calendar_accepted = false THEN amount * 0.66
    ELSE (amount - 1.33) * 0.66
  END as reduction_impot_attendue
FROM support_transactions
WHERE amount >= 6
  AND supporter_email IS NOT NULL
  AND receipt_generated IS NULL
ORDER BY created_at ASC
LIMIT 10;


-- =====================================================
-- 4. EXEMPLES D'UTILISATION
-- =====================================================

-- EXEMPLE 1 : Tester sur une seule transaction
-- Remplacer <UUID> par l'ID d'une transaction réelle
/*
SELECT * FROM backfill_send_receipt_webhook('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
*/


-- EXEMPLE 2 : Tester sur les 5 premières transactions sans reçu
/*
DO $$
DECLARE
  v_tx_id UUID;
BEGIN
  FOR v_tx_id IN (
    SELECT id FROM support_transactions
    WHERE amount >= 6
      AND supporter_email IS NOT NULL
      AND receipt_generated IS NULL
    ORDER BY created_at ASC
    LIMIT 5
  ) LOOP
    PERFORM backfill_send_receipt_webhook(v_tx_id);
    PERFORM pg_sleep(0.2);  -- Pause de 200ms entre chaque
  END LOOP;
END $$;
*/


-- EXEMPLE 3 : Traiter TOUTES les transactions manquantes
-- ⚠️ ATTENTION : Cela peut prendre du temps si vous avez beaucoup de transactions
/*
SELECT * FROM backfill_all_missing_receipts();
*/


-- EXEMPLE 4 : Traiter uniquement les dons avec calendrier (si webhook Stripe les avait exclus)
/*
DO $$
DECLARE
  v_tx_id UUID;
  v_count INTEGER := 0;
BEGIN
  FOR v_tx_id IN (
    SELECT id FROM support_transactions
    WHERE amount >= 6
      AND supporter_email IS NOT NULL
      AND calendar_accepted = true  -- Uniquement les dons avec calendrier
      AND receipt_generated IS NULL
    ORDER BY created_at ASC
  ) LOOP
    PERFORM backfill_send_receipt_webhook(v_tx_id);
    v_count := v_count + 1;
    RAISE NOTICE 'Traité % transactions', v_count;
    PERFORM pg_sleep(0.1);
  END LOOP;
  RAISE NOTICE 'TERMINÉ - % transactions traitées', v_count;
END $$;
*/


-- =====================================================
-- 5. VÉRIFICATION APRÈS LE BACKFILL
-- =====================================================

-- 5.1. Vérifier les webhooks envoyés lors du backfill
SELECT
  id,
  source,
  event_type,
  status,
  error_message,
  payload->>'transaction_id' as transaction_id,
  payload->'donor'->>'email' as donor_email,
  payload->>'amount' as amount,
  created_at
FROM webhook_logs
WHERE source = 'backfill_manual'
ORDER BY created_at DESC
LIMIT 20;


-- 5.2. Taux de succès du backfill
SELECT
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM webhook_logs
WHERE source = 'backfill_manual'
GROUP BY status;


-- 5.3. Transactions qui ont échoué lors du backfill
SELECT
  wl.payload->>'transaction_id' as transaction_id,
  wl.error_message,
  st.amount,
  st.supporter_email,
  st.created_at
FROM webhook_logs wl
JOIN support_transactions st ON st.id::text = wl.payload->>'transaction_id'
WHERE wl.source = 'backfill_manual'
  AND wl.status = 'error'
ORDER BY wl.created_at DESC;


-- =====================================================
-- 6. NETTOYAGE (OPTIONNEL)
-- =====================================================

-- Si vous voulez supprimer les fonctions de backfill après utilisation
/*
DROP FUNCTION IF EXISTS backfill_send_receipt_webhook(UUID);
DROP FUNCTION IF EXISTS backfill_all_missing_receipts();
*/
