-- Enable retribution for all existing teams
-- This fixes the critical issue where all teams had enable_retribution = false by default
-- preventing everyone from closing their tournees

-- Activate retribution for all teams
UPDATE equipes
SET enable_retribution = true,
    updated_at = NOW()
WHERE enable_retribution = false OR enable_retribution IS NULL;

-- Set sensible defaults for retribution percentages if not configured
UPDATE equipes
SET
  pourcentage_minimum_pot = 20,
  pourcentage_recommande_pot = 30,
  updated_at = NOW()
WHERE (pourcentage_minimum_pot IS NULL OR pourcentage_minimum_pot = 0)
  AND (pourcentage_recommande_pot IS NULL OR pourcentage_recommande_pot = 0);

-- Verify the changes
DO $$
DECLARE
  team_count INTEGER;
  enabled_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO team_count FROM equipes;
  SELECT COUNT(*) INTO enabled_count FROM equipes WHERE enable_retribution = true;

  RAISE NOTICE 'Total teams: %, Teams with retribution enabled: %', team_count, enabled_count;
END $$;
