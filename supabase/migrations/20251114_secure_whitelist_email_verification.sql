-- Migration: Sécurisation de la whitelist avec vérification email obligatoire
-- Date: 2024-11-14
-- Description: Correction vulnérabilité critique - vérification email + nom + prénom

-- =====================================================
-- ÉTAPE 0: Supprimer l'ancienne fonction
-- =====================================================

DROP FUNCTION IF EXISTS claim_whitelist_entry(text, text, text);

-- =====================================================
-- ÉTAPE 1: Modifier la fonction claim_whitelist_entry()
-- =====================================================

CREATE OR REPLACE FUNCTION claim_whitelist_entry(
  p_first_name text,
  p_last_name text,
  p_email text
)
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  email text,
  secteur text,
  used boolean,
  used_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  entry record;
BEGIN
  -- SÉCURITÉ CRITIQUE: Match STRICT sur email + nom + prénom
  -- Empêche l'usurpation d'identité en vérifiant les 3 critères
  SELECT * INTO entry 
  FROM whitelist w
  WHERE lower(w.first_name) = lower(p_first_name)
    AND lower(w.last_name) = lower(p_last_name)
    AND lower(w.email) = lower(p_email)  -- ✅ AJOUT CRITIQUE
    AND w.used = false
  FOR UPDATE;

  -- Si aucune entrée ne correspond, rejeter immédiatement
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Marquer l'entrée comme utilisée
  UPDATE whitelist
  SET 
    used = true,
    used_at = now()
  WHERE whitelist.id = entry.id;

  -- Audit de l'action
  INSERT INTO whitelist_audit (
    action,
    whitelist_id,
    performed_at,
    details
  ) VALUES (
    'claimed',
    entry.id,
    now(),
    jsonb_build_object(
      'first_name', p_first_name,
      'last_name', p_last_name,
      'email', p_email,
      'matched_email', entry.email
    )
  );

  -- Retourner l'entrée claim
  RETURN QUERY
  SELECT 
    entry.id,
    entry.first_name,
    entry.last_name,
    entry.email,
    entry.secteur,
    entry.used,
    entry.used_at;
END;
$$;

COMMENT ON FUNCTION claim_whitelist_entry(text, text, text) IS 
'Fonction sécurisée pour claim une entrée whitelist. Vérifie email + nom + prénom pour empêcher usurpation identité.';

-- =====================================================
-- ÉTAPE 2: Ajouter index pour performances
-- =====================================================

-- Index composite pour recherche rapide email + nom + prénom
CREATE INDEX IF NOT EXISTS idx_whitelist_identity_strict 
ON whitelist(lower(email), lower(first_name), lower(last_name)) 
WHERE used = false;

COMMENT ON INDEX idx_whitelist_identity_strict IS 
'Index composite pour vérification stricte identité (email + nom + prénom)';
