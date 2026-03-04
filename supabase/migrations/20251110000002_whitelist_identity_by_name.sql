-- Modification de la whitelist : identification par nom+prénom, pas par email
-- Un utilisateur peut utiliser n'importe quel email s'il a le bon nom+prénom

-- Supprimer l'ancienne contrainte unique sur email
ALTER TABLE whitelist DROP CONSTRAINT IF EXISTS whitelist_email_key;

-- Supprimer l'ancien index composite (first_name, last_name) conditionnel
DROP INDEX IF EXISTS whitelist_name_unused_idx;

-- Ajouter contrainte UNIQUE sur (first_name, last_name) insensible à la casse
CREATE UNIQUE INDEX IF NOT EXISTS whitelist_name_unique_idx 
  ON whitelist (lower(first_name), lower(last_name));

-- Recréer la fonction claim_whitelist_entry pour matcher sur nom+prénom uniquement
DROP FUNCTION IF EXISTS claim_whitelist_entry(text, text, text);

CREATE OR REPLACE FUNCTION claim_whitelist_entry(
  p_first_name text,
  p_last_name text,
  p_email text
)
RETURNS TABLE (
  id uuid,
  email text,
  first_name text,
  last_name text,
  notes text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  entry record;
BEGIN
  -- Chercher une entrée whitelist correspondant au nom+prénom (insensible à la casse)
  -- PEU IMPORTE l'email utilisé pour l'inscription
  SELECT * INTO entry 
  FROM whitelist w
  WHERE lower(w.first_name) = lower(p_first_name)
    AND lower(w.last_name) = lower(p_last_name)
    AND w.used = false
  FOR UPDATE;

  -- Si aucune entrée trouvée ou déjà utilisée
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Marquer comme utilisée et enregistrer l'email réellement utilisé
  UPDATE whitelist
  SET 
    used = true,
    used_at = now(),
    email = p_email  -- Mise à jour de l'email avec celui réellement utilisé
  WHERE whitelist.id = entry.id;

  -- Retourner l'entrée
  RETURN QUERY 
  SELECT 
    entry.id,
    p_email as email,  -- L'email utilisé pour l'inscription
    entry.first_name,
    entry.last_name,
    entry.notes;
END;
$$;

-- Audit de la modification
INSERT INTO whitelist_audit (action, performed_by, details)
VALUES (
  'schema_modification',
  auth.uid(),
  '{"message": "Changement de logique whitelist: identification par nom+prénom au lieu de email"}'::jsonb
);
