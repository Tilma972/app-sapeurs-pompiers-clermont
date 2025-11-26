# 📥 Installation du Workflow n8n - Génération PDF Reçus Fiscaux

**Temps estimé:** 15-20 minutes
**Prérequis:** n8n, Gotenberg, Minio S3, Supabase configurés dans Coolify

---

## 🎯 ÉTAPE 1: Importer le Workflow

### 1.1 Ouvrir n8n

Accédez à votre instance n8n via Coolify :
```
https://votre-n8n.domain.com
```

### 1.2 Importer le fichier JSON

1. Cliquer sur **"+"** (nouveau workflow) ou **Menu → Import from file**
2. Sélectionner le fichier : `workflow-receipt-pdf-generation.json`
3. Le workflow s'ouvre avec 10 nodes

### 1.3 Vérifier l'import

Vous devriez voir ces nodes :
- ✅ Webhook Trigger
- ✅ Extract & Validate Data
- ✅ Fetch Transaction (Supabase)
- ✅ Build HTML Receipt
- ✅ Gotenberg: HTML to PDF
- ✅ Minio: Upload PDF
- ✅ Update Receipt (Supabase)
- ✅ Respond to Webhook
- ✅ Error Check
- ✅ Error Response

---

## 🔧 ÉTAPE 2: Configuration des Variables d'Environnement

### 2.1 Variables à définir dans Coolify

Ouvrir **Coolify → n8n → Environment Variables** et ajouter :

```bash
# Supabase
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Gotenberg (URL interne Docker)
GOTENBERG_URL=http://gotenberg:3000

# Note: Les credentials Minio S3 sont configurés directement dans n8n (voir ÉTAPE 3)
```

### 2.2 Redémarrer n8n

Après ajout des variables :
```bash
# Via Coolify UI: Restart Service
```

---

## 🔐 ÉTAPE 3: Configuration des Credentials

### 3.1 Credential Minio S3

1. Dans n8n, aller à **Credentials** (menu de gauche)
2. Cliquer **"+ Add Credential"**
3. Chercher **"S3"**
4. Remplir :

```
Credential Name: Minio S3
Access Key ID: [Votre Minio Access Key]
Secret Access Key: [Votre Minio Secret Key]

Advanced Options:
  ✅ Custom Endpoints
  Endpoint: http://minio:9000 (ou https://minio.yourdomain.com si externe)
  Region: us-east-1
  ✅ Force Path Style: true
```

5. **Test Connection** → Devrait afficher "Connection successful"
6. **Save**

### 3.2 Obtenir les credentials Minio

**Via Minio Console:**
```
https://votre-minio.domain.com
→ Access Keys
→ Create New Access Key
→ Copier Access Key + Secret Key
```

**Ou via Coolify:**
```
Coolify → Minio → Environment
Chercher: MINIO_ROOT_USER et MINIO_ROOT_PASSWORD
```

---

## 🪣 ÉTAPE 4: Créer le Bucket Minio

### 4.1 Via Minio Console

1. Ouvrir Minio Console : `https://votre-minio.domain.com`
2. Login avec credentials
3. **Buckets → Create Bucket**

```
Bucket Name: receipts
Versioning: Disabled (ou Enabled si backup souhaité)
Object Locking: Disabled
Access: Private
```

4. **Create**

### 4.2 Configurer la Policy (Optionnel)

Si besoin d'accès public temporaire :

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": ["*"]
      },
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::receipts/*"]
    }
  ]
}
```

⚠️ **Recommandé:** Garder le bucket **Private** et générer des URLs signées.

---

## 🔗 ÉTAPE 5: Activer le Webhook

### 5.1 Activer le workflow

1. Dans n8n, cliquer sur **"Inactive"** en haut à droite
2. Basculer vers **"Active"**

### 5.2 Récupérer l'URL du webhook

1. Cliquer sur le node **"Webhook Trigger"**
2. Copier l'URL affichée :

```
Production URL: https://votre-n8n.domain.com/webhook/abc-123-xyz-456
```

⚠️ **Important:** Utiliser la **Production URL** (pas Test URL)

### 5.3 Configurer dans Supabase

Ouvrir **Supabase SQL Editor** et exécuter :

```sql
-- Configurer l'URL du webhook
SELECT set_n8n_webhook_url('https://votre-n8n.domain.com/webhook/abc-123-xyz-456');

-- Vérifier
SELECT get_n8n_webhook_url();
-- Devrait retourner: https://votre-n8n.domain.com/webhook/abc-123-xyz-456
```

✅ **Confirmation:** Vous devriez voir le message :
```
URL webhook n8n configurée avec succès: https://votre-n8n.domain.com/webhook/abc-123-xyz-456
```

---

## 🧪 ÉTAPE 6: Tests

### Test 1: Payload Manuel (dans n8n)

1. Dans n8n, workflow ouvert
2. Cliquer **"Test workflow"** (en haut)
3. Aller dans le node **"Webhook Trigger"**
4. Cliquer **"Listen for test event"**
5. Utiliser `curl` pour envoyer le payload test :

```bash
curl -X POST https://votre-n8n.domain.com/webhook-test/abc-123-xyz-456 \
  -H "Content-Type: application/json" \
  -d @webhook-payload-example.json
```

**Résultat attendu:**
- ✅ Tous les nodes deviennent verts
- ✅ PDF visible dans le dernier node
- ✅ Bucket Minio contient `2025-001.pdf`

### Test 2: Transaction Réelle Supabase

Créer une transaction test dans Supabase :

```sql
-- Créer une transaction de test
INSERT INTO support_transactions (
  amount,
  calendar_accepted,
  supporter_email,
  supporter_name,
  donor_first_name,
  donor_last_name,
  donor_address,
  donor_zip,
  donor_city,
  payment_method
) VALUES (
  50.00,
  false,  -- Don fiscal (reçu généré)
  'test@example.com',
  'Jean Dupont',
  'Jean',
  'Dupont',
  '12 Rue de la République',
  '63000',
  'Clermont-Ferrand',
  'card'
) RETURNING id, receipt_number;
```

**Vérifications:**

1. **Logs Supabase:**
```sql
-- Voir les logs Postgres
SELECT * FROM pg_stat_statements
WHERE query LIKE '%trigger_n8n_pdf_generation%';
```

2. **Executions n8n:**
```
n8n → Executions (menu gauche)
→ Vérifier qu'une exécution apparaît
→ Status: Success ✅
```

3. **PDF dans Minio:**
```
Minio Console → Buckets → receipts
→ Le fichier 2025-001.pdf doit être présent
```

4. **Base Supabase:**
```sql
SELECT
  st.receipt_number,
  r.status,
  r.pdf_url,
  r.pdf_generated_at
FROM support_transactions st
LEFT JOIN receipts r ON r.transaction_id = st.id
WHERE st.id = 'votre-transaction-id';
```

**Résultat attendu:**
```
receipt_number | status    | pdf_url              | pdf_generated_at
2025-001       | completed | receipts/2025-001.pdf | 2025-11-18 10:35:22
```

---

## 🐛 ÉTAPE 7: Debugging

### Problème 1: Webhook n'est pas appelé

**Causes possibles:**
- URL webhook mal configurée dans Supabase
- Trigger SQL désactivé

**Solutions:**
```sql
-- Vérifier URL
SELECT get_n8n_webhook_url();

-- Reconfigurer si besoin
SELECT set_n8n_webhook_url('https://nouvelle-url...');

-- Vérifier que le trigger existe
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgname = 'support_transactions_n8n_webhook_trigger';
```

### Problème 2: Erreur 404 sur Gotenberg

**Cause:** Gotenberg non accessible depuis n8n

**Solution:**
```bash
# Tester depuis le container n8n
docker exec -it <n8n-container-id> sh
curl http://gotenberg:3000/health
```

Si échec, vérifier le réseau Docker :
```bash
docker network inspect <coolify-network>
```

Les containers n8n et Gotenberg doivent être sur le **même réseau**.

### Problème 3: Upload Minio échoue

**Erreurs communes:**
- "Access Denied" → Credentials incorrects
- "No such bucket" → Bucket `receipts` n'existe pas
- "Connection refused" → URL Minio incorrecte

**Solution:**
```bash
# Test manuel
docker exec -it <n8n-container-id> sh
curl http://minio:9000/minio/health/live
```

Si URL externe (hors Docker) :
```bash
curl https://minio.yourdomain.com/minio/health/live
```

### Problème 4: Update Supabase échoue

**Erreurs communes:**
- 401 Unauthorized → `SUPABASE_SERVICE_KEY` incorrect (pas `ANON_KEY`)
- 404 Not Found → Table `receipts` ou receipt inexistant

**Solution:**
```sql
-- Vérifier que la table receipts existe
SELECT * FROM receipts LIMIT 1;

-- Vérifier que le receipt a été créé par le trigger
SELECT * FROM receipts WHERE transaction_id = 'votre-id';
```

---

## 📊 ÉTAPE 8: Monitoring

### 8.1 Dashboard n8n

Accès : **n8n → Executions**

Filtrer par :
- Status: Failed
- Workflow: Receipt PDF Generation

### 8.2 Logs Coolify

```bash
# Via Coolify UI
Service n8n → Logs (onglet)

# Chercher les erreurs
Filtrer: "error" ou "failed"
```

### 8.3 Créer un Error Workflow (Recommandé)

1. **n8n → Settings → Error Workflow**
2. Créer un nouveau workflow :

```
Error Trigger
  ↓
Send Email (Resend)
  To: admin@yourdomain.com
  Subject: ⚠️ Erreur génération PDF reçu
  Body: {{ $json.error.message }}
```

3. Activer l'error workflow
4. Revenir au workflow principal → Settings → Error Workflow → Sélectionner le workflow créé

---

## ✅ CHECKLIST FINALE

Avant mise en production :

- [ ] Workflow importé dans n8n
- [ ] Variables d'environnement configurées (Coolify)
- [ ] Credential Minio S3 créé et testé
- [ ] Bucket `receipts` créé dans Minio
- [ ] Workflow activé (Active = ON)
- [ ] URL webhook configurée dans Supabase (`set_n8n_webhook_url()`)
- [ ] Test manuel avec payload exemple réussi
- [ ] Test avec transaction Supabase réelle réussi
- [ ] PDF généré et présent dans Minio
- [ ] Table `receipts` mise à jour (status = completed)
- [ ] Error workflow configuré (optionnel mais recommandé)
- [ ] Monitoring actif (logs Coolify + n8n Executions)

---

## 🔄 WORKFLOW DÉTAILLÉ

### Node 1: Webhook Trigger
**Rôle:** Reçoit le POST de Supabase
**Input:** Payload JSON depuis trigger SQL
**Output:** Payload brut

### Node 2: Extract & Validate Data
**Rôle:** Valide et nettoie les données
**Validations:**
- ✅ transaction_id et receipt_number présents
- ✅ calendar_accepted = false (don fiscal)
- ✅ amount >= 6€

**Output:** Objet clean standardisé

### Node 3: Fetch Transaction (Supabase)
**Rôle:** Récupère les données complètes de la transaction
**API:** GET /rest/v1/support_transactions?id=eq.{id}
**Output:** Array avec 1 transaction

### Node 4: Build HTML Receipt
**Rôle:** Génère le HTML du reçu fiscal
**Template:** HTML/CSS complet avec :
- Header association
- Infos donateur
- Montant et réduction fiscale (66%)
- Mentions légales
- Signature

**Output:** HTML string + metadata

### Node 5: Gotenberg: HTML to PDF
**Rôle:** Convertit HTML → PDF
**API:** POST /forms/chromium/convert/html
**Paramètres:**
- Format A4 (8.27 x 11.7 inches)
- Marges 0.5 inch

**Output:** Binary PDF

### Node 6: Minio: Upload PDF
**Rôle:** Upload le PDF dans S3
**Bucket:** receipts
**Filename:** {receiptNumber}.pdf
**Output:** URL/path du fichier

### Node 7: Update Receipt (Supabase)
**Rôle:** Marque le receipt comme complété
**API:** PATCH /rest/v1/receipts
**Update:**
- pdf_url
- status = "completed"
- pdf_generated_at

**Output:** Confirmation

### Node 8: Respond to Webhook
**Rôle:** Réponse 200 OK à Supabase
**JSON:**
```json
{
  "success": true,
  "receipt_number": "2025-001",
  "transaction_id": "...",
  "pdf_url": "receipts/2025-001.pdf",
  "processed_at": "2025-11-18T10:35:22.000Z"
}
```

### Node 9-10: Error Handling
**Rôle:** Gestion des erreurs
**Réponse:** 500 avec message d'erreur

---

## 📚 RESSOURCES

### Fichiers Fournis

```
n8n/
├── workflow-receipt-pdf-generation.json  ← Workflow à importer
├── webhook-payload-example.json          ← Payload de test
└── README_INSTALLATION.md               ← Ce fichier
```

### Documentation Externe

- [n8n Webhooks](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [Gotenberg API](https://gotenberg.dev/docs/routes#convert-with-chromium)
- [Minio S3 API](https://min.io/docs/minio/linux/developers/javascript/API.html)
- [Supabase REST API](https://supabase.com/docs/guides/api)

---

## 🆘 SUPPORT

**Problème persistant ?**

1. **Exporter les logs n8n:**
   - Executions → Cliquer sur l'exécution failed
   - Copier l'erreur complète

2. **Tester chaque service indépendamment:**
   ```bash
   # Gotenberg
   curl http://gotenberg:3000/health

   # Minio
   curl http://minio:9000/minio/health/live

   # Supabase
   curl https://votre-projet.supabase.co/rest/v1/
   ```

3. **Vérifier les logs Coolify** pour chaque service

---

**Installation terminée ? Vous êtes prêt !** 🚀

Le système génère maintenant automatiquement les PDFs de reçus fiscaux pour chaque don >= 6€.
