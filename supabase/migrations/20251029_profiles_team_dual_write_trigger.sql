-- Migration: Synchronize profiles.team (TEXT) from profiles.team_id (UUID)
-- Purpose: During transition, keep legacy `team` column in sync for compatibility
-- Safe to run multiple times (drop-if-exists guards included)

-- 1) Function to set NEW.team from NEW.team_id
CREATE OR REPLACE FUNCTION public.sync_profiles_team_from_team_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.team_id IS NULL THEN
    NEW.team := NULL;
  ELSE
    SELECT e.nom INTO NEW.team FROM public.equipes e WHERE e.id = NEW.team_id;
  END IF;
  RETURN NEW;
END;
$$;

-- 2) Trigger on INSERT/UPDATE of team_id
DROP TRIGGER IF EXISTS trg_profiles_sync_team ON public.profiles;
CREATE TRIGGER trg_profiles_sync_team
BEFORE INSERT OR UPDATE OF team_id ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profiles_team_from_team_id();

-- 3) Backfill once to ensure existing rows are in sync
UPDATE public.profiles p
SET team = e.nom
FROM public.equipes e
WHERE p.team_id = e.id;

COMMENT ON TRIGGER trg_profiles_sync_team ON public.profiles IS 'Maintains legacy profiles.team text in sync with profiles.team_id via equipes.nom';
