-- Script de test pour débugger le toast du PaymentCardModal
-- À exécuter dans Supabase SQL Editor

-- ============================================================================
-- TEST 1: Vérifier que le Realtime fonctionne
-- ============================================================================

-- Instructions :
-- 1. Ouvrir l'application sur la page "Ma tournée"
-- 2. Cliquer sur "Générer QR paiement" et entrer 5€
-- 3. NE PAS scanner le QR, laisser le modal ouvert
-- 4. Noter le PaymentIntent ID (visible dans l'URL du QR : /pay/pi_xxxxx_secret_yyy)
-- 5. Remplacer 'VOTRE_PI_ID' ci-dessous par le vrai ID
-- 6. Remplacer 'VOTRE_TOURNEE_ID' par votre tournée active
-- 7. Remplacer 'VOTRE_USER_ID' par votre user ID
-- 8. Exécuter ce script
-- 9. Observer si le toast s'affiche et si le modal se ferme

-- IMPORTANT: Récupérer vos IDs avant d'exécuter
DO $$
DECLARE
  v_tournee_id UUID := 'VOTRE_TOURNEE_ID'; -- À remplacer
  v_user_id UUID := 'VOTRE_USER_ID';       -- À remplacer
  v_pi_id TEXT := 'VOTRE_PI_ID';           -- À remplacer (ex: pi_3SX9Aj4Iwp2z3Wxn1ROnXiAJ)
BEGIN
  -- Insérer une fausse transaction comme si elle venait du webhook
  INSERT INTO support_transactions (
    tournee_id,
    user_id,
    amount,
    calendar_accepted,
    payment_method,
    payment_status,
    stripe_session_id,
    supporter_name,
    supporter_email,
    notes
  ) VALUES (
    v_tournee_id,
    v_user_id,
    5.00,
    true,
    'carte',
    'completed',
    v_pi_id,
    'Test Donateur',
    'test@example.com',
    'TEST MANUEL - Simulation paiement Realtime'
  );

  RAISE NOTICE 'Transaction test insérée avec PI: %', v_pi_id;
  RAISE NOTICE 'Si le toast ne s''affiche pas, le Realtime ne fonctionne pas correctement';
END $$;

-- ============================================================================
-- TEST 2: Vérifier les RLS policies
-- ============================================================================

-- Cette requête doit retourner la transaction que vous venez de créer
-- Si elle ne retourne rien, les RLS bloquent la lecture
SELECT
  id,
  amount,
  supporter_name,
  stripe_session_id,
  created_at
FROM support_transactions
WHERE stripe_session_id = 'VOTRE_PI_ID' -- À remplacer
ORDER BY created_at DESC
LIMIT 1;

-- ============================================================================
-- TEST 3: Vérifier le statut du canal Realtime
-- ============================================================================

-- Vérifier que la publication Realtime existe
SELECT * FROM pg_publication;

-- Vérifier que support_transactions est inclus
SELECT
  schemaname,
  tablename,
  pubname
FROM pg_publication_tables
WHERE tablename = 'support_transactions';

-- ============================================================================
-- NETTOYAGE (optionnel)
-- ============================================================================

-- Supprimer la transaction test après vos tests
-- DELETE FROM support_transactions
-- WHERE notes = 'TEST MANUEL - Simulation paiement Realtime';
