-- ============================================================
-- Migration: Remplacement du fichier 20251202_commande_berrez_joel.sql
-- Date: 2026-03-03
-- Ce fichier remplace l'original qui contenait des données PII
-- (email client, adresse postale, Stripe PI) dans le code source.
--
-- L'original 20251202_commande_berrez_joel.sql doit être supprimé
-- de l'historique git via:
--   git filter-repo --path supabase/migrations/20251202_commande_berrez_joel.sql --invert-paths
--
-- La transaction a déjà été insérée en base de production.
-- Ce fichier ne fait rien (idempotent) mais documente l'incident.
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE
    'Migration 20251202_commande_berrez_joel: transaction déjà en base, rien à faire. '
    'Ce fichier remplace la version originale contenant des PII clients.';
END $$;
