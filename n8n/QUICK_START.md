# ⚡ Quick Start - Workflow n8n en 5 Minutes

Guide ultra-rapide pour les pressés. Pour la version détaillée, voir `README_INSTALLATION.md`.

---

## 📋 Prérequis

- ✅ n8n installé sur Coolify
- ✅ Gotenberg installé sur Coolify
- ✅ Minio S3 installé sur Coolify
- ✅ Projet Supabase configuré

---

## 🚀 Installation Express

### 1️⃣ Variables d'Environnement (2 min)

**Coolify → n8n → Environment:**
```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_KEY=eyJhbGci...
GOTENBERG_URL=http://gotenberg:3000
```

**Restart n8n**

---

### 2️⃣ Import Workflow (1 min)

1. Ouvrir n8n
2. Menu → **Import from file**
3. Sélectionner `workflow-receipt-pdf-generation.json`
4. ✅ Workflow importé

---

### 3️⃣ Credential Minio (2 min)

**n8n → Credentials → Add → S3:**
```
Name: Minio S3
Access Key: [depuis Minio Console]
Secret Key: [depuis Minio Console]

Advanced:
  Endpoint: http://minio:9000
  Region: us-east-1
  Force Path Style: ✅
```

**Test → Save**

---

### 4️⃣ Créer Bucket Minio (30 sec)

**Minio Console:**
```
Buckets → Create → "receipts" → Private → Create
```

---

### 5️⃣ Activer Webhook (1 min)

1. **n8n:** Workflow → **Active** (toggle ON)
2. **Copier Production URL:**
   ```
   https://votre-n8n.com/webhook/abc-123-xyz
   ```

3. **Supabase SQL Editor:**
   ```sql
   SELECT set_n8n_webhook_url('https://votre-n8n.com/webhook/abc-123-xyz');
   ```

---

### 6️⃣ Test (1 min)

**Supabase SQL Editor:**
```sql
INSERT INTO support_transactions (
  amount, calendar_accepted, supporter_email, supporter_name, payment_method
) VALUES (
  50, false, 'test@example.com', 'Test User', 'card'
);
```

**Vérifier:**
- ✅ n8n Executions → Success
- ✅ Minio → Bucket receipts → PDF présent
- ✅ Supabase → receipts table → status = completed

---

## ✅ C'est Prêt !

**Durée totale:** ~7 minutes

Chaque don >= 6€ génère maintenant automatiquement un PDF fiscal.

---

## 🐛 Problème ?

### Webhook pas appelé
```sql
SELECT get_n8n_webhook_url(); -- Vérifier URL
```

### Gotenberg erreur
```bash
docker exec -it <n8n-container> curl http://gotenberg:3000/health
```

### Minio erreur
- Vérifier credentials
- Vérifier bucket `receipts` existe

### Plus de détails
Voir `README_INSTALLATION.md` pour debugging complet.

---

**Support:** Vérifier les logs dans **Coolify → n8n → Logs**
