-- Migration: Insertion commande manuelle Berrez Joël
-- Date: 2025-12-02
-- Description: Commande reçue par email avant mise en place du système
-- Client: Berrez Joël - 18 av Paul Vigné D'Octon, Les Chasselas bloc 6, 34800 Clermont l'Hérault
-- Articles: 1 Calendrier + 1 Écusson
-- Email: le_beb34@hotmail.fr
-- Stripe PI: pi_3SZcfJ4Iwp2z3Wxn0u5EUSpY
-- Date paiement: 1 déc. 2025 à 20:21

-- =====================================================
-- 0. RENDRE user_id et tournee_id NULLABLE 
--    (nécessaire pour les commandes boutique/landing page)
-- =====================================================
ALTER TABLE support_transactions 
ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE support_transactions 
ALTER COLUMN tournee_id DROP NOT NULL;

DO $$
DECLARE
  v_transaction_id UUID;
  v_calendrier_id UUID := '2a855244-90b8-48be-8c90-e64ea139e7dc';
  v_ecusson_id UUID := '8e55841a-f9c8-4676-b03e-db20d9fa8c26';
  v_calendrier_price DECIMAL(10,2);
  v_ecusson_price DECIMAL(10,2);
  v_total DECIMAL(10,2);
BEGIN
  -- Récupérer les prix des produits
  SELECT price INTO v_calendrier_price FROM products WHERE id = v_calendrier_id;
  SELECT price INTO v_ecusson_price FROM products WHERE id = v_ecusson_id;

  -- Calculer le total
  v_total := v_calendrier_price + v_ecusson_price;

  RAISE NOTICE 'Calendrier: % (% €)', v_calendrier_id, v_calendrier_price;
  RAISE NOTICE 'Écusson: % (% €)', v_ecusson_id, v_ecusson_price;
  RAISE NOTICE 'Total: % €', v_total;

  -- =====================================================
  -- 1. CRÉER LA TRANSACTION
  -- =====================================================
  INSERT INTO support_transactions (
    amount,
    payment_method,
    payment_status,
    supporter_name,
    supporter_email,
    stripe_session_id,
    notes,
    source,
    order_status,
    created_at,
    calendar_accepted
  ) VALUES (
    v_total,
    'carte',
    'completed',
    'Berrez Joël',
    'le_beb34@hotmail.fr',
    'pi_3SZcfJ4Iwp2z3Wxn0u5EUSpY',
    'Commande par email - Adresse livraison: 18 av Paul Vigné D''Octon, Les Chasselas bloc 6, 34800 Clermont l''Hérault',
    'boutique',
    'pending',
    '2025-12-01 20:21:00+01',
    true  -- Boutique = pas de reçu fiscal
  )
  RETURNING id INTO v_transaction_id;

  RAISE NOTICE 'Transaction créée: %', v_transaction_id;

  -- =====================================================
  -- 3. INSÉRER LES ARTICLES
  -- =====================================================
  
  -- Article 1: Calendrier
  INSERT INTO order_items (
    transaction_id,
    product_id,
    name,
    quantity,
    unit_price,
    image_url
  )
  SELECT 
    v_transaction_id,
    id,
    name,
    1,
    price,
    image_url
  FROM products
  WHERE id = v_calendrier_id;

  -- Article 2: Écusson
  INSERT INTO order_items (
    transaction_id,
    product_id,
    name,
    quantity,
    unit_price,
    image_url
  )
  SELECT 
    v_transaction_id,
    id,
    name,
    1,
    price,
    image_url
  FROM products
  WHERE id = v_ecusson_id;

  -- =====================================================
  -- 4. CRÉER L'ENTRÉE D'HISTORIQUE DE STATUT
  -- =====================================================
  INSERT INTO order_status_history (
    transaction_id,
    status,
    notes
  ) VALUES (
    v_transaction_id,
    'pending',
    'Commande créée manuellement depuis email reçu le 02/12/2025'
  );

  RAISE NOTICE '✅ Commande Berrez Joël créée avec succès !';
  RAISE NOTICE 'Transaction ID: %', v_transaction_id;
  RAISE NOTICE 'Montant total: %.2f €', v_total;

END $$;

-- =====================================================
-- VÉRIFICATION (à exécuter après)
-- =====================================================
-- SELECT 
--   st.id,
--   st.supporter_name,
--   st.amount,
--   st.order_status,
--   st.notes,
--   oi.name as article,
--   oi.quantity,
--   oi.unit_price
-- FROM support_transactions st
-- JOIN order_items oi ON oi.transaction_id = st.id
-- WHERE st.supporter_name = 'Berrez Joël';
