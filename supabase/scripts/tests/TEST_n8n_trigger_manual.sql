-- =====================================================
-- TEST MANUEL - Trigger n8n pour reçus fiscaux
-- =====================================================
-- Ce script permet de tester manuellement le trigger PostgreSQL
-- en insérant une transaction de test et en observant les logs
--
-- PRÉREQUIS :
-- 1. Migration 20251130_fix_n8n_trigger_use_pg_net.sql appliquée
-- 2. Extension pg_net activée
-- 3. URL du webhook n8n configurée
-- 4. Workflow n8n actif et prêt à recevoir des requêtes

-- =====================================================
-- ÉTAPE 1 : VÉRIFICATIONS PRÉALABLES
-- =====================================================

-- 1.1. Vérifier que l'extension pg_net est installée
SELECT
  extname,
  extversion,
  CASE
    WHEN extname = 'pg_net' THEN '✅ Extension pg_net installée'
    ELSE ''
  END as status
FROM pg_extension
WHERE extname = 'pg_net';

-- Si pg_net n'est pas installé, arrêter ici et exécuter :
-- CREATE EXTENSION IF NOT EXISTS pg_net;


-- 1.2. Configurer l'URL du webhook n8n (si pas déjà fait)
SELECT set_n8n_webhook_url('https://n8n.dsolution-ia.fr/webhook/receipt-pdf');

-- 1.3. Vérifier que l'URL est bien configurée
SELECT
  key,
  value as webhook_url,
  updated_at,
  CASE
    WHEN value = 'https://n8n.dsolution-ia.fr/webhook/receipt-pdf' THEN '✅ URL correcte'
    WHEN value IS NULL OR value = '' THEN '❌ URL non configurée'
    ELSE '⚠️  URL différente de l''attendu'
  END as status
FROM n8n_settings
WHERE key = 'n8n_webhook_url';


-- 1.4. Vérifier que le trigger existe et est actif
SELECT
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled,
  CASE tgenabled
    WHEN 'O' THEN '✅ ENABLED'
    WHEN 'D' THEN '❌ DISABLED'
    WHEN 'R' THEN 'REPLICA ONLY'
    WHEN 'A' THEN 'ALWAYS'
    ELSE 'UNKNOWN'
  END as status
FROM pg_trigger
WHERE tgname = 'support_transactions_n8n_webhook_trigger';


-- 1.5. Vérifier que la fonction trigger existe
SELECT
  proname as function_name,
  CASE
    WHEN proname = 'trigger_n8n_pdf_generation' THEN '✅ Fonction trigger existe'
    ELSE ''
  END as status
FROM pg_proc
WHERE proname = 'trigger_n8n_pdf_generation';


-- 1.6. Vérifier que la table webhook_logs existe
SELECT
  table_name,
  CASE
    WHEN table_name = 'webhook_logs' THEN '✅ Table webhook_logs existe'
    ELSE ''
  END as status
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'webhook_logs';


-- =====================================================
-- ÉTAPE 2 : INSÉRER UNE TRANSACTION DE TEST
-- =====================================================

-- 2.1. Transaction de test - Don fiscal >= 6€ (DEVRAIT DÉCLENCHER LE TRIGGER)
-- IMPORTANT : Remplacez les UUID par des valeurs valides de votre base

DO $$
DECLARE
  v_user_id UUID;
  v_tournee_id UUID;
  v_transaction_id UUID;
BEGIN
  -- Récupérer un user_id et tournee_id valides
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  SELECT id INTO v_tournee_id FROM tournees LIMIT 1;

  -- Insérer la transaction de test
  INSERT INTO support_transactions (
    user_id,
    tournee_id,
    amount,
    calendar_accepted,
    payment_method,
    payment_status,
    supporter_email,
    supporter_name,
    notes
  ) VALUES (
    v_user_id,
    v_tournee_id,
    10.00,                                -- amount >= 6€ (ÉLIGIBLE)
    false,                                -- calendar_accepted = false (DON FISCAL)
    'carte',
    'completed',
    'test-trigger-n8n@example.com',       -- Email valide
    'Jean Test Trigger',
    'TEST MANUEL - Trigger n8n (don fiscal)'
  ) RETURNING id INTO v_transaction_id;

  RAISE NOTICE '✅ Transaction de test insérée : %', v_transaction_id;
  RAISE NOTICE '   Montant : 10.00€';
  RAISE NOTICE '   calendar_accepted : false (don fiscal)';
  RAISE NOTICE '   Email : test-trigger-n8n@example.com';
  RAISE NOTICE '   ⏳ Le trigger devrait avoir envoyé un webhook à n8n...';
END $$;


-- 2.2. Transaction de test - Soutien avec calendrier (NE DEVRAIT PAS DÉCLENCHER LE TRIGGER)
DO $$
DECLARE
  v_user_id UUID;
  v_tournee_id UUID;
  v_transaction_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  SELECT id INTO v_tournee_id FROM tournees LIMIT 1;

  INSERT INTO support_transactions (
    user_id,
    tournee_id,
    amount,
    calendar_accepted,
    payment_method,
    payment_status,
    supporter_email,
    supporter_name,
    notes
  ) VALUES (
    v_user_id,
    v_tournee_id,
    10.00,                                -- amount >= 6€
    true,                                 -- calendar_accepted = true (SOUTIEN AVEC CALENDRIER)
    'carte',
    'completed',
    'test-no-trigger@example.com',        -- Email valide
    'Marie Test NoTrigger',
    'TEST MANUEL - Soutien avec calendrier (PAS de trigger)'
  ) RETURNING id INTO v_transaction_id;

  RAISE NOTICE '✅ Transaction de test insérée : %', v_transaction_id;
  RAISE NOTICE '   Montant : 10.00€';
  RAISE NOTICE '   calendar_accepted : true (soutien avec calendrier)';
  RAISE NOTICE '   Email : test-no-trigger@example.com';
  RAISE NOTICE '   ⛔ Le trigger NE DEVRAIT PAS envoyer de webhook (filtre calendar_accepted)';
END $$;


-- =====================================================
-- ÉTAPE 3 : VÉRIFIER LES RÉSULTATS
-- =====================================================

-- 3.1. Vérifier les transactions de test insérées
SELECT
  id,
  amount,
  calendar_accepted,
  supporter_email,
  supporter_name,
  receipt_generated,
  receipt_sent,
  receipt_url,
  notes,
  created_at
FROM support_transactions
WHERE supporter_email IN ('test-trigger-n8n@example.com', 'test-no-trigger@example.com')
ORDER BY created_at DESC;


-- 3.2. Vérifier les logs du trigger dans webhook_logs
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
WHERE source = 'pg_net_trigger'
  AND event_type = 'receipt.generate'
ORDER BY created_at DESC
LIMIT 10;

-- RÉSULTAT ATTENDU :
-- ✅ Vous devriez voir 1 ligne avec status = 'sent' pour l'email test-trigger-n8n@example.com
-- ⛔ Vous NE devriez PAS voir de ligne pour test-no-trigger@example.com (filtre calendar_accepted)


-- 3.3. Vérifier si un reçu a été créé dans la table receipts
-- (Si le webhook Stripe a aussi généré un reçu via issue_receipt)
SELECT
  r.id,
  r.receipt_number,
  r.fiscal_year,
  r.sequence_number,
  r.receipt_type,
  r.status,
  r.created_at,
  st.supporter_email
FROM receipts r
JOIN support_transactions st ON st.id = r.transaction_id
WHERE st.supporter_email IN ('test-trigger-n8n@example.com', 'test-no-trigger@example.com')
ORDER BY r.created_at DESC;


-- 3.4. Vérifier les requêtes HTTP envoyées par pg_net
-- (Table interne de pg_net pour monitoring)
SELECT
  id,
  url,
  created_at,
  CASE
    WHEN url LIKE '%n8n.dsolution-ia.fr%' THEN '✅ Webhook n8n'
    ELSE 'Autre'
  END as destination
FROM net.http_request_queue
WHERE url LIKE '%n8n%'
ORDER BY created_at DESC
LIMIT 10;


-- =====================================================
-- ÉTAPE 4 : VÉRIFICATION CÔTÉ N8N
-- =====================================================

-- 🔍 ACTIONS MANUELLES À FAIRE :
--
-- 1. Aller sur https://n8n.dsolution-ia.fr
-- 2. Vérifier que le workflow "receipt-pdf" est actif
-- 3. Regarder les exécutions récentes du workflow
-- 4. Vérifier que le payload JSON est bien reçu avec :
--    - event: 'receipt.generate'
--    - transaction_id: [UUID de la transaction test]
--    - donor.email: 'test-trigger-n8n@example.com'
--    - amount: 10
-- 5. Vérifier que Gotenberg a généré un PDF
-- 6. Vérifier que l'email a été envoyé au donateur


-- =====================================================
-- ÉTAPE 5 : NETTOYER LES DONNÉES DE TEST
-- =====================================================

-- ⚠️ DÉCOMMENTEZ CI-DESSOUS POUR SUPPRIMER LES TRANSACTIONS DE TEST :

-- -- Supprimer les reçus associés
-- DELETE FROM receipts WHERE transaction_id IN (
--   SELECT id FROM support_transactions
--   WHERE supporter_email IN ('test-trigger-n8n@example.com', 'test-no-trigger@example.com')
-- );

-- -- Supprimer les transactions de test
-- DELETE FROM support_transactions
-- WHERE supporter_email IN ('test-trigger-n8n@example.com', 'test-no-trigger@example.com');

-- -- Supprimer les logs de test
-- DELETE FROM webhook_logs
-- WHERE source = 'pg_net_trigger'
--   AND payload->'donor'->>'email' IN ('test-trigger-n8n@example.com', 'test-no-trigger@example.com');

-- RAISE NOTICE '🧹 Données de test nettoyées';


-- =====================================================
-- ÉTAPE 6 : DASHBOARD DE MONITORING
-- =====================================================

-- 6.1. Taux de succès/échec des webhooks n8n (dernières 24h)
SELECT
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM webhook_logs
WHERE source = 'pg_net_trigger'
  AND event_type = 'receipt.generate'
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY status
ORDER BY count DESC;


-- 6.2. Derniers webhooks envoyés (dernières 24h)
SELECT
  id,
  status,
  error_message,
  payload->>'transaction_id' as transaction_id,
  payload->'donor'->>'email' as donor_email,
  payload->>'amount' as amount,
  created_at
FROM webhook_logs
WHERE source = 'pg_net_trigger'
  AND event_type = 'receipt.generate'
  AND created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;


-- 6.3. Transactions éligibles au reçu fiscal sans log webhook (anomalie ?)
SELECT
  st.id,
  st.amount,
  st.calendar_accepted,
  st.supporter_email,
  st.created_at,
  CASE
    WHEN wl.id IS NULL THEN '❌ Pas de log webhook (anomalie)'
    ELSE '✅ Log webhook trouvé'
  END as webhook_status
FROM support_transactions st
LEFT JOIN webhook_logs wl ON (wl.payload->>'transaction_id')::uuid = st.id
WHERE st.amount >= 6
  AND st.supporter_email IS NOT NULL
  AND st.calendar_accepted = false
  AND st.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY st.created_at DESC;


-- 6.4. Statistiques globales
SELECT
  'Total transactions >= 6€ (fiscal)' as metric,
  COUNT(*) as value
FROM support_transactions
WHERE amount >= 6 AND calendar_accepted = false

UNION ALL

SELECT
  'Total webhooks n8n envoyés' as metric,
  COUNT(*) as value
FROM webhook_logs
WHERE source = 'pg_net_trigger' AND event_type = 'receipt.generate'

UNION ALL

SELECT
  'Webhooks en erreur' as metric,
  COUNT(*) as value
FROM webhook_logs
WHERE source = 'pg_net_trigger'
  AND event_type = 'receipt.generate'
  AND status = 'error'

UNION ALL

SELECT
  'Transactions avec reçu généré' as metric,
  COUNT(*) as value
FROM support_transactions
WHERE receipt_generated IS NOT NULL;


-- =====================================================
-- FIN DU SCRIPT DE TEST
-- =====================================================
