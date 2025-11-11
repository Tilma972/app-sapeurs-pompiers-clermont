-- Migration: Trigger webhook n8n pour génération PDF asynchrone
-- Date: 2025-11-11
-- Description: Envoie un webhook POST vers n8n lors de chaque nouveau don >= 6€ pour génération PDF via Gotenberg

-- 1. Activer l'extension http si pas déjà fait
CREATE EXTENSION IF NOT EXISTS http;

-- 2. Fonction pour envoyer le webhook vers n8n
CREATE OR REPLACE FUNCTION trigger_n8n_pdf_generation()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT;
  payload JSON;
  response http_response;
BEGIN
  -- Récupérer l'URL du webhook n8n depuis les secrets ou variables d'env
  -- Alternative: hardcoder l'URL temporairement pour tests
  webhook_url := current_setting('app.settings.n8n_webhook_url', TRUE);
  
  -- Si pas de webhook configuré, logger et skip
  IF webhook_url IS NULL OR webhook_url = '' THEN
    RAISE NOTICE 'N8N_WEBHOOK_URL non configuré, skip génération PDF pour transaction %', NEW.id;
    RETURN NEW;
  END IF;

  -- Ne traiter que les dons >= 6€ avec email valide
  IF NEW.amount < 6 OR NEW.supporter_email IS NULL THEN
    RETURN NEW;
  END IF;

  -- Construire le payload JSON avec toutes les données nécessaires
  payload := json_build_object(
    'event', 'receipt.generate',
    'transaction_id', NEW.id,
    'receipt_number', NEW.receipt_number,
    'amount', NEW.amount,
    'payment_method', NEW.payment_method,
    'calendar_accepted', NEW.calendar_accepted,
    'created_at', NEW.created_at,
    'donor', json_build_object(
      'email', NEW.supporter_email,
      'name', NEW.supporter_name,
      'first_name', NEW.donor_first_name,
      'last_name', NEW.donor_last_name,
      'address', NEW.donor_address,
      'zip', NEW.donor_zip,
      'city', NEW.donor_city
    ),
    'receipt_url', NEW.receipt_url,
    'user_id', NEW.user_id,
    'tournee_id', NEW.tournee_id
  );

  -- Envoyer la requête POST vers n8n (asynchrone, non bloquant)
  BEGIN
    SELECT * INTO response FROM http_post(
      webhook_url,
      payload::TEXT,
      'application/json'
    );

    -- Logger le résultat (optionnel)
    IF response.status >= 200 AND response.status < 300 THEN
      RAISE NOTICE 'Webhook n8n envoyé avec succès pour transaction %: HTTP %', NEW.id, response.status;
    ELSE
      RAISE WARNING 'Webhook n8n échec pour transaction %: HTTP %', NEW.id, response.status;
    END IF;

  EXCEPTION WHEN OTHERS THEN
    -- Ne pas bloquer l'insertion si le webhook échoue
    RAISE WARNING 'Erreur lors de l''envoi webhook n8n pour transaction %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Créer le trigger sur support_transactions
DROP TRIGGER IF EXISTS support_transactions_n8n_webhook_trigger ON support_transactions;
CREATE TRIGGER support_transactions_n8n_webhook_trigger
  AFTER INSERT ON support_transactions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_n8n_pdf_generation();

-- 4. Fonction helper pour configurer l'URL du webhook (à exécuter après migration)
-- Usage: SELECT set_n8n_webhook_url('https://votre-instance-n8n.com/webhook/receipt-pdf');
CREATE OR REPLACE FUNCTION set_n8n_webhook_url(url TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Sauvegarder dans une table de configuration ou utiliser ALTER DATABASE
  -- Pour l'instant, on utilise une approche simple avec une table dédiée
  
  -- Créer la table si elle n'existe pas
  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Insérer ou mettre à jour l'URL
  INSERT INTO app_settings (key, value, updated_at)
  VALUES ('n8n_webhook_url', url, NOW())
  ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value, updated_at = NOW();

  RETURN 'URL webhook n8n configurée avec succès: ' || url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Fonction pour récupérer l'URL (utilisée par le trigger)
CREATE OR REPLACE FUNCTION get_n8n_webhook_url()
RETURNS TEXT AS $$
DECLARE
  webhook_url TEXT;
BEGIN
  SELECT value INTO webhook_url
  FROM app_settings
  WHERE key = 'n8n_webhook_url';
  
  RETURN webhook_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Modifier le trigger pour utiliser la fonction get_n8n_webhook_url()
CREATE OR REPLACE FUNCTION trigger_n8n_pdf_generation()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT;
  payload JSON;
  response http_response;
BEGIN
  -- Récupérer l'URL du webhook depuis app_settings
  webhook_url := get_n8n_webhook_url();
  
  -- Si pas de webhook configuré, logger et skip
  IF webhook_url IS NULL OR webhook_url = '' THEN
    RAISE NOTICE 'N8N_WEBHOOK_URL non configuré, skip génération PDF pour transaction %', NEW.id;
    RETURN NEW;
  END IF;

  -- Ne traiter que les dons >= 6€ avec email valide
  IF NEW.amount < 6 OR NEW.supporter_email IS NULL THEN
    RETURN NEW;
  END IF;

  -- Construire le payload JSON avec toutes les données nécessaires
  payload := json_build_object(
    'event', 'receipt.generate',
    'transaction_id', NEW.id,
    'receipt_number', NEW.receipt_number,
    'amount', NEW.amount,
    'payment_method', NEW.payment_method,
    'calendar_accepted', NEW.calendar_accepted,
    'created_at', NEW.created_at,
    'donor', json_build_object(
      'email', NEW.supporter_email,
      'name', NEW.supporter_name,
      'first_name', NEW.donor_first_name,
      'last_name', NEW.donor_last_name,
      'address', NEW.donor_address,
      'zip', NEW.donor_zip,
      'city', NEW.donor_city
    ),
    'receipt_url', NEW.receipt_url,
    'user_id', NEW.user_id,
    'tournee_id', NEW.tournee_id
  );

  -- Envoyer la requête POST vers n8n (asynchrone, non bloquant)
  BEGIN
    SELECT * INTO response FROM http_post(
      webhook_url,
      payload::TEXT,
      'application/json'
    );

    -- Logger le résultat (optionnel)
    IF response.status >= 200 AND response.status < 300 THEN
      RAISE NOTICE 'Webhook n8n envoyé avec succès pour transaction %: HTTP %', NEW.id, response.status;
    ELSE
      RAISE WARNING 'Webhook n8n échec pour transaction %: HTTP %', NEW.id, response.status;
    END IF;

  EXCEPTION WHEN OTHERS THEN
    -- Ne pas bloquer l'insertion si le webhook échoue
    RAISE WARNING 'Erreur lors de l''envoi webhook n8n pour transaction %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION trigger_n8n_pdf_generation() IS 'Envoie un webhook POST vers n8n pour générer le PDF du reçu fiscal via Gotenberg';
COMMENT ON FUNCTION set_n8n_webhook_url(TEXT) IS 'Configure l''URL du webhook n8n pour la génération de PDF';
COMMENT ON FUNCTION get_n8n_webhook_url() IS 'Récupère l''URL du webhook n8n depuis app_settings';
