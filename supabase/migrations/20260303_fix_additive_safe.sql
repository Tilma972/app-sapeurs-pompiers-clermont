-- ============================================================
-- Migration: Fix additifs sans risque (Phase 2)
-- Date: 2026-03-03
-- Impact: ZERO data loss, ZERO downtime, 100% idempotent
-- Corrections:
--   1. Colonne receipts.updated_at manquante (trigger existait sans colonne)
--   2. Index manquants pour performances
--   3. Index partial sur profiles.is_active (plus efficient)
-- ============================================================

-- ============================================================
-- FIX 1: receipts.updated_at — colonne manquante
-- Le trigger update_receipts_updated_at existait mais la colonne
-- n'avait jamais été ajoutée dans le CREATE TABLE de 006.
-- ============================================================

ALTER TABLE public.receipts
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Backfill: updated_at = created_at pour les reçus existants
UPDATE public.receipts
SET updated_at = created_at
WHERE updated_at = NOW() AND created_at < NOW() - INTERVAL '1 minute';

-- ============================================================
-- FIX 2: Index partial sur profiles.is_active
-- Remplace l'index naïf sur BOOLEAN par un partial index
-- (seuls les comptes inactifs sont filtrés, les actifs sont la norme)
-- ============================================================

DROP INDEX IF EXISTS public.profiles_is_active_idx;
CREATE INDEX IF NOT EXISTS profiles_inactive_idx
  ON public.profiles(id)
  WHERE is_active = false;

-- ============================================================
-- FIX 3: Index manquants identifiés à l'audit
-- ============================================================

-- Index GIN pour tableaux de communes (recherches géographiques)
CREATE INDEX IF NOT EXISTS idx_equipes_communes_gin
  ON public.equipes USING gin(communes)
  WHERE communes IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tournees_communes_gin
  ON public.tournees USING gin(communes)
  WHERE communes IS NOT NULL;

-- Index composite pour demandes_versement (vue trésorier)
CREATE INDEX IF NOT EXISTS idx_demandes_versement_statut_created
  ON public.demandes_versement(statut, created_at DESC);

-- Index pour transactions fiscales (génération reçus)
CREATE INDEX IF NOT EXISTS idx_support_transactions_fiscal
  ON public.support_transactions(created_at)
  WHERE calendar_accepted = false AND payment_status = 'completed';

-- Index pour reports galerie
CREATE INDEX IF NOT EXISTS idx_gallery_reports_photo_id
  ON public.gallery_photo_reports(photo_id);

-- Index pour idea_comments sans soft-delete
CREATE INDEX IF NOT EXISTS idx_idea_comments_idea_active
  ON public.idea_comments(idea_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Index pour zones par équipe + année
CREATE INDEX IF NOT EXISTS idx_zones_tournees_equipe_annee
  ON public.zones_tournees(equipe_id, annee);

-- Index leaderboard gamification
CREATE INDEX IF NOT EXISTS idx_user_progression_xp
  ON public.user_progression(xp_total DESC);

CREATE INDEX IF NOT EXISTS idx_user_progression_level
  ON public.user_progression(level DESC);

-- ============================================================
-- COMMENTAIRES
-- ============================================================

COMMENT ON COLUMN public.receipts.updated_at IS
  'Date de dernière modification du reçu. Colonne manquante ajoutée (trigger existait sans colonne).';

COMMENT ON INDEX public.profiles_inactive_idx IS
  'Partial index: seuls les comptes inactifs — plus efficient qu''un index BOOLEAN complet.';
