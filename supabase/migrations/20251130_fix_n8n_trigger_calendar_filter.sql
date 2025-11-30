-- Migration: Fix n8n trigger - Remove incorrect calendar_accepted filter
-- Date: 2025-11-30
-- Description: Correction suite à précision métier importante
--
-- CONTEXTE :
-- Le calendrier a une valeur de ~1,33€ (contrepartie).
-- Selon la loi fiscale française, un don AVEC contrepartie reste éligible
-- au reçu fiscal SI :
--   - Valeur contrepartie < 25% du don
--   - Valeur contrepartie < 73€
--
-- DONC : Tous les dons >= 6€ ont droit à un reçu fiscal, AVEC ou SANS calendrier.
-- La différence est dans le montant déductible :
--   - calendar_accepted = false → Déduction sur 100% du montant (don pur)
--   - calendar_accepted = true → Déduction sur (montant - 1,33€) (don avec contrepartie)
--
-- ERREUR DANS LA MIGRATION PRÉCÉDENTE :
-- La migration 20251130_fix_n8n_trigger_use_pg_net.sql ajoutait un filtre
-- "OR NEW.calendar_accepted = true" qui excluait les dons avec calendrier.
-- Cette migration corrige cette erreur.

-- =====================================================
-- CORRIGER LA FONCTION TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_n8n_pdf_generation()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT;
  payload JSONB;
  request_id BIGINT;
BEGIN
  -- Get webhook URL from n8n_settings
  webhook_url := get_n8n_webhook_url();

  -- If webhook not configured, log and skip
  IF webhook_url IS NULL OR webhook_url = '' THEN
    RAISE NOTICE 'N8N_WEBHOOK_URL non configuré, skip génération PDF pour transaction %', NEW.id;
    RETURN NEW;
  END IF;

  -- FILTRE CORRECT : Tous les dons >= 6€ avec email valide
  -- AVEC ou SANS calendrier (la valeur du calendrier sera déduite du montant déductible)
  IF NEW.amount < 6 OR NEW.supporter_email IS NULL THEN
    RETURN NEW;
  END IF;

  -- Build JSON payload with all donor information
  -- IMPORTANT : Inclure calendar_accepted pour que n8n calcule le montant déductible
  payload := jsonb_build_object(
    'event', 'receipt.generate',
    'transaction_id', NEW.id,
    'receipt_number', NEW.receipt_number,
    'amount', NEW.amount,
    'payment_method', NEW.payment_method,
    'calendar_accepted', NEW.calendar_accepted,  -- ← CRUCIAL pour calcul fiscal
    'calendar_value', 1.33,                      -- ← Valeur de la contrepartie
    'created_at', NEW.created_at,
    'donor', jsonb_build_object(
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
    'tournee_id', NEW.tournee_id,
    -- Calcul du montant déductible (pour info, n8n peut recalculer)
    'deductible_amount', CASE
      WHEN NEW.calendar_accepted = true THEN NEW.amount - 1.33
      ELSE NEW.amount
    END,
    'tax_reduction', CASE
      WHEN NEW.calendar_accepted = true THEN ROUND((NEW.amount - 1.33) * 0.66, 2)
      ELSE ROUND(NEW.amount * 0.66, 2)
    END
  );

  -- Send POST request via pg_net (asynchronous, non-blocking)
  BEGIN
    SELECT net.http_post(
      url := webhook_url,
      body := payload,
      headers := '{"Content-Type": "application/json"}'::jsonb
    ) INTO request_id;

    RAISE NOTICE 'Webhook n8n envoyé (pg_net request_id: %) pour transaction % (amount: %€, calendar: %)',
      request_id, NEW.id, NEW.amount, NEW.calendar_accepted;

    -- Log the request in webhook_logs for observability
    INSERT INTO webhook_logs (source, event_type, payload, status)
    VALUES ('pg_net_trigger', 'receipt.generate', payload, 'sent');

  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't block the transaction insertion
    RAISE WARNING 'Erreur lors de l''envoi webhook n8n pour transaction %: %', NEW.id, SQLERRM;

    -- Log error in webhook_logs
    INSERT INTO webhook_logs (source, event_type, payload, status, error_message)
    VALUES ('pg_net_trigger', 'receipt.generate', payload, 'error', SQLERRM);
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION trigger_n8n_pdf_generation() IS 'Envoie un webhook POST asynchrone vers n8n via pg_net pour générer le PDF du reçu fiscal. Filtre: amount >= 6€ (avec ou sans calendrier). Le montant déductible est calculé en fonction de calendar_accepted (valeur calendrier = 1,33€)';

-- =====================================================
-- DOCUMENTATION DES RÈGLES FISCALES
-- =====================================================

COMMENT ON COLUMN support_transactions.calendar_accepted IS 'Indique si un calendrier a été remis. Valeur du calendrier: ~1,33€. TOUS les dons >= 6€ ont droit au reçu fiscal. Le montant déductible = amount - (calendar_accepted ? 1.33 : 0)';

COMMENT ON COLUMN support_transactions.tax_reduction IS 'ATTENTION: Cette colonne calculée ne prend PAS en compte la valeur du calendrier ! Elle calcule tax_reduction = amount * 0.66 si calendar_accepted = false. Pour le calcul fiscal exact, utiliser: (amount - (calendar_accepted ? 1.33 : 0)) * 0.66';

-- =====================================================
-- EXEMPLE DE CALCUL FISCAL
-- =====================================================

-- Exemple 1: Don pur de 10€ (sans calendrier)
-- amount = 10€
-- calendar_accepted = false
-- montant_déductible = 10€
-- réduction_impôt = 10€ × 66% = 6,60€

-- Exemple 2: Don de 10€ avec calendrier
-- amount = 10€
-- calendar_accepted = true
-- valeur_calendrier = 1,33€
-- montant_déductible = 10€ - 1,33€ = 8,67€
-- réduction_impôt = 8,67€ × 66% = 5,72€

-- Exemple 3: Don de 6€ avec calendrier (limite basse)
-- amount = 6€
-- calendar_accepted = true
-- valeur_calendrier = 1,33€
-- montant_déductible = 6€ - 1,33€ = 4,67€
-- réduction_impôt = 4,67€ × 66% = 3,08€
-- ✅ Reste éligible car 1,33€ < 25% de 6€ (1,50€) et < 73€

-- =====================================================
-- REQUÊTE DE VÉRIFICATION
-- =====================================================

-- Vérifier que le trigger n'exclut plus les dons avec calendrier
-- Cette requête devrait retourner TRUE pour tous les dons >= 6€
SELECT
  id,
  amount,
  calendar_accepted,
  supporter_email,
  CASE
    WHEN amount >= 6 AND supporter_email IS NOT NULL THEN '✅ Éligible trigger n8n'
    WHEN amount < 6 THEN '❌ Montant < 6€'
    WHEN supporter_email IS NULL THEN '❌ Pas d''email'
    ELSE '⚠️  Autre raison'
  END as trigger_eligibility,
  CASE
    WHEN calendar_accepted = false THEN amount
    ELSE amount - 1.33
  END as montant_deductible,
  CASE
    WHEN calendar_accepted = false THEN ROUND(amount * 0.66, 2)
    ELSE ROUND((amount - 1.33) * 0.66, 2)
  END as reduction_impot
FROM support_transactions
WHERE amount >= 6
  AND supporter_email IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
