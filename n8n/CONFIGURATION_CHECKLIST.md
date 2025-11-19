# ✅ Configuration Checklist - Workflow n8n

Utilisez ce fichier comme aide-mémoire pour rassembler toutes les informations nécessaires avant l'installation.

---

## 🔐 Credentials & URLs à Préparer

### 1. Supabase

```bash
# À récupérer depuis: Supabase Dashboard → Settings → API

SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...  # anon/public key
SUPABASE_SERVICE_KEY=eyJhbGci...  # service_role key (⚠️ SECRET)
```

**⚠️ Important:** `SUPABASE_SERVICE_KEY` != `SUPABASE_ANON_KEY`
- ANON_KEY: Lecture des transactions
- SERVICE_KEY: Écriture dans la table receipts (bypass RLS)

---

### 2. Minio S3

```bash
# À récupérer depuis: Minio Console → Access Keys

MINIO_ACCESS_KEY=xxxxx
MINIO_SECRET_KEY=xxxxx
MINIO_ENDPOINT=http://minio:9000  # Ou https://minio.domain.com si externe
```

**Comment obtenir:**
```
Minio Console → Login
→ Access Keys (menu gauche)
→ Create New Access Key
→ Copier Access Key + Secret Key
```

**Ou via Coolify:**
```
Coolify → Minio → Environment Variables
→ MINIO_ROOT_USER
→ MINIO_ROOT_PASSWORD
```

---

### 3. Gotenberg

```bash
# URL interne Docker (si sur même réseau Coolify)
GOTENBERG_URL=http://gotenberg:3000

# OU URL externe (si hébergé ailleurs)
GOTENBERG_URL=https://gotenberg.domain.com
```

**Test de connectivité:**
```bash
curl http://gotenberg:3000/health
# Réponse attendue: {"status":"up"}
```

---

### 4. n8n Webhook

```bash
# À récupérer après activation du workflow dans n8n
N8N_WEBHOOK_URL=https://n8n.domain.com/webhook/abc-123-xyz-456
```

**Comment obtenir:**
```
n8n → Workflow "Receipt PDF Generation"
→ Activer (toggle ON)
→ Node "Webhook Trigger"
→ Copier "Production URL" (pas "Test URL")
```

---

## 📋 Checklist Pre-Installation

### Infrastructure Coolify

- [ ] VPS Hetzner avec Coolify opérationnel
- [ ] n8n déployé et accessible via URL
- [ ] Gotenberg déployé et accessible
- [ ] Redis déployé (pour n8n queue mode)
- [ ] Minio S3 déployé et accessible
- [ ] Tous les services sur le même réseau Docker

**Vérifier réseau:**
```bash
docker network ls | grep coolify
docker ps --format "table {{.Names}}\t{{.Networks}}"
```

---

### Supabase

- [ ] Projet Supabase créé
- [ ] Migration `20251111_webhook_trigger_n8n_pdf.sql` exécutée
- [ ] Table `support_transactions` existe
- [ ] Table `receipts` existe
- [ ] Table `app_settings` existe
- [ ] Fonction `trigger_n8n_pdf_generation()` existe
- [ ] Trigger `support_transactions_n8n_webhook_trigger` actif

**Vérifier:**
```sql
-- Vérifier trigger
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgname = 'support_transactions_n8n_webhook_trigger';

-- Vérifier fonctions
SELECT proname FROM pg_proc
WHERE proname IN ('set_n8n_webhook_url', 'get_n8n_webhook_url', 'trigger_n8n_pdf_generation');
```

---

### Accès & Permissions

- [ ] Accès admin à Coolify
- [ ] Accès admin à n8n
- [ ] Accès admin à Minio Console
- [ ] Accès admin à Supabase Dashboard
- [ ] Extensions Supabase activées (http extension)

**Vérifier extension HTTP:**
```sql
SELECT * FROM pg_extension WHERE extname = 'http';
-- Si vide, exécuter: CREATE EXTENSION IF NOT EXISTS http;
```

---

## 🔧 Configuration Step-by-Step

### Étape 1: Variables n8n (Coolify)

**Coolify → n8n → Environment → Edit:**

```bash
# Ajouter ces variables:
SUPABASE_URL=_____________________
SUPABASE_ANON_KEY=_____________________
SUPABASE_SERVICE_KEY=_____________________
GOTENBERG_URL=http://gotenberg:3000

# Optionnel (pour queue mode):
N8N_PAYLOAD_SIZE_MAX=16
EXECUTIONS_DATA_SAVE_ON_SUCCESS=all
```

**Après modification:**
- [ ] Save
- [ ] Restart n8n

---

### Étape 2: Credential Minio (dans n8n UI)

**n8n → Credentials → Add → S3:**

```
Credential Name: Minio S3
Access Key ID: _____________________
Secret Access Key: _____________________

Advanced Options:
  [✓] Custom Endpoints
  Endpoint: http://minio:9000
  Region: us-east-1
  [✓] Force Path Style
```

- [ ] Test Connection (doit afficher "Success")
- [ ] Save

---

### Étape 3: Bucket Minio

**Minio Console → Buckets:**

- [ ] Create Bucket → Name: `receipts`
- [ ] Access: Private
- [ ] Versioning: Disabled (ou Enabled si backup)
- [ ] Create

---

### Étape 4: Import Workflow

**n8n → Menu → Import from file:**

- [ ] Sélectionner `workflow-receipt-pdf-generation.json`
- [ ] Workflow importé (10 nodes visibles)
- [ ] Activer workflow (toggle ON)
- [ ] Copier Production URL du webhook

---

### Étape 5: Configurer Webhook Supabase

**Supabase SQL Editor:**

```sql
-- Remplacer par votre vraie URL
SELECT set_n8n_webhook_url('https://votre-n8n.com/webhook/VOTRE-WEBHOOK-ID');

-- Vérifier
SELECT get_n8n_webhook_url();
```

- [ ] URL configurée
- [ ] Vérification OK

---

## 🧪 Tests de Validation

### Test 1: Services Accessibles

```bash
# Gotenberg
curl http://gotenberg:3000/health
# Attendu: {"status":"up"}

# Minio
curl http://minio:9000/minio/health/live
# Attendu: HTTP 200

# n8n
curl https://votre-n8n.com/healthz
# Attendu: {"status":"ok"}
```

- [ ] Gotenberg OK
- [ ] Minio OK
- [ ] n8n OK

---

### Test 2: Webhook Manuel

**Utiliser le script fourni:**
```bash
./test-webhook.sh https://votre-n8n.com/webhook/VOTRE-ID
```

- [ ] HTTP 200 reçu
- [ ] Execution visible dans n8n (Success)
- [ ] PDF présent dans Minio bucket `receipts`

---

### Test 3: Transaction Réelle

**Supabase SQL Editor:**
```sql
INSERT INTO support_transactions (
  amount, calendar_accepted, supporter_email, supporter_name, payment_method
) VALUES (
  50, false, 'test@example.com', 'Test Real', 'card'
) RETURNING id, receipt_number;
```

**Vérifications:**
- [ ] Webhook appelé (logs Supabase)
- [ ] Execution n8n Success
- [ ] PDF dans Minio
- [ ] Table `receipts` updated (status = completed)

```sql
-- Vérifier
SELECT * FROM receipts WHERE transaction_id = 'votre-id-retournee';
```

---

## 🚨 Troubleshooting Quick Ref

| Problème | Solution |
|----------|----------|
| Webhook 404 | Vérifier workflow actif + URL correcte |
| Gotenberg erreur | `docker exec -it n8n curl http://gotenberg:3000/health` |
| Minio erreur | Vérifier credentials + bucket existe |
| Supabase 401 | Utiliser SERVICE_KEY (pas ANON_KEY) |
| Trigger pas déclenché | Vérifier URL webhook configurée dans Supabase |

---

## 📞 Support

**Logs à consulter:**
- Coolify → n8n → Logs
- Coolify → Gotenberg → Logs
- n8n → Executions (pour workflow errors)
- Supabase → Logs (pour trigger SQL)

**Export logs:**
```bash
# Via Coolify CLI
docker logs <container-id> > logs.txt 2>&1
```

---

## ✅ Production Ready

Tout est vert ? Vous êtes prêt pour la production ! 🎉

**Dernières vérifications:**
- [ ] Error workflow configuré (optionnel mais recommandé)
- [ ] Monitoring actif (Coolify + n8n)
- [ ] Backup Minio configuré (optionnel)
- [ ] Documentation équipe mise à jour

---

**Gardez ce fichier à jour avec vos URLs/credentials réelles** (mais ne commitez JAMAIS les secrets dans git !)
