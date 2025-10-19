-- ============================================
-- Migration 020 : Nettoyage optionnel
-- Date : À DÉFINIR (après tests en prod)
-- Description : Supprime les colonnes obsolètes
-- ⚠️  NE PAS EXÉCUTER SANS VALIDATION PRÉALABLE
-- ============================================

-- ÉTAPE 1 : Vérification manuelle obligatoire
DO $$
DECLARE
  total_profiles INT;
  profiles_with_team_id INT;
  profiles_with_team_text INT;
BEGIN
  SELECT 
    COUNT(*),
    COUNT(team_id),
    COUNT(team)
  INTO total_profiles, profiles_with_team_id, profiles_with_team_text
  FROM profiles;
  
  RAISE NOTICE '=== VÉRIFICATION PRÉ-CLEANUP ===';
  RAISE NOTICE 'Total profiles: %', total_profiles;
  RAISE NOTICE 'Avec team_id (nouveau): %', profiles_with_team_id;
  RAISE NOTICE 'Avec team (obsolète): %', profiles_with_team_text;
  
  IF profiles_with_team_id < total_profiles THEN
    RAISE EXCEPTION 'STOP : Tous les profils n''ont pas de team_id ! Migration 018 incomplète.';
  END IF;
  
  RAISE NOTICE 'Vérification OK : Tous les profils ont team_id';
END $$;

-- ÉTAPE 2 : Supprimer la colonne obsolète (décommenter après validation)
-- ALTER TABLE profiles DROP COLUMN IF EXISTS team;

-- ÉTAPE 3 : Nettoyer les données de test (optionnel)
-- DELETE FROM test_tables WHERE created_at < NOW() - INTERVAL '90 days';

-- ÉTAPE 4 : Nettoyer les webhook logs anciens (optionnel)
-- DELETE FROM webhook_logs WHERE created_at < NOW() - INTERVAL '90 days';

RAISE NOTICE 'Migration 020 : Cleanup en attente de validation manuelle';