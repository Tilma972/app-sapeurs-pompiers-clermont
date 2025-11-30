# Audit - Génération de reçus fiscaux via trigger n8n

**Date :** 2025-11-30
**Auditeur :** Claude
**Contexte :** Investigation du pipeline de génération de reçus fiscaux PDF via webhook n8n

---

## 📋 Résumé exécutif

### Problème rapporté
- ✅ Les transactions sont bien insérées dans `support_transactions`
- ✅ Les données sont correctes (montant, email, etc.)
- ❌ **AUCUN payload n'est envoyé au webhook n8n** : `https://n8n.dsolution-ia.fr/webhook/receipt-pdf`
- ❌ Aucun PDF de reçu fiscal n'est généré via n8n

### Cause racine identifiée
**Le trigger PostgreSQL ne peut PAS fonctionner car l'extension `http` n'est PAS disponible dans Supabase hosted.**

### Impact
- Le système de génération de PDF via n8n/Gotenberg est **entièrement non fonctionnel**
- Les reçus fiscaux sont actuellement générés par le webhook Stripe via la fonction `issue_receipt()` (système de secours fonctionnel)
- **Double système de génération de reçus** : conflit potentiel entre webhook Stripe et trigger n8n

---

## 🔍 État des lieux détaillé

### 1. Extension HTTP PostgreSQL ❌ BLOQUANT

**Fichier :** `supabase/migrations/20251111_webhook_trigger_n8n_pdf.sql:6`

```sql
-- 1. Activer l'extension http si pas déjà fait
CREATE EXTENSION IF NOT EXISTS http;
```

**Problème identifié :**
- ❌ L'extension `http` (pgsql-http) **n'est PAS autorisée dans Supabase hosted** pour des raisons de sécurité
- ❌ La fonction `http_post()` utilisée dans le trigger **n'existe donc pas**
- ❌ Le trigger échoue silencieusement à chaque insertion (bloc `EXCEPTION WHEN OTHERS` ligne 184-187)

**Preuve dans le code :** `supabase/migrations/20251111_webhook_trigger_n8n_pdf.sql:56-60`
```sql
SELECT * INTO response FROM http_post(
  webhook_url,
  payload::TEXT,
  'application/json'
);
```

**Alternatives disponibles dans Supabase :**
1. ✅ **`pg_net`** : Extension HTTP approuvée par Supabase (asynchrone, non bloquante)
2. ✅ **Edge Functions** : Déclenchement via webhook Supabase Database
3. ✅ **Realtime Webhooks** : Supabase peut envoyer des webhooks sur INSERT automatiquement

---

### 2. Trigger PostgreSQL ⚠️ EXISTE MAIS DÉFAILLANT

**Fichier :** `supabase/migrations/20251111_webhook_trigger_n8n_pdf.sql:78-83`

```sql
DROP TRIGGER IF EXISTS support_transactions_n8n_webhook_trigger ON support_transactions;
CREATE TRIGGER support_transactions_n8n_webhook_trigger
  AFTER INSERT ON support_transactions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_n8n_pdf_generation();
```

**État :**
- ✅ Le trigger **EXISTE** (migration appliquée le 11 novembre 2024)
- ✅ Le trigger est **ACTIF** sur la table `support_transactions`
- ❌ Le trigger **ÉCHOUE À CHAQUE EXÉCUTION** car `http_post()` n'existe pas
- ⚠️  Les erreurs sont **avalées silencieusement** par le bloc `EXCEPTION WHEN OTHERS`

**Conditions de déclenchement :** `supabase/migrations/20251111_webhook_trigger_n8n_pdf.sql:141-144`
```sql
-- Ne traiter que les dons >= 6€ avec email valide
IF NEW.amount < 6 OR NEW.supporter_email IS NULL THEN
  RETURN NEW;
END IF;
```

**Règle métier :**
- ✅ Se déclenche sur `INSERT` uniquement (pas sur `UPDATE`)
- ✅ Filtre : `amount >= 6€` ET `supporter_email IS NOT NULL`
- ⚠️  **Pas de filtre sur `calendar_accepted`** → le trigger envoie pour TOUS les dons >= 6€, même les soutiens avec calendrier

---

### 3. Configuration webhook n8n ⚠️ INCOMPLÈTE

**Fichier :** `supabase/migrations/20251124_fix_n8n_webhook_settings.sql:6-10`

```sql
CREATE TABLE IF NOT EXISTS public.n8n_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**État :**
- ✅ La table `n8n_settings` **EXISTE** (migration appliquée le 24 novembre 2024)
- ⚠️  L'URL du webhook **n'est probablement PAS configurée** dans cette table

**Vérification requise :**
```sql
SELECT * FROM n8n_settings WHERE key = 'n8n_webhook_url';
-- Si vide, exécuter :
-- SELECT set_n8n_webhook_url('https://n8n.dsolution-ia.fr/webhook/receipt-pdf');
```

**Impact :**
- Même si l'extension `http` était disponible, le trigger skipperait les envois si l'URL n'est pas configurée
- Le trigger afficherait : `RAISE NOTICE 'N8N_WEBHOOK_URL non configuré, skip génération PDF'` (ligne 137)

---

### 4. Structure de `support_transactions` ✅ CORRECTE

**Fichier :** `supabase/migrations/006_feature_fiscal_support.sql:12-69`

**Colonnes clés pour reçus fiscaux :**
```sql
amount DECIMAL(8, 2) NOT NULL CHECK (amount > 0),
calendar_accepted BOOLEAN NOT NULL DEFAULT true,
tax_deductible BOOLEAN GENERATED ALWAYS AS (calendar_accepted = false) STORED,
tax_reduction DECIMAL(6, 2) GENERATED ALWAYS AS (
  CASE WHEN calendar_accepted = false THEN ROUND(amount * 0.66, 2) ELSE 0 END
) STORED,
supporter_email TEXT,
receipt_number TEXT UNIQUE,
receipt_generated BOOLEAN DEFAULT false,
receipt_sent BOOLEAN DEFAULT false,
receipt_url TEXT,
```

**Règles métier attendues :**
- ✅ `calendar_accepted = false` → Don fiscal (éligible reçu fiscal)
- ✅ `calendar_accepted = true` → Soutien avec calendrier (PAS éligible reçu fiscal)
- ✅ `amount >= 6.00€` → Montant minimum pour reçu fiscal
- ✅ `supporter_email IS NOT NULL` → Email obligatoire pour don fiscal (contrainte ligne 65-68)

---

### 5. Double système de génération ⚠️ CONFLIT

#### Système 1 : Webhook Stripe (ACTUEL - FONCTIONNEL) ✅

**Fichier :** `app/api/webhooks/stripe/route.ts:98-123`

```typescript
// Générer un reçu fiscal UNIQUEMENT pour les dons (calendar_accepted: false)
// Boutique et achats avec contrepartie n'ont PAS droit au reçu fiscal
if (tx && amount >= 6 && !calendarAccepted) {
  const { data: rec } = await admin.rpc('issue_receipt', { p_transaction_id: tx.id }).single()
  const receiptNumber = (rec as { receipt_number?: string } | null)?.receipt_number ?? null

  // Persist receipt generation metadata
  const receiptUrl = receiptNumber
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/recu/${receiptNumber}`
    : null
  await admin
    .from('support_transactions')
    .update({ receipt_generated: new Date().toISOString(), receipt_url: receiptUrl })
    .eq('id', tx.id)

  if (donorEmail) {
    // Envoie l'email avec le reçu via Resend
    await sendEmail({ to: donorEmail, subject, html, text })
    await admin
      .from('support_transactions')
      .update({ receipt_sent: true })
      .eq('id', tx.id)
  }
}
```

**Fonctionnement :**
1. ✅ Le webhook Stripe insère la transaction dans `support_transactions`
2. ✅ Si `amount >= 6€` ET `calendar_accepted = false`, appelle `issue_receipt(transaction_id)`
3. ✅ `issue_receipt()` crée une ligne dans la table `receipts` avec un numéro unique (ex: `2025-SP-001`)
4. ✅ Met à jour `receipt_generated`, `receipt_url` dans `support_transactions`
5. ✅ Envoie un email avec le lien vers le reçu (via Resend)
6. ✅ Met à jour `receipt_sent = true`

**Limitations :**
- ❌ Le reçu n'est **PAS un PDF** → c'est juste un numéro + lien vers une page web
- ❌ Pas de génération de PDF via Gotenberg
- ❌ Le "reçu fiscal" actuel est une page HTML dynamique `/recu/[receipt_number]`

---

#### Système 2 : Trigger PostgreSQL → n8n → Gotenberg (PRÉVU - NON FONCTIONNEL) ❌

**Fichier :** `supabase/migrations/20251111_webhook_trigger_n8n_pdf.sql:125-191`

**Fonctionnement prévu :**
1. ⚠️  Trigger PostgreSQL détecte `INSERT` sur `support_transactions`
2. ❌ Construit un payload JSON avec toutes les données du donateur
3. ❌ Envoie une requête POST au webhook n8n via `http_post()`
4. ❌ n8n reçoit le payload et génère un PDF via Gotenberg
5. ❌ n8n envoie le PDF par email au donateur
6. ❌ n8n met à jour la transaction avec le lien du PDF

**Pourquoi ça ne fonctionne pas :**
- ❌ Extension `http` non disponible → `http_post()` n'existe pas
- ❌ Le trigger échoue silencieusement (erreur capturée par `EXCEPTION WHEN OTHERS`)
- ❌ Aucun log d'erreur visible dans les logs PostgreSQL (seulement `RAISE WARNING`)
- ❌ Le webhook n8n ne reçoit **jamais** de requête

---

## 🧪 Analyse d'une transaction test

### Scénario de test

**Transaction test :**
```sql
INSERT INTO support_transactions (
  user_id,
  tournee_id,
  amount,
  calendar_accepted,
  payment_method,
  payment_status,
  supporter_email,
  supporter_name
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890', -- user_id fictif
  'b2c3d4e5-f6a7-8901-bcde-f12345678901', -- tournee_id fictif
  10.00, -- amount >= 6€
  false, -- don fiscal (pas de calendrier)
  'carte',
  'completed',
  'test@example.com',
  'Jean Dupont'
);
```

### Ce qui se passe réellement

#### Étape 1 : Insertion dans `support_transactions` ✅
- ✅ La transaction est insérée avec succès
- ✅ `calendar_accepted = false` → Don fiscal
- ✅ `amount = 10.00€` → Éligible reçu fiscal
- ✅ `supporter_email = 'test@example.com'` → Email valide

#### Étape 2 : Déclenchement du trigger n8n ⚠️ → ❌
1. ✅ Le trigger `support_transactions_n8n_webhook_trigger` **SE DÉCLENCHE**
2. ✅ La fonction `trigger_n8n_pdf_generation()` **S'EXÉCUTE**
3. ⚠️  La fonction récupère l'URL du webhook (probablement `NULL` si non configurée)
4. ⚠️  **SI l'URL est `NULL`** : Le trigger affiche `RAISE NOTICE` et s'arrête (pas d'erreur)
5. ❌ **SI l'URL est configurée** : Le trigger essaie d'appeler `http_post()` → **ÉCHEC** (fonction inexistante)
6. ❌ L'exception est capturée par le bloc `EXCEPTION WHEN OTHERS` (ligne 184-187)
7. ⚠️  Le trigger affiche `RAISE WARNING 'Erreur lors de l'envoi webhook n8n pour transaction %: %'`
8. ✅ L'insertion de la transaction **N'EST PAS BLOQUÉE** (le trigger retourne `RETURN NEW`)

**Résultat :**
- ❌ **AUCUN payload envoyé au webhook n8n**
- ❌ **AUCUN PDF généré via Gotenberg**
- ❌ Le donateur ne reçoit **AUCUN reçu fiscal par email**

#### Étape 3 : Génération via webhook Stripe (SI la transaction vient de Stripe) ✅

**SI** la transaction est créée par le webhook Stripe (événement `checkout.session.completed` ou `payment_intent.succeeded`), alors :

1. ✅ Le webhook Stripe appelle `issue_receipt(transaction_id)`
2. ✅ Un numéro de reçu est généré (ex: `2025-0001`)
3. ✅ Une ligne est insérée dans la table `receipts`
4. ✅ Le champ `receipt_url` est mis à jour dans `support_transactions`
5. ✅ Un email est envoyé au donateur avec le lien vers le reçu HTML (PAS de PDF)
6. ✅ `receipt_sent = true`

**MAIS :**
- ❌ Le reçu n'est **PAS un PDF**
- ❌ Gotenberg n'est **jamais appelé**
- ❌ Le workflow n8n n'est **jamais déclenché**

---

## 🚨 Problèmes identifiés (par ordre de priorité)

### 1. 🔴 BLOQUANT - Extension `http` non disponible

**Criticité :** BLOQUANT
**Impact :** Le trigger n8n ne peut **jamais** fonctionner avec l'implémentation actuelle

**Détails :**
- L'extension `pgsql-http` n'est pas disponible dans Supabase hosted
- Supabase n'autorise que les extensions approuvées pour des raisons de sécurité
- Alternative : utiliser `pg_net` (extension Supabase officielle pour requêtes HTTP asynchrones)

**Fichier concerné :** `supabase/migrations/20251111_webhook_trigger_n8n_pdf.sql:6`

**Solution :**
```sql
-- Remplacer :
CREATE EXTENSION IF NOT EXISTS http;

-- Par :
CREATE EXTENSION IF NOT EXISTS pg_net;
```

**Code de la fonction à modifier :** `supabase/migrations/20251111_webhook_trigger_n8n_pdf.sql:171-175`
```sql
-- Remplacer :
SELECT * INTO response FROM http_post(
  webhook_url,
  payload::TEXT,
  'application/json'
);

-- Par (pg_net - asynchrone) :
PERFORM net.http_post(
  url := webhook_url,
  body := payload::jsonb,
  headers := '{"Content-Type": "application/json"}'::jsonb
);
-- Note: pg_net est asynchrone, pas de response immédiate
```

---

### 2. 🟡 WARNING - URL webhook non configurée

**Criticité :** WARNING (non bloquant si extension `http` était disponible)
**Impact :** Le trigger skipperait l'envoi même si l'extension fonctionnait

**Vérification requise :**
```sql
SELECT * FROM n8n_settings WHERE key = 'n8n_webhook_url';
```

**Si la table est vide, exécuter :**
```sql
SELECT set_n8n_webhook_url('https://n8n.dsolution-ia.fr/webhook/receipt-pdf');
```

**Fichier concerné :** `supabase/migrations/20251124_fix_n8n_webhook_settings.sql`

---

### 3. 🟡 WARNING - Erreurs silencieuses dans le trigger

**Criticité :** WARNING
**Impact :** Les erreurs du trigger sont capturées mais non loggées de manière visible

**Problème :**
```sql
EXCEPTION WHEN OTHERS THEN
  -- Ne pas bloquer l'insertion si le webhook échoue
  RAISE WARNING 'Erreur lors de l''envoi webhook n8n pour transaction %: %', NEW.id, SQLERRM;
END;
```

**Impact :**
- Les `RAISE WARNING` ne sont **PAS visibles** dans les logs Supabase par défaut
- Les développeurs ne voient **aucune erreur** dans le dashboard
- Il faut activer les logs PostgreSQL niveau `WARNING` pour voir les messages

**Solution :**
- Ajouter un logging explicite dans une table dédiée (comme `webhook_logs`)
- Ou migrer vers Supabase Edge Functions qui loggent automatiquement les erreurs

---

### 4. 🟠 MEDIUM - Double système de génération de reçus

**Criticité :** MEDIUM (risque de duplication)
**Impact :** Deux systèmes concurrents peuvent générer deux reçus différents pour la même transaction

**Détails :**

**Système 1 (webhook Stripe) :**
- ✅ Fonctionne actuellement
- ✅ Génère un numéro de reçu dans la table `receipts`
- ✅ Envoie un email avec un lien HTML
- ❌ Ne génère **PAS de PDF**

**Système 2 (trigger PostgreSQL → n8n) :**
- ❌ Ne fonctionne **PAS actuellement** (extension `http` manquante)
- ✅ Devrait générer un PDF via Gotenberg
- ✅ Devrait envoyer le PDF par email

**Risques si les deux fonctionnent en même temps :**
1. Le webhook Stripe génère un reçu avec numéro `2025-0001` et envoie un email HTML
2. Le trigger n8n génère un PDF et envoie un deuxième email avec le PDF
3. Le donateur reçoit **DEUX emails** différents
4. Confusion : quel est le "vrai" reçu fiscal ?

**Recommandation :**
- Choisir **UN SEUL** système de génération de reçus :
  - **Option A** : Désactiver le trigger n8n et utiliser uniquement le webhook Stripe (+ Gotenberg si besoin)
  - **Option B** : Désactiver `issue_receipt()` dans le webhook Stripe et utiliser uniquement le trigger n8n

---

### 5. 🟢 INFO - Filtre `calendar_accepted` manquant dans le trigger

**Criticité :** INFO (comportement différent du webhook Stripe)
**Impact :** Le trigger envoie pour **TOUS** les dons >= 6€, même les soutiens avec calendrier

**Comparaison :**

**Webhook Stripe :** `app/api/webhooks/stripe/route.ts:100`
```typescript
if (tx && amount >= 6 && !calendarAccepted) {
  // Génère le reçu fiscal UNIQUEMENT si calendar_accepted = false
}
```

**Trigger n8n :** `supabase/migrations/20251111_webhook_trigger_n8n_pdf.sql:141-144`
```sql
-- Ne traiter que les dons >= 6€ avec email valide
IF NEW.amount < 6 OR NEW.supporter_email IS NULL THEN
  RETURN NEW;
END IF;
-- ⚠️ Pas de filtre sur calendar_accepted !
```

**Impact :**
- Si le trigger n8n fonctionnait, il enverrait des reçus fiscaux **même pour les soutiens avec calendrier**
- Or, un soutien avec calendrier **N'EST PAS éligible** au reçu fiscal (contrepartie reçue)
- Risque de non-conformité fiscale

**Solution :**
```sql
-- Ajouter un filtre sur calendar_accepted
IF NEW.amount < 6 OR NEW.supporter_email IS NULL OR NEW.calendar_accepted = true THEN
  RETURN NEW;
END IF;
```

---

## ✅ Solutions proposées

### Solution A : Migrer vers `pg_net` (recommandée)

**Avantages :**
- ✅ Compatible avec Supabase hosted
- ✅ Asynchrone et non bloquant
- ✅ Pas de risque de timeout sur l'insertion
- ✅ Approuvé par Supabase

**Inconvénients :**
- ⚠️  Pas de response HTTP immédiate (asynchrone)
- ⚠️  Nécessite une refonte complète de la fonction trigger

**Fichier à créer :** `supabase/migrations/20251130_migrate_trigger_to_pg_net.sql`

```sql
-- Migration: Remplacer http par pg_net pour le trigger n8n
-- Date: 2025-11-30

-- 1. Activer l'extension pg_net
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Fonction pour envoyer le webhook via pg_net (asynchrone)
CREATE OR REPLACE FUNCTION trigger_n8n_pdf_generation()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT;
  payload JSONB;
  request_id BIGINT;
BEGIN
  -- Récupérer l'URL du webhook depuis n8n_settings
  webhook_url := get_n8n_webhook_url();

  -- Si pas de webhook configuré, logger et skip
  IF webhook_url IS NULL OR webhook_url = '' THEN
    RAISE NOTICE 'N8N_WEBHOOK_URL non configuré, skip génération PDF pour transaction %', NEW.id;
    RETURN NEW;
  END IF;

  -- FILTRE IMPORTANT : Ne traiter que les dons fiscaux >= 6€
  -- calendar_accepted = false (don fiscal sans contrepartie)
  -- calendar_accepted = true (soutien avec calendrier, PAS de reçu fiscal)
  IF NEW.amount < 6 OR NEW.supporter_email IS NULL OR NEW.calendar_accepted = true THEN
    RETURN NEW;
  END IF;

  -- Construire le payload JSON
  payload := jsonb_build_object(
    'event', 'receipt.generate',
    'transaction_id', NEW.id,
    'receipt_number', NEW.receipt_number,
    'amount', NEW.amount,
    'payment_method', NEW.payment_method,
    'calendar_accepted', NEW.calendar_accepted,
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
    'tournee_id', NEW.tournee_id
  );

  -- Envoyer la requête POST via pg_net (asynchrone)
  BEGIN
    SELECT net.http_post(
      url := webhook_url,
      body := payload,
      headers := '{"Content-Type": "application/json"}'::jsonb
    ) INTO request_id;

    RAISE NOTICE 'Webhook n8n envoyé (pg_net request_id: %) pour transaction %', request_id, NEW.id;

    -- Optionnel : logger la requête dans webhook_logs
    INSERT INTO webhook_logs (source, event_type, payload, status)
    VALUES ('pg_net_trigger', 'receipt.generate', payload, 'sent');

  EXCEPTION WHEN OTHERS THEN
    -- Logger l'erreur mais ne pas bloquer l'insertion
    RAISE WARNING 'Erreur lors de l''envoi webhook n8n pour transaction %: %', NEW.id, SQLERRM;

    -- Logger l'erreur dans webhook_logs
    INSERT INTO webhook_logs (source, event_type, payload, status, error_message)
    VALUES ('pg_net_trigger', 'receipt.generate', payload, 'error', SQLERRM);
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION trigger_n8n_pdf_generation() IS 'Envoie un webhook POST vers n8n via pg_net pour générer le PDF du reçu fiscal via Gotenberg';
```

**Configuration requise après migration :**
```sql
-- Configurer l'URL du webhook n8n
SELECT set_n8n_webhook_url('https://n8n.dsolution-ia.fr/webhook/receipt-pdf');

-- Vérifier la configuration
SELECT * FROM n8n_settings WHERE key = 'n8n_webhook_url';
```

---

### Solution B : Utiliser Supabase Database Webhooks (alternative)

**Avantages :**
- ✅ Natif Supabase (pas de code PostgreSQL custom)
- ✅ Interface graphique pour configuration
- ✅ Retry automatique en cas d'échec
- ✅ Logs visibles dans le dashboard Supabase

**Configuration via Supabase Dashboard :**
1. Aller dans **Database → Webhooks**
2. Créer un nouveau webhook :
   - **Table :** `support_transactions`
   - **Events :** `INSERT`
   - **Webhook URL :** `https://n8n.dsolution-ia.fr/webhook/receipt-pdf`
   - **HTTP Headers :** `Content-Type: application/json`
   - **Filters :**
     ```sql
     amount >= 6 AND supporter_email IS NOT NULL AND calendar_accepted = false
     ```

**Inconvénients :**
- ⚠️  Configuration via interface web (pas versionné dans le code)
- ⚠️  Moins de contrôle sur le payload JSON

---

### Solution C : Désactiver le trigger n8n et améliorer le webhook Stripe

**Si vous préférez garder la génération de PDF côté application Next.js plutôt que via n8n :**

**Avantages :**
- ✅ Pas besoin de n8n pour générer les PDF
- ✅ Tout le code est dans l'application Next.js
- ✅ Pas de dépendance externe (n8n, Gotenberg)

**Inconvénients :**
- ⚠️  Le webhook Stripe doit appeler Gotenberg directement
- ⚠️  Logique métier plus complexe dans le webhook

**Étapes :**
1. Désactiver le trigger PostgreSQL :
   ```sql
   DROP TRIGGER IF EXISTS support_transactions_n8n_webhook_trigger ON support_transactions;
   ```

2. Améliorer le webhook Stripe pour générer le PDF via Gotenberg :
   ```typescript
   // Dans app/api/webhooks/stripe/route.ts
   if (tx && amount >= 6 && !calendarAccepted) {
     // 1. Générer le reçu dans la DB
     const { data: rec } = await admin.rpc('issue_receipt', { p_transaction_id: tx.id }).single()

     // 2. Générer le PDF via Gotenberg
     const pdfBuffer = await generateReceiptPDF({
       receiptNumber: rec.receipt_number,
       donorName: tx.supporter_name,
       amount: tx.amount,
       // ... autres données
     })

     // 3. Uploader le PDF sur Supabase Storage
     const { data: uploadData } = await admin.storage
       .from('receipts')
       .upload(`fiscal/${rec.receipt_number}.pdf`, pdfBuffer)

     // 4. Envoyer l'email avec le PDF en pièce jointe
     await sendEmail({
       to: donorEmail,
       subject: `Reçu fiscal ${rec.receipt_number}`,
       html: buildHtml({ ... }),
       attachments: [{ filename: `${rec.receipt_number}.pdf`, content: pdfBuffer }]
     })
   }
   ```

---

## 🧪 Script de test SQL

**Fichier :** `supabase/migrations/TEST_n8n_trigger_manual.sql`

```sql
-- =====================================================
-- TEST MANUEL - Trigger n8n pour reçus fiscaux
-- =====================================================
-- Ce script permet de tester manuellement le trigger PostgreSQL
-- en insérant une transaction de test et en observant les logs

-- 1. Configurer l'URL du webhook (si pas déjà fait)
SELECT set_n8n_webhook_url('https://n8n.dsolution-ia.fr/webhook/receipt-pdf');

-- 2. Vérifier la configuration
SELECT * FROM n8n_settings WHERE key = 'n8n_webhook_url';

-- 3. Vérifier que le trigger existe et est actif
SELECT
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled,
  CASE tgenabled
    WHEN 'O' THEN 'ENABLED'
    WHEN 'D' THEN 'DISABLED'
    WHEN 'R' THEN 'REPLICA ONLY'
    WHEN 'A' THEN 'ALWAYS'
    ELSE 'UNKNOWN'
  END as status
FROM pg_trigger
WHERE tgname = 'support_transactions_n8n_webhook_trigger';

-- 4. Insérer une transaction de test (don fiscal >= 6€)
-- IMPORTANT : Remplacez les UUID par des valeurs valides de votre base
INSERT INTO support_transactions (
  user_id,
  tournee_id,
  amount,
  calendar_accepted,
  payment_method,
  payment_status,
  supporter_email,
  supporter_name,
  notes
) VALUES (
  (SELECT id FROM auth.users LIMIT 1), -- Prendre le premier user_id valide
  (SELECT id FROM tournees LIMIT 1),   -- Prendre la première tournee_id valide
  10.00,                               -- amount >= 6€ (éligible)
  false,                               -- calendar_accepted = false (don fiscal)
  'carte',
  'completed',
  'test-trigger-n8n@example.com',      -- Email valide
  'Jean Test Trigger',
  'TEST MANUEL - Trigger n8n'
) RETURNING id, amount, calendar_accepted, supporter_email, created_at;

-- 5. Vérifier les logs du webhook (si la table webhook_logs existe)
SELECT
  id,
  source,
  event_type,
  status,
  error_message,
  created_at
FROM webhook_logs
WHERE source = 'pg_net_trigger'
ORDER BY created_at DESC
LIMIT 5;

-- 6. Vérifier si un reçu a été créé (si le webhook Stripe a aussi généré un reçu)
SELECT
  r.id,
  r.receipt_number,
  r.fiscal_year,
  r.sequence_number,
  r.receipt_type,
  r.status,
  r.created_at
FROM receipts r
JOIN support_transactions st ON st.id = r.transaction_id
WHERE st.supporter_email = 'test-trigger-n8n@example.com'
ORDER BY r.created_at DESC;

-- 7. Nettoyer les données de test (optionnel)
-- DÉCOMMENTEZ CI-DESSOUS POUR SUPPRIMER LA TRANSACTION DE TEST :

-- DELETE FROM receipts WHERE transaction_id IN (
--   SELECT id FROM support_transactions WHERE supporter_email = 'test-trigger-n8n@example.com'
-- );
-- DELETE FROM support_transactions WHERE supporter_email = 'test-trigger-n8n@example.com';
```

---

## 📊 Monitoring et observabilité

### Logs PostgreSQL (RAISE NOTICE/WARNING)

**Problème actuel :**
- Les `RAISE NOTICE` et `RAISE WARNING` ne sont **PAS visibles** dans le dashboard Supabase par défaut
- Il faut activer les logs PostgreSQL niveau `log_min_messages = NOTICE` dans la configuration Supabase

**Solution recommandée :**
- Utiliser la table `webhook_logs` pour logger tous les événements du trigger

**Ajout dans la fonction trigger :**
```sql
-- Logger l'envoi du webhook
INSERT INTO webhook_logs (source, event_type, payload, status)
VALUES ('pg_net_trigger', 'receipt.generate', payload, 'sent');

-- Logger les erreurs
INSERT INTO webhook_logs (source, event_type, payload, status, error_message)
VALUES ('pg_net_trigger', 'receipt.generate', payload, 'error', SQLERRM);
```

**Requête de monitoring :**
```sql
-- Dashboard : Voir tous les webhooks envoyés au n8n
SELECT
  id,
  source,
  event_type,
  status,
  error_message,
  created_at,
  payload->>'transaction_id' as transaction_id,
  payload->'donor'->>'email' as donor_email
FROM webhook_logs
WHERE source = 'pg_net_trigger'
  AND event_type = 'receipt.generate'
ORDER BY created_at DESC
LIMIT 20;

-- Taux d'erreur
SELECT
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM webhook_logs
WHERE source = 'pg_net_trigger'
  AND event_type = 'receipt.generate'
GROUP BY status;
```

---

## 🎯 Recommandations finales

### Actions immédiates

1. **✅ Exécuter le script de diagnostic**
   ```bash
   supabase db run supabase/migrations/DIAGNOSTIC_n8n_trigger_audit.sql
   ```

2. **✅ Vérifier que l'extension `pg_net` est disponible**
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_net';
   ```

3. **✅ Décider quelle solution adopter :**
   - **Option A** : Migrer vers `pg_net` (trigger PostgreSQL fonctionnel)
   - **Option B** : Utiliser Supabase Database Webhooks (no-code)
   - **Option C** : Désactiver le trigger et améliorer le webhook Stripe

### Choix recommandé : Option A (pg_net)

**Pourquoi ?**
- ✅ Compatible Supabase hosted
- ✅ Code versionné dans les migrations
- ✅ Asynchrone et performant
- ✅ Logs traçables via `webhook_logs`

### Plan d'implémentation (Option A)

**Phase 1 : Correction du trigger (1-2h)**
1. Créer la migration `20251130_migrate_trigger_to_pg_net.sql`
2. Remplacer `http` par `pg_net` dans la fonction trigger
3. Ajouter le filtre `calendar_accepted = false`
4. Ajouter le logging dans `webhook_logs`
5. Appliquer la migration

**Phase 2 : Configuration (30min)**
1. Configurer l'URL du webhook n8n :
   ```sql
   SELECT set_n8n_webhook_url('https://n8n.dsolution-ia.fr/webhook/receipt-pdf');
   ```
2. Vérifier que le workflow n8n est actif et prêt à recevoir des requêtes

**Phase 3 : Test (1h)**
1. Insérer une transaction de test via le script `TEST_n8n_trigger_manual.sql`
2. Vérifier que n8n reçoit le payload
3. Vérifier que le PDF est généré via Gotenberg
4. Vérifier que l'email est envoyé avec le PDF
5. Vérifier les logs dans `webhook_logs`

**Phase 4 : Désactivation du système concurrent (1h)**
1. Décider si le webhook Stripe doit continuer à appeler `issue_receipt()`
2. **Option 1** : Désactiver `issue_receipt()` dans le webhook Stripe (ne garder que n8n)
3. **Option 2** : Garder les deux systèmes mais éviter la double génération :
   ```typescript
   // Dans webhook Stripe
   if (tx && amount >= 6 && !calendarAccepted) {
     // NE PAS appeler issue_receipt() ici
     // Laisser le trigger n8n générer le PDF
     // Juste logger la transaction
     log.info('Don fiscal détecté, trigger n8n va générer le reçu', { transaction_id: tx.id })
   }
   ```

**Phase 5 : Monitoring (ongoing)**
1. Surveiller les logs dans `webhook_logs`
2. Créer un dashboard pour visualiser le taux de succès/échec
3. Configurer des alertes si le taux d'erreur dépasse 5%

---

## 📚 Annexes

### A. Liste complète des fichiers analysés

1. `supabase/migrations/20251111_webhook_trigger_n8n_pdf.sql` - Trigger n8n initial
2. `supabase/migrations/20251124_fix_n8n_webhook_settings.sql` - Table de configuration
3. `supabase/migrations/006_feature_fiscal_support.sql` - Schema support_transactions
4. `supabase/migrations/016_create_webhook_logs.sql` - Table de logs
5. `supabase/migrations/20251025_issue_receipt_fix_email_v4.sql` - Fonction issue_receipt
6. `app/api/webhooks/stripe/route.ts` - Webhook Stripe

### B. Commandes SQL utiles

```sql
-- Vérifier les extensions disponibles
SELECT * FROM pg_available_extensions WHERE name LIKE '%http%' OR name LIKE '%net%';

-- Vérifier les extensions installées
SELECT * FROM pg_extension;

-- Lister tous les triggers
SELECT * FROM pg_trigger WHERE tgrelid::regclass::text LIKE '%support_transactions%';

-- Voir la définition de la fonction trigger
SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'trigger_n8n_pdf_generation';

-- Désactiver temporairement le trigger
ALTER TABLE support_transactions DISABLE TRIGGER support_transactions_n8n_webhook_trigger;

-- Réactiver le trigger
ALTER TABLE support_transactions ENABLE TRIGGER support_transactions_n8n_webhook_trigger;

-- Supprimer le trigger
DROP TRIGGER IF EXISTS support_transactions_n8n_webhook_trigger ON support_transactions;
```

### C. Documentation de référence

- **pg_net** : https://supabase.com/docs/guides/database/extensions/pg_net
- **Supabase Database Webhooks** : https://supabase.com/docs/guides/database/webhooks
- **Gotenberg** : https://gotenberg.dev/docs/getting-started/introduction
- **n8n** : https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/

---

**FIN DU RAPPORT D'AUDIT**

---

*Rapport généré le 2025-11-30 par Claude*
