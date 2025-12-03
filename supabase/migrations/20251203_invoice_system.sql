-- Migration: Système de facturation boutique
-- Date: 2025-12-03
-- Description: Ajout des colonnes pour la gestion des factures boutique
-- Impact QR Code: AUCUN (colonnes additives avec DEFAULT NULL)

-- =====================================================
-- 1. COLONNES FACTURE SUR SUPPORT_TRANSACTIONS
-- =====================================================

-- Numéro de facture séquentiel (FAC-2025-00001)
ALTER TABLE support_transactions 
ADD COLUMN IF NOT EXISTS invoice_number TEXT;

-- URL du PDF de la facture (stocké dans Supabase Storage)
ALTER TABLE support_transactions 
ADD COLUMN IF NOT EXISTS invoice_url TEXT;

-- Facture envoyée par email ?
ALTER TABLE support_transactions 
ADD COLUMN IF NOT EXISTS invoice_sent BOOLEAN DEFAULT false;

-- Date de génération de la facture
ALTER TABLE support_transactions 
ADD COLUMN IF NOT EXISTS invoice_generated_at TIMESTAMPTZ;

-- Adresse de livraison (pour affichage sur facture)
ALTER TABLE support_transactions 
ADD COLUMN IF NOT EXISTS shipping_address TEXT;

-- =====================================================
-- 2. SÉQUENCE POUR NUMÉROS DE FACTURE
-- =====================================================

-- Créer la séquence si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'invoice_number_seq') THEN
    CREATE SEQUENCE invoice_number_seq START 1;
  END IF;
END $$;

-- =====================================================
-- 3. FONCTION GÉNÉRATION NUMÉRO FACTURE
-- =====================================================

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  v_year TEXT;
  v_seq INTEGER;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');
  v_seq := nextval('invoice_number_seq');
  RETURN 'FAC-' || v_year || '-' || LPAD(v_seq::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. FONCTION POUR ASSIGNER UNE FACTURE
-- =====================================================

CREATE OR REPLACE FUNCTION assign_invoice_to_order(
  p_transaction_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_invoice_number TEXT;
  v_source TEXT;
BEGIN
  -- Vérifier que c'est bien une commande boutique
  SELECT source INTO v_source
  FROM support_transactions
  WHERE id = p_transaction_id;

  IF v_source IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transaction non trouvée');
  END IF;

  IF v_source != 'boutique' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Seules les commandes boutique peuvent avoir une facture');
  END IF;

  -- Vérifier si une facture existe déjà
  SELECT invoice_number INTO v_invoice_number
  FROM support_transactions
  WHERE id = p_transaction_id;

  IF v_invoice_number IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Facture déjà générée', 'invoice_number', v_invoice_number);
  END IF;

  -- Générer le numéro de facture
  v_invoice_number := generate_invoice_number();

  -- Mettre à jour la transaction
  UPDATE support_transactions
  SET 
    invoice_number = v_invoice_number,
    invoice_generated_at = NOW()
  WHERE id = p_transaction_id;

  RETURN jsonb_build_object(
    'success', true,
    'invoice_number', v_invoice_number,
    'transaction_id', p_transaction_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. INDEX POUR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_support_transactions_invoice_number 
ON support_transactions(invoice_number) 
WHERE invoice_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_support_transactions_invoice_sent 
ON support_transactions(invoice_sent) 
WHERE source = 'boutique';

-- =====================================================
-- 6. COMMENTAIRES DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN support_transactions.invoice_number IS 'Numéro de facture séquentiel (FAC-YYYY-NNNNN) - Boutique uniquement';
COMMENT ON COLUMN support_transactions.invoice_url IS 'URL du PDF de facture dans Supabase Storage';
COMMENT ON COLUMN support_transactions.invoice_sent IS 'True si la facture a été envoyée par email';
COMMENT ON COLUMN support_transactions.invoice_generated_at IS 'Date/heure de génération de la facture';
COMMENT ON COLUMN support_transactions.shipping_address IS 'Adresse de livraison pour la facture';
COMMENT ON FUNCTION generate_invoice_number IS 'Génère un numéro de facture séquentiel FAC-YYYY-NNNNN';
COMMENT ON FUNCTION assign_invoice_to_order IS 'Assigne un numéro de facture à une commande boutique';

-- =====================================================
-- VÉRIFICATION
-- =====================================================
-- SELECT generate_invoice_number(); -- Devrait retourner FAC-2025-00001
-- SELECT assign_invoice_to_order('uuid-de-commande-boutique');
