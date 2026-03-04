-- Migration: Créer bucket Storage pour landing page (produits + partenaires)
-- Date: 2025-11-11
-- Description: Bucket public pour images landing page (produits boutique + logos partenaires)

-- ⚠️ IMPORTANT: Les policies Storage NE PEUVENT PAS être créées via SQL migration
-- ⚠️ Elles doivent être créées manuellement dans Supabase Dashboard > Storage

-- =============================================================================
-- ÉTAPE 1: CRÉER LE BUCKET MANUELLEMENT
-- =============================================================================
-- Dans Supabase Dashboard > Storage:
-- 1. Cliquer "New bucket"
-- 2. Nom: landing_page
-- 3. Public: ✅ OUI (CRITICAL - cocher la case "Public bucket")
-- 4. File size limit: 5 MB (5242880 bytes)
-- 5. Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
-- 6. Cliquer "Save"

-- =============================================================================
-- ÉTAPE 2: CRÉER LES POLICIES RLS MANUELLEMENT
-- =============================================================================
-- Dans Supabase Dashboard > Storage > landing_page > Policies:

-- POLICY 1: Lecture publique (SELECT)
-- -------------------------------------
-- Cliquer "New policy" > "For full customization" > "Create policy"
-- Policy name: Public read access for landing_page
-- Allowed operation: SELECT
-- Target roles: public
-- USING expression:
-- bucket_id = 'landing_page'

-- POLICY 2: Upload authentifié (INSERT)
-- -------------------------------------
-- Cliquer "New policy" > "For full customization" > "Create policy"
-- Policy name: Authenticated users can upload to landing_page
-- Allowed operation: INSERT
-- Target roles: authenticated
-- WITH CHECK expression:
-- bucket_id = 'landing_page' AND (storage.foldername(name))[1] IN ('products', 'logos_partenaires')

-- POLICY 3: Update authentifié (UPDATE)
-- -------------------------------------
-- Cliquer "New policy" > "For full customization" > "Create policy"
-- Policy name: Authenticated users can update landing_page
-- Allowed operation: UPDATE
-- Target roles: authenticated
-- USING expression:
-- bucket_id = 'landing_page'
-- WITH CHECK expression:
-- bucket_id = 'landing_page'

-- POLICY 4: Delete authentifié (DELETE)
-- -------------------------------------
-- ⚠️ ATTENTION: Vérifier que Target roles = authenticated (pas public!)
-- Cliquer "New policy" > "For full customization" > "Create policy"
-- Policy name: Authenticated users can delete landing_page
-- Allowed operation: DELETE
-- Target roles: authenticated (⚠️ PAS public - risque de suppression non autorisée!)
-- USING expression:
-- bucket_id = 'landing_page'

-- =============================================================================
-- VÉRIFICATION (à exécuter après création manuelle des policies)
-- =============================================================================

-- Vérifier que les policies existent
SELECT 
  policyname, 
  cmd AS operation,
  roles::text,
  qual::text AS using_clause,
  with_check::text AS with_check_clause
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%landing_page%'
ORDER BY policyname;

-- Résultat attendu: 4 lignes (SELECT, INSERT, UPDATE, DELETE)

-- =============================================================================
-- RAPPEL: CETTE MIGRATION NE CRÉE RIEN AUTOMATIQUEMENT
-- =============================================================================
-- Les policies Storage doivent être créées via l'interface Dashboard uniquement.
-- Ce fichier sert de documentation et de checklist.

