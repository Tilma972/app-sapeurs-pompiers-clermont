-- =====================================================
-- FIX: idea_vote_log RLS Policy Violation
-- Date: 2025-11-29
-- Description: Fix RLS error when voting on ideas
--
-- Problem: The trigger_log_vote() function inserts into
-- idea_vote_log without SECURITY DEFINER, causing RLS
-- policy violations when users vote.
--
-- Solution: Add SECURITY DEFINER to the trigger function
-- and add an INSERT policy as a fallback.
-- =====================================================

-- 1. Recréer la fonction trigger avec SECURITY DEFINER
CREATE OR REPLACE FUNCTION trigger_log_vote()
RETURNS TRIGGER
SECURITY DEFINER  -- ← FIX: Execute with trigger owner's permissions
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO idea_vote_log (user_id, voted_at)
  VALUES (NEW.user_id, now());
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION trigger_log_vote IS
'Trigger function to log votes for rate limiting.
SECURITY DEFINER allows it to bypass RLS on idea_vote_log.';

-- 2. Ajouter une policy INSERT comme fallback de sécurité
-- (au cas où le trigger serait appelé manuellement ou par un autre moyen)
DROP POLICY IF EXISTS "idea_vote_log_insert_system" ON idea_vote_log;
CREATE POLICY "idea_vote_log_insert_system"
  ON idea_vote_log FOR INSERT
  WITH CHECK (
    -- Permettre les inserts si l'utilisateur vote pour lui-même
    auth.uid() = user_id
    -- OU si c'est le système (trigger avec SECURITY DEFINER)
    OR current_setting('role', true) = 'postgres'
  );

COMMENT ON POLICY "idea_vote_log_insert_system" ON idea_vote_log IS
'Allow users to log their own votes, and allow system triggers to log votes.';

-- 3. Vérification que le trigger existe toujours
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_idea_vote_log'
  ) THEN
    RAISE EXCEPTION 'Trigger trigger_idea_vote_log is missing! Check ideas_box_schema.sql';
  END IF;
END $$;

-- 4. Test de validation (commenté, à exécuter manuellement si besoin)
/*
-- Pour tester, créer un vote et vérifier qu'il est loggé:
SELECT COUNT(*) as logs_avant FROM idea_vote_log;
-- Puis voter sur une idée via l'interface
-- Puis vérifier:
SELECT COUNT(*) as logs_apres FROM idea_vote_log;
-- logs_apres devrait être = logs_avant + 1
*/
