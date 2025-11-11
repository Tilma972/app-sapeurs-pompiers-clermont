# Webhook Supabase → n8n pour Génération PDF Asynchrone

## 📋 Vue d'ensemble

Ce système permet de générer automatiquement les PDF de reçus fiscaux via n8n + Gotenberg de manière asynchrone, sans bloquer l'insertion des transactions.

---

## 🏗️ Architecture

```
Transaction créée (>= 6€)
    ↓
Trigger SQL (support_transactions)
    ↓
HTTP POST → Webhook n8n
    ↓
Workflow n8n:
  1. Reçoit données transaction + donateur
  2. Génère HTML du reçu
  3. Appelle Gotenberg (HTML → PDF)
  4. Upload PDF vers Supabase Storage
  5. Update receipts.pdf_url
  6. Envoie email avec PDF en PJ
```

---

## ⚙️ Composants créés

### 1. Migration SQL: `20251111_webhook_trigger_n8n_pdf.sql`

**Fonctionnalités:**

- ✅ Extension `http` activée pour requêtes POST
- ✅ Trigger `support_transactions_n8n_webhook_trigger` (AFTER INSERT)
- ✅ Fonction `trigger_n8n_pdf_generation()` pour envoyer webhook
- ✅ Table `app_settings` pour stocker l'URL du webhook
- ✅ Fonctions helper: `set_n8n_webhook_url()` et `get_n8n_webhook_url()`

**Payload JSON envoyé à n8n:**

```json
{
  "event": "receipt.generate",
  "transaction_id": "uuid",
  "receipt_number": "2025-001",
  "amount": 50.0,
  "payment_method": "especes",
  "calendar_accepted": true,
  "created_at": "2025-11-11T10:30:00Z",
  "donor": {
    "email": "jean.dupont@email.com",
    "name": "Jean DUPONT",
    "first_name": "Jean",
    "last_name": "DUPONT",
    "address": "123 rue Example",
    "zip": "21000",
    "city": "DIJON"
  },
  "receipt_url": "https://app.com/recu/2025-001",
  "user_id": "uuid-pompier",
  "tournee_id": "uuid-tournee"
}
```

---

## 🚀 Installation

### 1. Exécuter la migration

```bash
# Dans le SQL Editor Supabase
-- Copier/coller le contenu de 20251111_webhook_trigger_n8n_pdf.sql
```

### 2. Configurer l'URL du webhook n8n

```sql
-- Après avoir créé votre workflow n8n avec un webhook trigger
SELECT set_n8n_webhook_url('https://votre-instance-n8n.com/webhook/receipt-pdf');
```

**Résultat attendu:**
```
URL webhook n8n configurée avec succès: https://votre-instance-n8n.com/webhook/receipt-pdf
```

### 3. Vérifier la configuration

```sql
SELECT get_n8n_webhook_url();
-- Devrait retourner: https://votre-instance-n8n.com/webhook/receipt-pdf
```

---

## 🔧 Workflow n8n (à créer par l'utilisateur)

### Nodes requis:

1. **Webhook Trigger**
   - Method: POST
   - Authentication: None (ou Basic Auth si besoin)
   - Path: `/webhook/receipt-pdf`

2. **Function Node: Préparer données HTML**
   ```javascript
   const data = $json.body;
   
   return {
     json: {
       transaction_id: data.transaction_id,
       receipt_number: data.receipt_number,
       amount: data.amount,
       donor_name: data.donor.name,
       donor_email: data.donor.email,
       donor_address: data.donor.address,
       donor_zip: data.donor.zip,
       donor_city: data.donor.city,
       payment_method: data.payment_method,
       calendar_accepted: data.calendar_accepted,
       date: new Date(data.created_at).toLocaleDateString('fr-FR')
     }
   };
   ```

3. **HTTP Request: Template HTML du reçu**
   - Récupérer template depuis votre serveur ou build inline
   - Remplacer variables: `{{receipt_number}}`, `{{amount}}`, etc.

4. **HTTP Request: Gotenberg (HTML → PDF)**
   - URL: `http://gotenberg:3000/forms/chromium/convert/html`
   - Method: POST
   - Body:
     ```json
     {
       "html": "<html>...</html>",
       "marginTop": "0.5",
       "marginBottom": "0.5",
       "marginLeft": "0.5",
       "marginRight": "0.5",
       "paperWidth": "8.27",
       "paperHeight": "11.69"
     }
     ```
   - Response Format: File

5. **Supabase Storage: Upload PDF**
   - Bucket: `receipts` (créer si nécessaire)
   - Path: `receipts/{{$json.receipt_number}}.pdf`
   - File: `{{$binary.data}}`

6. **Supabase RPC: Update pdf_url**
   ```sql
   UPDATE receipts
   SET pdf_url = 'https://votre-storage.supabase.co/storage/v1/object/public/receipts/2025-001.pdf',
       status = 'generated'
   WHERE receipt_number = '2025-001';
   ```

7. **Send Email (Resend/SendGrid/SMTP)**
   - To: `{{$json.donor_email}}`
   - Subject: `Reçu fiscal n°{{$json.receipt_number}}`
   - Attachments: PDF généré
   - HTML: Email avec lien téléchargement

---

## ✅ Comportement du trigger

### ✅ Conditions pour déclencher le webhook:

1. **Montant >= 6€** (seuil pour reçu fiscal)
2. **Email donateur valide** (`supporter_email NOT NULL`)
3. **URL webhook configurée** (via `set_n8n_webhook_url()`)

### ⚠️ Gestion des erreurs:

- **Webhook échoue:** Transaction quand même insérée (trigger non bloquant)
- **URL non configurée:** Log NOTICE, skip webhook silencieusement
- **Montant < 6€:** Skip automatiquement
- **Pas d'email:** Skip automatiquement

**Logs SQL:**
```sql
-- Succès
NOTICE: Webhook n8n envoyé avec succès pour transaction abc-123: HTTP 200

-- Échec
WARNING: Webhook n8n échec pour transaction abc-123: HTTP 500

-- Erreur réseau
WARNING: Erreur lors de l'envoi webhook n8n pour transaction abc-123: could not resolve host
```

---

## 🧪 Tests

### 1. Créer une transaction de test

```sql
INSERT INTO support_transactions (
  user_id,
  tournee_id,
  amount,
  payment_method,
  supporter_email,
  supporter_name,
  donor_first_name,
  donor_last_name,
  donor_address,
  donor_zip,
  donor_city,
  calendar_accepted,
  payment_status
) VALUES (
  '00000000-0000-0000-0000-000000000000', -- user_id test
  '00000000-0000-0000-0000-000000000000', -- tournee_id test
  50.00,
  'especes',
  'test@example.com',
  'TEST User',
  'TEST',
  'User',
  '123 rue Test',
  '21000',
  'DIJON',
  true,
  'completed'
);
```

### 2. Vérifier le webhook reçu dans n8n

- Ouvrir l'interface n8n
- Aller dans le workflow
- Vérifier "Executions" → dernière exécution
- Payload doit contenir toutes les données de la transaction

### 3. Vérifier le PDF généré

```sql
-- Après exécution du workflow n8n
SELECT pdf_url, status 
FROM receipts 
WHERE receipt_number = '2025-001';

-- Devrait retourner:
-- pdf_url: https://xxx.supabase.co/storage/v1/object/public/receipts/2025-001.pdf
-- status: generated
```

---

## 📊 Monitoring

### Logs des webhooks dans Supabase

```sql
-- Voir les logs PostgreSQL (Supabase Dashboard > Logs)
-- Rechercher: "Webhook n8n"
```

### Logs des exécutions n8n

- Dashboard n8n → Executions
- Filtrer par workflow "Receipt PDF Generation"
- Vérifier erreurs/succès

---

## 🔐 Sécurité

### ⚠️ Important:

1. **URL webhook exposée:** Ajouter Basic Auth dans n8n si webhook public
2. **Validation payload:** Vérifier `event === 'receipt.generate'` dans n8n
3. **Rate limiting:** Limiter les requêtes depuis Supabase IP si besoin

### 🔒 RLS sur Storage bucket `receipts`:

```sql
-- Créer bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', true);

-- Policy: Upload (service role uniquement)
CREATE POLICY "Service role can upload receipts"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'receipts');

-- Policy: Read (public si reçu avec token, ou authenticated)
CREATE POLICY "Anyone can read receipts"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'receipts');
```

---

## 🚨 Troubleshooting

### Webhook ne se déclenche pas:

1. Vérifier que l'extension `http` est activée:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'http';
   ```

2. Vérifier l'URL configurée:
   ```sql
   SELECT get_n8n_webhook_url();
   ```

3. Vérifier les conditions (montant >= 6€, email présent)

### n8n ne reçoit pas le webhook:

1. Tester l'URL manuellement:
   ```bash
   curl -X POST https://votre-n8n.com/webhook/receipt-pdf \
     -H "Content-Type: application/json" \
     -d '{"event":"receipt.generate","transaction_id":"test"}'
   ```

2. Vérifier firewall/réseau entre Supabase et n8n

### PDF non généré:

1. Vérifier logs Gotenberg
2. Vérifier template HTML (variables remplacées ?)
3. Vérifier Storage bucket créé + policies RLS

---

## 📝 TODO / Améliorations futures

- [ ] Ajouter retry automatique en cas d'échec webhook (pgmq ou pg_cron)
- [ ] Logger webhooks dans table dédiée `webhook_logs`
- [ ] Ajouter authentification Bearer token entre Supabase et n8n
- [ ] Créer fonction SQL pour renvoyer webhook manuellement: `retry_pdf_generation(transaction_id)`
- [ ] Dashboard admin pour voir statut génération PDF
- [ ] Notification Slack/Discord en cas d'échecs répétés

---

## 📞 Support

Pour questions sur:
- **Trigger SQL:** Vérifier logs PostgreSQL dans Supabase Dashboard
- **Workflow n8n:** Consulter la doc n8n ou exécutions du workflow
- **Gotenberg:** Vérifier les logs du container Gotenberg
- **Template HTML:** Adapter `lib/email/receipt-templates.ts` si besoin

---

## ✅ Checklist de mise en production

- [ ] Migration SQL exécutée
- [ ] URL webhook n8n configurée via `set_n8n_webhook_url()`
- [ ] Workflow n8n créé et testé
- [ ] Gotenberg déployé et accessible depuis n8n
- [ ] Bucket Storage `receipts` créé avec policies RLS
- [ ] Template HTML du reçu prêt
- [ ] Email SMTP/Resend configuré dans n8n
- [ ] Test end-to-end: transaction → webhook → PDF → email
- [ ] Monitoring des logs activé (Supabase + n8n)

---

**Date de création:** 2025-11-11  
**Version:** 1.0.0  
**Auteur:** GitHub Copilot
