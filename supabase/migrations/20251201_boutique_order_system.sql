-- Migration: Système de commandes boutique
-- Date: 2025-12-01
-- Description: Tables et fonctions pour gérer les commandes boutique style e-commerce
-- Inspiré de Shopify/WooCommerce

-- =====================================================
-- 1. AJOUTER COLONNE SOURCE À SUPPORT_TRANSACTIONS
-- =====================================================
-- Permet d'identifier explicitement l'origine de chaque transaction

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'support_transactions' 
    AND column_name = 'source'
  ) THEN
    ALTER TABLE support_transactions 
    ADD COLUMN source TEXT DEFAULT 'terrain';
    
    COMMENT ON COLUMN support_transactions.source IS 'Origine de la transaction: terrain, landing_page, boutique';
  END IF;
END $$;

-- Backfill des données existantes basé sur les notes
UPDATE support_transactions 
SET source = 'boutique' 
WHERE source IS NULL AND notes LIKE '%Boutique%';

UPDATE support_transactions 
SET source = 'landing_page' 
WHERE source IS NULL AND notes LIKE '%landing page%';

UPDATE support_transactions 
SET source = 'terrain' 
WHERE source IS NULL;

-- =====================================================
-- 2. CRÉER TABLE ORDER_ITEMS
-- =====================================================
-- Stocke le détail des articles commandés (snapshot pour historique)

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Liaison avec la transaction
  transaction_id UUID NOT NULL REFERENCES public.support_transactions(id) ON DELETE CASCADE,
  
  -- Référence produit (nullable si produit supprimé)
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  
  -- Snapshot des données produit au moment de l'achat (crucial pour historique)
  name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  
  -- Prix total calculé automatiquement
  total_price DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  
  -- Image pour affichage dans emails/admin
  image_url TEXT,
  
  -- Métadonnées optionnelles (taille, couleur, variante...)
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_order_items_transaction ON order_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- =====================================================
-- 3. CRÉER TABLE ORDER_STATUS (Workflow)
-- =====================================================
-- Historique des changements de statut pour traçabilité complète

CREATE TYPE order_status_enum AS ENUM (
  'pending',      -- En attente de traitement
  'confirmed',    -- Commande confirmée
  'preparing',    -- En préparation
  'ready',        -- Prête pour retrait/expédition
  'shipped',      -- Expédiée
  'delivered',    -- Livrée
  'cancelled',    -- Annulée
  'refunded'      -- Remboursée
);

CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Liaison avec la transaction
  transaction_id UUID NOT NULL REFERENCES public.support_transactions(id) ON DELETE CASCADE,
  
  -- Statut
  status order_status_enum NOT NULL,
  
  -- Informations complémentaires
  notes TEXT,
  
  -- Qui a effectué le changement
  updated_by UUID REFERENCES auth.users(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_status_transaction ON order_status_history(transaction_id);
CREATE INDEX IF NOT EXISTS idx_order_status_status ON order_status_history(status);
CREATE INDEX IF NOT EXISTS idx_order_status_created ON order_status_history(created_at DESC);

-- =====================================================
-- 4. AJOUTER COLONNE ORDER_STATUS À SUPPORT_TRANSACTIONS
-- =====================================================
-- Statut actuel de la commande (dénormalisé pour performance)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'support_transactions' 
    AND column_name = 'order_status'
  ) THEN
    -- Ajouter comme TEXT pour éviter les problèmes de migration enum
    ALTER TABLE support_transactions 
    ADD COLUMN order_status TEXT DEFAULT 'pending';
    
    COMMENT ON COLUMN support_transactions.order_status IS 'Statut actuel de la commande boutique';
  END IF;
END $$;

-- =====================================================
-- 5. FONCTION POUR METTRE À JOUR LE STATUT
-- =====================================================

CREATE OR REPLACE FUNCTION update_order_status(
  p_transaction_id UUID,
  p_new_status TEXT,
  p_notes TEXT DEFAULT NULL,
  p_updated_by UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_old_status TEXT;
  v_result JSONB;
BEGIN
  -- Récupérer l'ancien statut
  SELECT order_status INTO v_old_status
  FROM support_transactions
  WHERE id = p_transaction_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transaction non trouvée');
  END IF;
  
  -- Mettre à jour le statut dans support_transactions
  UPDATE support_transactions
  SET order_status = p_new_status
  WHERE id = p_transaction_id;
  
  -- Ajouter une entrée dans l'historique
  INSERT INTO order_status_history (transaction_id, status, notes, updated_by)
  VALUES (p_transaction_id, p_new_status::order_status_enum, p_notes, p_updated_by);
  
  v_result := jsonb_build_object(
    'success', true,
    'transaction_id', p_transaction_id,
    'old_status', v_old_status,
    'new_status', p_new_status
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. VUE POUR LES COMMANDES BOUTIQUE
-- =====================================================

CREATE OR REPLACE VIEW boutique_orders AS
SELECT 
  st.id,
  st.created_at,
  st.amount,
  st.supporter_name,
  st.supporter_email,
  st.stripe_session_id,
  st.order_status,
  st.notes,
  -- Nombre d'articles
  COALESCE(
    (SELECT COUNT(*) FROM order_items oi WHERE oi.transaction_id = st.id),
    0
  ) as items_count,
  -- Détail des articles en JSON
  COALESCE(
    (SELECT jsonb_agg(jsonb_build_object(
      'id', oi.id,
      'name', oi.name,
      'quantity', oi.quantity,
      'unit_price', oi.unit_price,
      'total_price', oi.total_price,
      'image_url', oi.image_url
    )) FROM order_items oi WHERE oi.transaction_id = st.id),
    '[]'::jsonb
  ) as items,
  -- Dernier changement de statut
  (SELECT created_at FROM order_status_history osh 
   WHERE osh.transaction_id = st.id 
   ORDER BY created_at DESC LIMIT 1) as last_status_change
FROM support_transactions st
WHERE st.source = 'boutique'
ORDER BY st.created_at DESC;

-- =====================================================
-- 7. RLS (Row Level Security)
-- =====================================================

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- order_items: Admins peuvent tout voir
CREATE POLICY "Admins can view all order items" ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'tresorier'))
  );

CREATE POLICY "Admins can insert order items" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'tresorier'))
  );

-- Service role peut tout faire (pour webhook)
CREATE POLICY "Service role full access order_items" ON order_items
  FOR ALL USING (auth.role() = 'service_role');

-- order_status_history: Admins peuvent tout voir et modifier
CREATE POLICY "Admins can view order status history" ON order_status_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'tresorier'))
  );

CREATE POLICY "Admins can insert order status" ON order_status_history
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'tresorier'))
  );

CREATE POLICY "Service role full access order_status" ON order_status_history
  FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 8. FONCTION STATS BOUTIQUE
-- =====================================================

CREATE OR REPLACE FUNCTION get_boutique_stats()
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_orders', COUNT(*),
    'pending_orders', COUNT(*) FILTER (WHERE order_status = 'pending'),
    'preparing_orders', COUNT(*) FILTER (WHERE order_status IN ('confirmed', 'preparing')),
    'completed_orders', COUNT(*) FILTER (WHERE order_status IN ('delivered', 'shipped')),
    'cancelled_orders', COUNT(*) FILTER (WHERE order_status IN ('cancelled', 'refunded')),
    'total_revenue', COALESCE(SUM(amount), 0),
    'today_orders', COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE),
    'today_revenue', COALESCE(SUM(amount) FILTER (WHERE DATE(created_at) = CURRENT_DATE), 0)
  ) INTO v_result
  FROM support_transactions
  WHERE source = 'boutique';
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. COMMENTAIRES DOCUMENTATION
-- =====================================================

COMMENT ON TABLE order_items IS 'Articles commandés dans la boutique - snapshot des données produit';
COMMENT ON TABLE order_status_history IS 'Historique des changements de statut des commandes';
COMMENT ON VIEW boutique_orders IS 'Vue agrégée des commandes boutique avec détails articles';
COMMENT ON FUNCTION update_order_status IS 'Met à jour le statut d''une commande et enregistre l''historique';
COMMENT ON FUNCTION get_boutique_stats IS 'Retourne les statistiques de la boutique';
