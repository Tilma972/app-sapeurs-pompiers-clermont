-- =====================================================
-- DIAGNOSTIC COMPLET - Trigger n8n pour reçus fiscaux
-- =====================================================
-- Ce script vérifie pourquoi le trigger PostgreSQL n'envoie pas de requêtes HTTP au webhook n8n
-- Safe to run multiple times. This is a diagnostic script only.

DO $$
DECLARE
  v_exists BOOLEAN;
  v_count INTEGER;
  v_webhook_url TEXT;
  r RECORD;
BEGIN
  RAISE NOTICE '======================================';
  RAISE NOTICE '  AUDIT - Trigger n8n PDF Generation';
  RAISE NOTICE '======================================';
  RAISE NOTICE '';

  -- =====================================================
  -- 1. EXTENSION HTTP
  -- =====================================================
  RAISE NOTICE '[1] EXTENSION HTTP';
  RAISE NOTICE '--------------------';

  SELECT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'http'
  ) INTO v_exists;

  IF v_exists THEN
    RAISE NOTICE '✅ Extension "http" : INSTALLÉE';
  ELSE
    RAISE NOTICE '❌ Extension "http" : NON INSTALLÉE';
    RAISE NOTICE '   → Supabase hosted n''autorise PAS l''extension "http"';
    RAISE NOTICE '   → Alternative : utiliser pg_net ou Edge Functions';
  END IF;

  -- Vérifier aussi pg_net (alternative Supabase)
  SELECT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_net'
  ) INTO v_exists;

  IF v_exists THEN
    RAISE NOTICE '✅ Extension "pg_net" : INSTALLÉE (alternative Supabase)';
  ELSE
    RAISE NOTICE '⚠️  Extension "pg_net" : NON INSTALLÉE';
  END IF;

  RAISE NOTICE '';

  -- =====================================================
  -- 2. CONFIGURATION WEBHOOK N8N
  -- =====================================================
  RAISE NOTICE '[2] CONFIGURATION WEBHOOK N8N';
  RAISE NOTICE '------------------------------';

  -- Vérifier table n8n_settings
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'n8n_settings'
  ) INTO v_exists;

  IF v_exists THEN
    RAISE NOTICE '✅ Table "n8n_settings" : EXISTE';

    -- Récupérer l'URL du webhook
    SELECT value INTO v_webhook_url
    FROM n8n_settings
    WHERE key = 'n8n_webhook_url';

    IF v_webhook_url IS NOT NULL AND v_webhook_url != '' THEN
      RAISE NOTICE '✅ URL webhook configurée : %', v_webhook_url;

      IF v_webhook_url = 'https://n8n.dsolution-ia.fr/webhook/receipt-pdf' THEN
        RAISE NOTICE '✅ URL correspond à l''endpoint attendu';
      ELSE
        RAISE NOTICE '⚠️  URL différente de l''endpoint attendu';
        RAISE NOTICE '   Attendu : https://n8n.dsolution-ia.fr/webhook/receipt-pdf';
        RAISE NOTICE '   Actuel  : %', v_webhook_url;
      END IF;
    ELSE
      RAISE NOTICE '❌ URL webhook : NON CONFIGURÉE';
      RAISE NOTICE '   → Exécuter : SELECT set_n8n_webhook_url(''https://n8n.dsolution-ia.fr/webhook/receipt-pdf'');';
    END IF;
  ELSE
    RAISE NOTICE '❌ Table "n8n_settings" : N''EXISTE PAS';
    RAISE NOTICE '   → Migration 20251124_fix_n8n_webhook_settings.sql pas appliquée ?';
  END IF;

  RAISE NOTICE '';

  -- =====================================================
  -- 3. TRIGGER POSTGRESQL
  -- =====================================================
  RAISE NOTICE '[3] TRIGGER POSTGRESQL';
  RAISE NOTICE '----------------------';

  -- Vérifier que le trigger existe
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'support_transactions_n8n_webhook_trigger'
  ) INTO v_exists;

  IF v_exists THEN
    RAISE NOTICE '✅ Trigger "support_transactions_n8n_webhook_trigger" : EXISTE';

    -- Vérifier s'il est activé
    FOR r IN (
      SELECT
        tgname,
        tgrelid::regclass as table_name,
        tgenabled,
        CASE tgenabled
          WHEN 'O' THEN 'ENABLED'
          WHEN 'D' THEN 'DISABLED'
          WHEN 'R' THEN 'REPLICA ONLY'
          WHEN 'A' THEN 'ALWAYS'
          ELSE 'UNKNOWN'
        END as status_text
      FROM pg_trigger
      WHERE tgname = 'support_transactions_n8n_webhook_trigger'
    ) LOOP
      IF r.tgenabled = 'O' OR r.tgenabled = 'A' THEN
        RAISE NOTICE '✅ Trigger actif sur table : % (status: %)', r.table_name, r.status_text;
      ELSE
        RAISE NOTICE '❌ Trigger DÉSACTIVÉ sur table : % (status: %)', r.table_name, r.status_text;
      END IF;
    END LOOP;
  ELSE
    RAISE NOTICE '❌ Trigger "support_transactions_n8n_webhook_trigger" : N''EXISTE PAS';
    RAISE NOTICE '   → Migration 20251111_webhook_trigger_n8n_pdf.sql pas appliquée ?';
  END IF;

  RAISE NOTICE '';

  -- =====================================================
  -- 4. FONCTION trigger_n8n_pdf_generation()
  -- =====================================================
  RAISE NOTICE '[4] FONCTION TRIGGER';
  RAISE NOTICE '--------------------';

  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'trigger_n8n_pdf_generation'
  ) INTO v_exists;

  IF v_exists THEN
    RAISE NOTICE '✅ Fonction "trigger_n8n_pdf_generation()" : EXISTE';
  ELSE
    RAISE NOTICE '❌ Fonction "trigger_n8n_pdf_generation()" : N''EXISTE PAS';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'get_n8n_webhook_url'
  ) INTO v_exists;

  IF v_exists THEN
    RAISE NOTICE '✅ Fonction "get_n8n_webhook_url()" : EXISTE';
  ELSE
    RAISE NOTICE '❌ Fonction "get_n8n_webhook_url()" : N''EXISTE PAS';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'set_n8n_webhook_url'
  ) INTO v_exists;

  IF v_exists THEN
    RAISE NOTICE '✅ Fonction "set_n8n_webhook_url()" : EXISTE';
  ELSE
    RAISE NOTICE '❌ Fonction "set_n8n_webhook_url()" : N''EXISTE PAS';
  END IF;

  RAISE NOTICE '';

  -- =====================================================
  -- 5. ANALYSE DES TRANSACTIONS
  -- =====================================================
  RAISE NOTICE '[5] ANALYSE DES TRANSACTIONS';
  RAISE NOTICE '-----------------------------';

  -- Transactions totales
  SELECT COUNT(*) INTO v_count FROM support_transactions;
  RAISE NOTICE 'Transactions totales : %', v_count;

  -- Transactions éligibles au reçu fiscal (amount >= 6€ AND calendar_accepted = false)
  SELECT COUNT(*) INTO v_count
  FROM support_transactions
  WHERE amount >= 6 AND calendar_accepted = false;
  RAISE NOTICE 'Transactions éligibles reçu fiscal (amount >= 6€ AND calendar_accepted = false) : %', v_count;

  -- Transactions avec email valide
  SELECT COUNT(*) INTO v_count
  FROM support_transactions
  WHERE amount >= 6
    AND calendar_accepted = false
    AND supporter_email IS NOT NULL
    AND supporter_email != '';
  RAISE NOTICE 'Transactions éligibles avec email valide : %', v_count;

  -- Transactions avec reçu généré
  SELECT COUNT(*) INTO v_count
  FROM support_transactions
  WHERE amount >= 6
    AND calendar_accepted = false
    AND receipt_generated IS NOT NULL;
  RAISE NOTICE 'Transactions avec receipt_generated (via webhook Stripe) : %', v_count;

  RAISE NOTICE '';

  -- Dernières transactions éligibles
  RAISE NOTICE 'Dernières 5 transactions éligibles au trigger n8n :';
  FOR r IN (
    SELECT
      id,
      amount,
      calendar_accepted,
      supporter_email,
      receipt_generated,
      receipt_sent,
      receipt_url,
      created_at
    FROM support_transactions
    WHERE amount >= 6
      AND supporter_email IS NOT NULL
      AND supporter_email != ''
    ORDER BY created_at DESC
    LIMIT 5
  ) LOOP
    RAISE NOTICE '  - ID: % | Montant: %€ | calendar_accepted: % | Email: % | Receipt gen: % | Created: %',
      r.id, r.amount, r.calendar_accepted, r.supporter_email, r.receipt_generated, r.created_at;
  END LOOP;

  RAISE NOTICE '';

  -- =====================================================
  -- 6. CONFLIT AVEC WEBHOOK STRIPE
  -- =====================================================
  RAISE NOTICE '[6] CONFLIT DOUBLE GÉNÉRATION';
  RAISE NOTICE '------------------------------';
  RAISE NOTICE '⚠️  PROBLÈME DÉTECTÉ : Deux systèmes concurrents de génération de reçus fiscaux';
  RAISE NOTICE '';
  RAISE NOTICE 'Système 1 (actuel) : Webhook Stripe app/api/webhooks/stripe/route.ts';
  RAISE NOTICE '  → Appelle issue_receipt() directement après insertion';
  RAISE NOTICE '  → Envoie l''email avec le reçu via Resend';
  RAISE NOTICE '  → Met à jour receipt_generated, receipt_url, receipt_sent';
  RAISE NOTICE '';
  RAISE NOTICE 'Système 2 (prévu) : Trigger PostgreSQL → n8n → Gotenberg';
  RAISE NOTICE '  → Trigger PostgreSQL détecte INSERT sur support_transactions';
  RAISE NOTICE '  → Envoie payload JSON au webhook n8n';
  RAISE NOTICE '  → n8n génère le PDF via Gotenberg';
  RAISE NOTICE '  → n8n envoie l''email avec le PDF';
  RAISE NOTICE '';
  RAISE NOTICE 'RECOMMANDATION :';
  RAISE NOTICE '  1. Choisir UN SEUL système de génération de reçus';
  RAISE NOTICE '  2. Si n8n/Gotenberg : désactiver issue_receipt() dans webhook Stripe';
  RAISE NOTICE '  3. Si webhook Stripe : désactiver le trigger n8n PostgreSQL';

  RAISE NOTICE '';
  RAISE NOTICE '======================================';
  RAISE NOTICE '  FIN DU DIAGNOSTIC';
  RAISE NOTICE '======================================';
END $$;

-- =====================================================
-- REQUÊTES ADDITIONNELLES POUR ANALYSE MANUELLE
-- =====================================================

-- Lister toutes les extensions disponibles
SELECT
  extname,
  extversion,
  CASE
    WHEN extname IN ('http', 'pg_net') THEN '✅ Extension HTTP'
    ELSE ''
  END as note
FROM pg_extension
ORDER BY extname;

-- Lister tous les triggers sur support_transactions
SELECT
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled,
  CASE tgenabled
    WHEN 'O' THEN 'ENABLED'
    WHEN 'D' THEN 'DISABLED'
    WHEN 'R' THEN 'REPLICA ONLY'
    WHEN 'A' THEN 'ALWAYS'
    ELSE 'UNKNOWN'
  END as status
FROM pg_trigger
WHERE tgrelid = 'support_transactions'::regclass
ORDER BY tgname;

-- Configuration n8n
SELECT * FROM n8n_settings WHERE key = 'n8n_webhook_url';
