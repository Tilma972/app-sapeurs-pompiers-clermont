-- Migration: Fix n8n trigger to use pg_net instead of http extension
-- Date: 2025-11-30
-- Description: Replace http extension with pg_net (Supabase-compatible) for webhook trigger
-- Issue: Extension "http" is not available in Supabase hosted, causing silent failures

-- =====================================================
-- 1. ENABLE PG_NET EXTENSION
-- =====================================================
-- pg_net is the Supabase-approved extension for HTTP requests
-- It's asynchronous and non-blocking, which is better for triggers
CREATE EXTENSION IF NOT EXISTS pg_net;

-- =====================================================
-- 2. UPDATE TRIGGER FUNCTION TO USE PG_NET
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_n8n_pdf_generation()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT;
  payload JSONB;
  request_id BIGINT;
BEGIN
  -- Get webhook URL from n8n_settings
  webhook_url := get_n8n_webhook_url();

  -- If webhook not configured, log and skip
  IF webhook_url IS NULL OR webhook_url = '' THEN
    RAISE NOTICE 'N8N_WEBHOOK_URL non configuré, skip génération PDF pour transaction %', NEW.id;
    RETURN NEW;
  END IF;

  -- IMPORTANT FILTER: Only process tax-deductible donations >= 6€
  -- calendar_accepted = false → Tax-deductible donation (no calendar given)
  -- calendar_accepted = true → Support with calendar (NOT eligible for tax receipt)
  IF NEW.amount < 6 OR NEW.supporter_email IS NULL OR NEW.calendar_accepted = true THEN
    RETURN NEW;
  END IF;

  -- Build JSON payload with all donor information
  payload := jsonb_build_object(
    'event', 'receipt.generate',
    'transaction_id', NEW.id,
    'receipt_number', NEW.receipt_number,
    'amount', NEW.amount,
    'payment_method', NEW.payment_method,
    'calendar_accepted', NEW.calendar_accepted,
    'created_at', NEW.created_at,
    'donor', jsonb_build_object(
      'email', NEW.supporter_email,
      'name', NEW.supporter_name,
      'first_name', NEW.donor_first_name,
      'last_name', NEW.donor_last_name,
      'address', NEW.donor_address,
      'zip', NEW.donor_zip,
      'city', NEW.donor_city
    ),
    'receipt_url', NEW.receipt_url,
    'user_id', NEW.user_id,
    'tournee_id', NEW.tournee_id
  );

  -- Send POST request via pg_net (asynchronous, non-blocking)
  BEGIN
    SELECT net.http_post(
      url := webhook_url,
      body := payload,
      headers := '{"Content-Type": "application/json"}'::jsonb
    ) INTO request_id;

    RAISE NOTICE 'Webhook n8n envoyé (pg_net request_id: %) pour transaction %', request_id, NEW.id;

    -- Log the request in webhook_logs for observability
    INSERT INTO webhook_logs (source, event_type, payload, status)
    VALUES ('pg_net_trigger', 'receipt.generate', payload, 'sent');

  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't block the transaction insertion
    RAISE WARNING 'Erreur lors de l''envoi webhook n8n pour transaction %: %', NEW.id, SQLERRM;

    -- Log error in webhook_logs
    INSERT INTO webhook_logs (source, event_type, payload, status, error_message)
    VALUES ('pg_net_trigger', 'receipt.generate', payload, 'error', SQLERRM);
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION trigger_n8n_pdf_generation() IS 'Envoie un webhook POST asynchrone vers n8n via pg_net pour générer le PDF du reçu fiscal via Gotenberg. Filtre: amount >= 6€ AND calendar_accepted = false (don fiscal uniquement)';

-- =====================================================
-- 3. VERIFY TRIGGER IS STILL ACTIVE
-- =====================================================
-- The trigger should already exist from migration 20251111_webhook_trigger_n8n_pdf.sql
-- This just ensures it's still active
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'support_transactions_n8n_webhook_trigger'
  ) THEN
    -- Recreate trigger if it was accidentally dropped
    CREATE TRIGGER support_transactions_n8n_webhook_trigger
      AFTER INSERT ON support_transactions
      FOR EACH ROW
      EXECUTE FUNCTION trigger_n8n_pdf_generation();
    RAISE NOTICE 'Trigger support_transactions_n8n_webhook_trigger recréé';
  ELSE
    RAISE NOTICE 'Trigger support_transactions_n8n_webhook_trigger déjà existant';
  END IF;
END $$;

-- =====================================================
-- 4. CONFIGURATION HELPER
-- =====================================================
-- After running this migration, configure the webhook URL:
-- SELECT set_n8n_webhook_url('https://n8n.dsolution-ia.fr/webhook/receipt-pdf');

-- =====================================================
-- 5. MONITORING QUERIES
-- =====================================================
-- View recent webhook requests
-- SELECT id, source, event_type, status, error_message, created_at
-- FROM webhook_logs
-- WHERE source = 'pg_net_trigger'
-- ORDER BY created_at DESC
-- LIMIT 20;

-- View success/error rate
-- SELECT
--   status,
--   COUNT(*) as count,
--   ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
-- FROM webhook_logs
-- WHERE source = 'pg_net_trigger' AND event_type = 'receipt.generate'
-- GROUP BY status;
