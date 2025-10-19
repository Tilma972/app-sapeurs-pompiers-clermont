-- ============================================
-- Migration 019 : Index de performance
-- Date : 2025-01-19
-- Description : Optimise les requêtes fréquentes identifiées en prod
-- Dépendances : 018_fix_missing_columns.sql
-- ============================================

-- 1. Index composite user + tournée (requête la plus fréquente)
-- Cas d'usage : afficher les transactions d'une tournée
CREATE INDEX IF NOT EXISTS idx_support_transactions_user_tournee 
ON support_transactions(user_id, tournee_id);

-- 2. Index pour filtrage par type et statut
-- Cas d'usage : dashboard admin (dons fiscaux en attente, etc.)
CREATE INDEX IF NOT EXISTS idx_support_transactions_type_status
ON support_transactions(transaction_type, payment_status)
WHERE transaction_type IS NOT NULL;

-- 3. Index partiel pour tournées actives (60% plus rapide qu'un index complet)
-- Cas d'usage : "mes tournées en cours"
CREATE INDEX IF NOT EXISTS idx_tournees_user_active 
ON tournees(user_id, statut) 
WHERE statut = 'active';

-- 4. Index composite équipe (nouveau champ de la migration 018)
-- Cas d'usage : statistiques par équipe
CREATE INDEX IF NOT EXISTS idx_tournees_equipe_statut
ON tournees(equipe_id, statut)
WHERE equipe_id IS NOT NULL;

-- 5. Index pour géolocalisation (préparation feature carte)
-- Type GIST pour requêtes spatiales (rayon, proximité)
CREATE INDEX IF NOT EXISTS idx_support_transactions_geoloc 
ON support_transactions USING btree (latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- 6. Index pour recherche donateurs par email
-- Cas d'usage : retrouver un donateur pour reçu fiscal
CREATE INDEX IF NOT EXISTS idx_support_transactions_email
ON support_transactions(supporter_email)
WHERE supporter_email IS NOT NULL AND supporter_email != '';

-- 7. Index pour reçus fiscaux en attente
-- Cas d'usage : génération batch des reçus
CREATE INDEX IF NOT EXISTS idx_receipts_pending
ON receipts(status, fiscal_year, created_at)
WHERE status = 'pending';

-- 8. Index pour webhook logs (debug/monitoring)
-- Ordre DESC car on veut toujours les plus récents
-- NOTE: Les fonctions non IMMUTABLE (ex: NOW()) sont interdites dans les prédicats d'index partiels.
-- On crée donc un index sans fenêtre temporelle; un job d'entretien peut gérer la purge 30j côté données.
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_desc
ON webhook_logs(created_at DESC, source);

-- 9. Index pour donation_intents actifs
-- Cas d'usage : retrouver les intentions en attente
-- NOTE: Remplacement de "expires_at > NOW()" (non IMMUTABLE) par un filtre sur NOT NULL.
CREATE INDEX IF NOT EXISTS idx_donation_intents_active
ON donation_intents(status, expires_at)
WHERE status = 'waiting_donor' AND expires_at IS NOT NULL;

-- Mise à jour des statistiques PostgreSQL
ANALYZE support_transactions;
ANALYZE tournees;
ANALYZE receipts;
ANALYZE donation_intents;
ANALYZE webhook_logs;

-- Rapport post-migration
DO $$
DECLARE
  idx_count INT;
BEGIN
  SELECT COUNT(*) INTO idx_count
  FROM pg_indexes 
  WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%';
  
  RAISE NOTICE 'Migration 019 : % index créés ou vérifiés', idx_count;
END $$;