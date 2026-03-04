-- ============================================================
-- Migration: Suppression de la colonne legacy profiles.team
-- Date: 2026-03-04
-- Impact: ZERO — aucun code applicatif ne lit cette colonne
-- Preuves:
--   - grep -r "profiles.team" app/ lib/ components/ → 0 résultat
--   - La colonne team_id (UUID FK → equipes) est utilisée partout
--   - Le trigger trg_profiles_sync_team maintenait team en sync
--     depuis team_id mais génère de l'écriture inutile
-- ============================================================

-- 1. Supprimer le trigger de synchronisation
DROP TRIGGER IF EXISTS trg_profiles_sync_team ON public.profiles;

-- 2. Supprimer la fonction associée
DROP FUNCTION IF EXISTS public.sync_profiles_team_from_team_id();

-- 3. Supprimer l'index sur l'ancienne colonne
DROP INDEX IF EXISTS public.profiles_team_idx;

-- 4. Supprimer la colonne legacy
ALTER TABLE public.profiles DROP COLUMN IF EXISTS team;

-- Vérification
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'team'
  ) THEN
    RAISE EXCEPTION 'La colonne profiles.team existe encore — migration échouée';
  ELSE
    RAISE NOTICE 'profiles.team supprimé avec succès — dette technique résolue';
  END IF;
END $$;
