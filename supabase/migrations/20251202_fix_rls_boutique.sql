-- Migration: Fix RLS pour boutique orders
-- Date: 2025-12-02
-- Description: Ajouter policy pour que les admins puissent voir toutes les transactions

-- =====================================================
-- 1. POLICY ADMIN POUR SUPPORT_TRANSACTIONS
-- =====================================================

-- Supprimer si existe déjà (pour idempotence)
DROP POLICY IF EXISTS "Admins can view all transactions" ON support_transactions;

-- Les admins et trésoriers peuvent voir TOUTES les transactions
CREATE POLICY "Admins can view all transactions" ON support_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'tresorier')
    )
  );

-- =====================================================
-- 2. POLICY ADMIN POUR UPDATE (changer le statut)
-- =====================================================

DROP POLICY IF EXISTS "Admins can update all transactions" ON support_transactions;

CREATE POLICY "Admins can update all transactions" ON support_transactions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'tresorier')
    )
  );

-- =====================================================
-- VÉRIFICATION
-- =====================================================
-- Après exécution, testez avec:
-- SELECT * FROM support_transactions WHERE source = 'boutique';
