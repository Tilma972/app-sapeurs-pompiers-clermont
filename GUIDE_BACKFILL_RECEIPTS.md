# Guide - Génération des reçus fiscaux manquants (Backfill)

**Date :** 2025-11-30
**Objectif :** Générer les PDFs de reçus fiscaux pour les transactions existantes qui n'ont pas encore été traitées

---

## 📋 Contexte

Le trigger PostgreSQL `support_transactions_n8n_webhook_trigger` ne se déclenche **QUE sur les nouvelles insertions** (`AFTER INSERT`).

Les transactions déjà présentes dans la base de données **ne déclenchent PAS automatiquement** le trigger.

**Solution :** Utiliser le script de backfill pour retraiter manuellement les transactions existantes.

---

## 🔧 Prérequis

Avant d'exécuter le backfill, assurez-vous que :

1. ✅ Les migrations ont été appliquées :
   - `20251130_fix_n8n_trigger_use_pg_net.sql`
   - `20251130_fix_n8n_trigger_calendar_filter.sql`

2. ✅ L'extension `pg_net` est activée :
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_net';
   ```

3. ✅ L'URL du webhook n8n est configurée :
   ```sql
   SELECT set_n8n_webhook_url('https://n8n.dsolution-ia.fr/webhook/receipt-pdf');
   SELECT * FROM n8n_settings WHERE key = 'n8n_webhook_url';
   ```

4. ✅ Le workflow n8n est actif et prêt à recevoir des requêtes

---

## 📊 Étape 1 : Analyse de la situation

### 1.1. Vérifier combien de transactions sont éligibles

```sql
-- Total de transactions éligibles au reçu fiscal
SELECT
  COUNT(*) as total_transactions_eligibles,
  SUM(amount) as montant_total,
  MIN(created_at) as premiere_transaction,
  MAX(created_at) as derniere_transaction
FROM support_transactions
WHERE amount >= 6
  AND supporter_email IS NOT NULL;
```

**Résultat attendu :**
```
total_transactions_eligibles | montant_total | premiere_transaction | derniere_transaction
-----------------------------|---------------|---------------------|---------------------
           42                |    523.50     | 2025-01-15          | 2025-11-30
```

### 1.2. Vérifier combien ont déjà un reçu généré

```sql
SELECT
  COUNT(*) as transactions_avec_recu,
  COUNT(*) FILTER (WHERE calendar_accepted = false) as dons_purs,
  COUNT(*) FILTER (WHERE calendar_accepted = true) as dons_avec_calendrier
FROM support_transactions
WHERE amount >= 6
  AND supporter_email IS NOT NULL
  AND receipt_generated IS NOT NULL;
```

### 1.3. Vérifier combien n'ont PAS de reçu généré

```sql
SELECT
  COUNT(*) as transactions_sans_recu,
  SUM(amount) as montant_total,
  COUNT(*) FILTER (WHERE calendar_accepted = false) as dons_purs,
  COUNT(*) FILTER (WHERE calendar_accepted = true) as dons_avec_calendrier
FROM support_transactions
WHERE amount >= 6
  AND supporter_email IS NOT NULL
  AND receipt_generated IS NULL;
```

**Résultat attendu :**
```
transactions_sans_recu | montant_total | dons_purs | dons_avec_calendrier
-----------------------|---------------|-----------|---------------------
          15           |    187.50     |     8     |          7
```

**⚠️ Si `dons_avec_calendrier > 0`**, cela confirme que le webhook Stripe a exclu les dons avec calendrier (bug identifié dans l'addendum).

### 1.4. Liste détaillée des transactions sans reçu

```sql
SELECT
  id,
  amount,
  calendar_accepted,
  supporter_email,
  supporter_name,
  payment_method,
  receipt_generated,
  receipt_sent,
  created_at,
  CASE
    WHEN calendar_accepted = false THEN amount * 0.66
    ELSE (amount - 1.33) * 0.66
  END as reduction_impot_attendue
FROM support_transactions
WHERE amount >= 6
  AND supporter_email IS NOT NULL
  AND receipt_generated IS NULL
ORDER BY created_at ASC
LIMIT 10;
```

---

## 🚀 Étape 2 : Appliquer le script de backfill

### 2.1. Charger le script

```sql
\i supabase/migrations/BACKFILL_generate_missing_receipts.sql
```

Cela crée 2 fonctions :
- `backfill_send_receipt_webhook(transaction_id)` - Traiter une transaction
- `backfill_all_missing_receipts()` - Traiter toutes les transactions manquantes

---

## 🧪 Étape 3 : Tester sur une seule transaction

**Recommandation :** Testez d'abord sur **une seule transaction** avant de traiter toutes.

```sql
-- Récupérer l'ID de la première transaction sans reçu
SELECT id, amount, supporter_email, calendar_accepted
FROM support_transactions
WHERE amount >= 6
  AND supporter_email IS NOT NULL
  AND receipt_generated IS NULL
ORDER BY created_at ASC
LIMIT 1;

-- Copier l'ID et exécuter :
SELECT * FROM backfill_send_receipt_webhook('REMPLACER_PAR_UUID_ICI');
```

**Résultat attendu :**
```
transaction_id                        | status | message                           | request_id
--------------------------------------|--------|-----------------------------------|------------
a1b2c3d4-e5f6-7890-abcd-ef1234567890 | sent   | Webhook envoyé (request_id: 123) | 123
```

### 3.1. Vérifier que n8n a reçu le webhook

1. Aller sur **https://n8n.dsolution-ia.fr**
2. Ouvrir le workflow **receipt-pdf**
3. Vérifier les **exécutions** (Executions)
4. Vous devriez voir une nouvelle exécution avec :
   - `event: 'receipt.generate'`
   - `transaction_id: <UUID de la transaction test>`
   - `backfill: true` (flag indiquant que c'est un rattrapage)

### 3.2. Vérifier que le PDF a été généré

- Vérifier dans Gotenberg que le PDF a été généré
- Vérifier que l'email a été envoyé au donateur
- Vérifier le log dans `webhook_logs` :

```sql
SELECT
  id,
  source,
  status,
  error_message,
  payload->>'transaction_id' as transaction_id,
  payload->'donor'->>'email' as donor_email,
  created_at
FROM webhook_logs
WHERE source = 'backfill_manual'
ORDER BY created_at DESC
LIMIT 5;
```

---

## 📦 Étape 4 : Traiter toutes les transactions manquantes

### Option A : Traiter TOUT en une seule fois

⚠️ **ATTENTION** : Si vous avez beaucoup de transactions (>100), cela peut prendre du temps.

```sql
SELECT * FROM backfill_all_missing_receipts();
```

**Résultat attendu :**
```
total_eligible | total_sent | total_skipped | total_errors | details
---------------|------------|---------------|--------------|----------
      15       |     14     |       0       |      1       | [...]
```

**Logs dans la console :**
```
NOTICE:  === BACKFILL - Génération des reçus fiscaux manquants ===
NOTICE:  [1/15] ✅ Envoyé - Transaction a1b2c3d4-...
NOTICE:  [2/15] ✅ Envoyé - Transaction b2c3d4e5-...
...
NOTICE:  [15/15] ❌ Erreur - Transaction f6a7b8c9-... : connection timeout
NOTICE:  === RÉSUMÉ ===
NOTICE:  Total éligible : 15
NOTICE:  Envoyés avec succès : 14
NOTICE:  Ignorés : 0
NOTICE:  Erreurs : 1
```

### Option B : Traiter par petits lots

Si vous avez beaucoup de transactions, il est recommandé de traiter par lots :

```sql
-- Traiter les 10 premières transactions
DO $$
DECLARE
  v_tx_id UUID;
  v_count INTEGER := 0;
BEGIN
  FOR v_tx_id IN (
    SELECT id FROM support_transactions
    WHERE amount >= 6
      AND supporter_email IS NOT NULL
      AND receipt_generated IS NULL
    ORDER BY created_at ASC
    LIMIT 10  -- ← Limiter à 10
  ) LOOP
    PERFORM backfill_send_receipt_webhook(v_tx_id);
    v_count := v_count + 1;
    RAISE NOTICE 'Traité % transactions', v_count;
    PERFORM pg_sleep(0.2);  -- Pause de 200ms entre chaque
  END LOOP;
  RAISE NOTICE 'TERMINÉ - % transactions traitées', v_count;
END $$;
```

**Puis augmenter progressivement :**
- Lot 1 : 10 transactions
- Lot 2 : 20 transactions
- Lot 3 : 50 transactions
- Etc.

### Option C : Traiter uniquement les dons avec calendrier

Si vous voulez d'abord traiter uniquement les dons avec calendrier (qui ont été exclus par le webhook Stripe) :

```sql
DO $$
DECLARE
  v_tx_id UUID;
  v_count INTEGER := 0;
BEGIN
  FOR v_tx_id IN (
    SELECT id FROM support_transactions
    WHERE amount >= 6
      AND supporter_email IS NOT NULL
      AND calendar_accepted = true  -- ← Uniquement les dons avec calendrier
      AND receipt_generated IS NULL
    ORDER BY created_at ASC
  ) LOOP
    PERFORM backfill_send_receipt_webhook(v_tx_id);
    v_count := v_count + 1;
    RAISE NOTICE 'Traité % dons avec calendrier', v_count;
    PERFORM pg_sleep(0.1);
  END LOOP;
  RAISE NOTICE 'TERMINÉ - % dons avec calendrier traités', v_count;
END $$;
```

---

## 📊 Étape 5 : Vérifier les résultats

### 5.1. Vérifier les webhooks envoyés lors du backfill

```sql
SELECT
  id,
  source,
  event_type,
  status,
  error_message,
  payload->>'transaction_id' as transaction_id,
  payload->'donor'->>'email' as donor_email,
  payload->>'amount' as amount,
  created_at
FROM webhook_logs
WHERE source = 'backfill_manual'
ORDER BY created_at DESC
LIMIT 20;
```

### 5.2. Taux de succès du backfill

```sql
SELECT
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM webhook_logs
WHERE source = 'backfill_manual'
GROUP BY status;
```

**Résultat attendu :**
```
status  | count | percentage
--------|-------|------------
sent    |  14   |   93.33
error   |   1   |    6.67
```

### 5.3. Transactions qui ont échoué lors du backfill

```sql
SELECT
  wl.payload->>'transaction_id' as transaction_id,
  wl.error_message,
  st.amount,
  st.supporter_email,
  st.created_at
FROM webhook_logs wl
JOIN support_transactions st ON st.id::text = wl.payload->>'transaction_id'
WHERE wl.source = 'backfill_manual'
  AND wl.status = 'error'
ORDER BY wl.created_at DESC;
```

**Action :** Pour les transactions en erreur, vous pouvez :
1. Analyser l'erreur (`error_message`)
2. Corriger le problème (webhook n8n inactif, Gotenberg down, etc.)
3. Relancer le backfill pour ces transactions spécifiques :
   ```sql
   SELECT * FROM backfill_send_receipt_webhook('<UUID_TRANSACTION_EN_ERREUR>');
   ```

### 5.4. Vérifier que toutes les transactions ont maintenant un reçu

```sql
-- Doit retourner 0
SELECT COUNT(*)
FROM support_transactions
WHERE amount >= 6
  AND supporter_email IS NOT NULL
  AND receipt_generated IS NULL;
```

---

## ⚙️ Étape 6 : Automatisation (optionnel)

Si vous voulez automatiser le backfill pour les transactions qui pourraient manquer à l'avenir :

### Option 1 : Créer un cron job (via pg_cron)

```sql
-- Installer pg_cron (si disponible dans Supabase)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Lancer le backfill tous les jours à 2h du matin
SELECT cron.schedule(
  'backfill-receipts',
  '0 2 * * *',  -- Tous les jours à 2h00
  $$SELECT * FROM backfill_all_missing_receipts()$$
);
```

### Option 2 : Créer une Supabase Edge Function

Créer une Edge Function qui :
1. Se déclenche via un cron (Supabase Cron)
2. Appelle `backfill_all_missing_receipts()`
3. Envoie une notification Slack/email avec le résultat

---

## 🧹 Étape 7 : Nettoyage (optionnel)

Si vous voulez supprimer les fonctions de backfill après utilisation :

```sql
DROP FUNCTION IF EXISTS backfill_send_receipt_webhook(UUID);
DROP FUNCTION IF EXISTS backfill_all_missing_receipts();
```

**⚠️ Recommandation :** Gardez ces fonctions pour pouvoir relancer le backfill en cas de problème.

---

## ❓ FAQ

### Q1 : Combien de temps prend le backfill ?

**Réponse :** Environ **0,1 à 0,2 secondes par transaction** (pause de 100ms entre chaque + temps de traitement).

**Exemples :**
- 10 transactions → ~2 secondes
- 50 transactions → ~10 secondes
- 100 transactions → ~20 secondes
- 500 transactions → ~2 minutes

### Q2 : Est-ce que le backfill envoie des doublons ?

**Réponse :** **Non**, le backfill envoie les webhooks, mais c'est **n8n qui doit gérer l'idempotence**.

**Recommandation :** Dans le workflow n8n, ajoutez une étape qui vérifie si le PDF a déjà été généré pour cette `transaction_id` avant de régénérer.

### Q3 : Que se passe-t-il si une transaction échoue ?

**Réponse :** La fonction capture l'erreur et la logue dans `webhook_logs` avec `status = 'error'`. Les autres transactions continuent d'être traitées.

Vous pouvez relancer le backfill uniquement pour les transactions en erreur.

### Q4 : Est-ce que le backfill met à jour `receipt_generated` dans `support_transactions` ?

**Réponse :** **Non**, le backfill envoie uniquement le webhook à n8n. C'est **n8n qui doit mettre à jour** la table `support_transactions` après avoir généré le PDF.

**Workflow n8n recommandé :**
1. Recevoir le webhook
2. Générer le PDF via Gotenberg
3. Uploader le PDF sur Supabase Storage
4. Envoyer l'email avec le PDF
5. **Mettre à jour** `support_transactions` :
   ```sql
   UPDATE support_transactions
   SET receipt_generated = NOW(),
       receipt_url = '<url_du_pdf>',
       receipt_sent = true
   WHERE id = '<transaction_id>';
   ```

### Q5 : Peut-on filtrer le backfill par date ?

**Réponse :** **Oui**, modifiez la requête dans `backfill_all_missing_receipts()` :

```sql
-- Traiter uniquement les transactions de novembre 2025
SELECT id FROM support_transactions
WHERE amount >= 6
  AND supporter_email IS NOT NULL
  AND receipt_generated IS NULL
  AND created_at >= '2025-11-01'
  AND created_at < '2025-12-01'
ORDER BY created_at ASC;
```

---

## 📝 Checklist finale

Avant de lancer le backfill en production :

- [ ] ✅ Migrations appliquées (`pg_net`, trigger corrigé)
- [ ] ✅ URL webhook n8n configurée
- [ ] ✅ Workflow n8n actif et testé
- [ ] ✅ Gotenberg disponible et opérationnel
- [ ] ✅ Test sur une seule transaction réussi
- [ ] ✅ Email de test reçu avec le PDF correct
- [ ] ✅ Logs `webhook_logs` vérifiés
- [ ] ✅ Backup de la base de données effectué (au cas où)
- [ ] ✅ Notification prévue pour informer les utilisateurs (si besoin)

---

## 🎯 Ordre des opérations recommandé

1. **Appliquer les migrations de correction du trigger**
2. **Configurer l'URL webhook n8n**
3. **Tester le trigger sur une nouvelle transaction** (via `TEST_n8n_trigger_manual.sql`)
4. **Analyser les transactions existantes** (combien manquent de reçu ?)
5. **Tester le backfill sur UNE transaction**
6. **Vérifier que n8n a bien généré le PDF et envoyé l'email**
7. **Lancer le backfill sur toutes les transactions manquantes**
8. **Vérifier les résultats et relancer pour les erreurs**
9. **Confirmer que toutes les transactions ont leur reçu**

---

**FIN DU GUIDE**

Pour toute question ou problème, consultez :
- `AUDIT_FISCAL_RECEIPT_GENERATION.md` - Audit complet du système
- `AUDIT_FISCAL_RECEIPT_GENERATION_ADDENDUM.md` - Corrections sur la règle métier calendrier
- `supabase/migrations/TEST_n8n_trigger_manual.sql` - Tests du trigger
- `supabase/migrations/DIAGNOSTIC_n8n_trigger_audit.sql` - Diagnostic du système
