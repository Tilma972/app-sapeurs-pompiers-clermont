# 🔄 ADDENDUM - Infrastructure Existante (VPS Hetzner + Coolify)

**Date:** 18 Novembre 2025
**Contexte:** Révision des recommandations suite à découverte de l'infrastructure déjà en place

---

## ⚠️ CHANGEMENT MAJEUR DE RECOMMANDATION

### Infrastructure Découverte

Vous disposez déjà de :
- ✅ **VPS Hetzner** avec Coolify
- ✅ **n8n** (déployé)
- ✅ **Gotenberg** (déployé)
- ✅ **Redis** (déployé)
- ✅ **Minio S3** (déployé)

**Impact:** Cela change **COMPLÈTEMENT** l'analyse coût/bénéfice ! 🎯

---

## 💰 RECALCUL DES COÛTS

### Audit Initial (sans infra existante)

| Solution | Coût/mois | Verdict |
|----------|-----------|---------|
| n8n Queue | 30-40€ | ❌ Trop cher |
| BullMQ + Redis | 15€ | ✅ Recommandé |

### Audit Révisé (avec infra existante)

| Solution | Coût/mois | Détail |
|----------|-----------|--------|
| **n8n Queue** | **0€** | Tout déjà payé dans VPS Hetzner ! |
| BullMQ in-app | 0€ | Utilise Redis existant |
| Hybride | 0€ | Mix des deux |

**Conclusion:** Le coût n'est plus un facteur différenciant ! 🚀

---

## 🎯 NOUVELLE RECOMMANDATION

### 🏆 Solution A: n8n (NOUVEAU CHOIX PRINCIPAL)

**Pourquoi changer d'avis?**

✅ **Infrastructure déjà prête**
- n8n, Gotenberg, Redis, Minio déjà installés
- 0€ de coût supplémentaire
- Juste besoin de créer le workflow

✅ **Simplicité opérationnelle**
- Interface visuelle pour debug
- Monitoring intégré n8n
- Logs centralisés dans Coolify
- Facile de modifier le workflow sans redéployer l'app

✅ **Séparation des responsabilités**
- App Next.js : logique métier + API
- n8n : traitements asynchrones (PDF, emails batch, etc.)
- Pas de pollution du codebase Next.js avec logique workers

✅ **Évolutivité**
- Facile d'ajouter d'autres workflows (rappels, stats, exports)
- n8n peut orchestrer plein d'autres automatisations
- Réutilisation de l'infra pour d'autres besoins

**Seul inconvénient:**
- Logique répartie entre app (TypeScript) et n8n (visual)
- Mais acceptable vu les avantages

---

### 🥈 Solution B: BullMQ in-app (alternative valide)

**Pourquoi c'est toujours valable?**

✅ **Tout dans TypeScript**
- Codebase unifié
- Tests unitaires faciles
- Versionning dans git

✅ **Performance légèrement supérieure**
- Pas de latence webhook HTTP
- Accès direct à Redis

✅ **Contrôle total**
- Debug dans IDE
- Stack traces complètes

**Inconvénients:**
- Complexité ajoutée dans le codebase Next.js
- Déploiement worker séparé (Coolify ou même process)
- N'utilise pas Gotenberg/Minio déjà en place (sauf si configuré)

---

### 🔀 Solution C: Hybride (best of both worlds)

**Architecture:**
```
Transaction créée
    ↓
├─→ Génération PDF: n8n workflow (Gotenberg → Minio)
├─→ Emails batch: BullMQ in-app
├─→ Rappels donateurs: BullMQ in-app
└─→ Exports CERFA: BullMQ in-app
```

**Quand utiliser quoi?**

**n8n pour:**
- ✅ Génération PDF (utilise Gotenberg)
- ✅ Uploads fichiers (vers Minio S3)
- ✅ Workflows multi-services
- ✅ Automatisations admin (sans code)

**BullMQ pour:**
- ✅ Logique métier complexe (nécessite TypeScript)
- ✅ Tâches très fréquentes (>100/seconde)
- ✅ Besoin de tests unitaires stricts
- ✅ Accès direct DB Supabase

---

## 📊 COMPARATIF RÉVISÉ

| Critère | n8n | BullMQ | Hybride |
|---------|-----|--------|---------|
| **Coût** | 0€ | 0€ | 0€ |
| **Setup time** | 2h | 1j | 1.5j |
| **Utilise infra existante** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Simplicité** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Monitoring** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Testabilité code** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Évolutivité** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Performance** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

**Score Total:**
- 🥇 **n8n: 4.7/5** ⬆️ (était 3.2/5)
- 🥈 Hybride: 4.5/5
- 🥉 BullMQ: 4.2/5

---

## 🚀 PLAN D'IMPLÉMENTATION n8n (RECOMMANDÉ)

### Phase 1: Configuration Réseau (15 min)

**1. Vérifier connectivité Supabase → n8n**

```bash
# Sur votre VPS Hetzner via Coolify
curl -X POST https://votre-n8n.domain.com/webhook-test/receipt-pdf \
  -H "Content-Type: application/json" \
  -d '{"test": "ok"}'
```

**2. Obtenir URL webhook n8n**
- Ouvrir n8n → Create Workflow
- Ajouter node "Webhook"
- Méthode: POST
- Path: `receipt-pdf`
- Copier l'URL (ex: `https://n8n.yourdomain.com/webhook/abc-123-xyz`)

**3. Configurer dans Supabase**

```sql
-- Via Supabase SQL Editor
SELECT set_n8n_webhook_url('https://votre-n8n.domain.com/webhook/abc-123-xyz');

-- Vérifier
SELECT get_n8n_webhook_url();
```

---

### Phase 2: Workflow n8n (30-45 min)

**Nodes à créer:**

```
[1] Webhook Trigger (POST)
    ↓
[2] Function: Extract Data
    ↓
[3] HTTP Request: Fetch Full Transaction from Supabase
    ↓
[4] Function: Build HTML Receipt
    ↓
[5] Gotenberg: Convert HTML → PDF
    ↓
[6] Minio S3: Upload PDF
    ↓
[7] Supabase: Update receipt record (pdf_url)
    ↓
[8] (Optional) Resend: Send email with PDF link
```

**Détail des nodes:**

#### Node 1: Webhook Trigger
```json
{
  "method": "POST",
  "path": "receipt-pdf",
  "responseMode": "responseNode",
  "options": {}
}
```

#### Node 2: Function - Extract Data
```javascript
// Extraire les données du webhook Supabase
const payload = $input.item.json;

return {
  transactionId: payload.transaction_id,
  receiptNumber: payload.receipt_number,
  amount: payload.amount,
  donorName: payload.donor_name,
  donorEmail: payload.donor_email
};
```

#### Node 3: HTTP Request - Fetch Transaction
```json
{
  "url": "https://votre-projet.supabase.co/rest/v1/support_transactions",
  "method": "GET",
  "qs": {
    "id": "eq.{{ $json.transactionId }}",
    "select": "*"
  },
  "headers": {
    "apikey": "{{ $credentials.supabaseKey }}",
    "Authorization": "Bearer {{ $credentials.supabaseKey }}"
  }
}
```

#### Node 4: Function - Build HTML
```javascript
// Construire le HTML du reçu
const transaction = $input.item.json[0];

const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; }
    h1 { color: #dc2626; }
    .header { text-align: center; margin-bottom: 40px; }
    .info { margin: 20px 0; }
    .footer { margin-top: 60px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Reçu Fiscal</h1>
    <p>N° ${transaction.receipt_number}</p>
  </div>

  <div class="info">
    <p><strong>Bénéficiaire:</strong> ${transaction.donor_name}</p>
    <p><strong>Montant du don:</strong> ${transaction.amount}€</p>
    <p><strong>Date:</strong> ${new Date(transaction.created_at).toLocaleDateString('fr-FR')}</p>
    <p><strong>Réduction fiscale (66%):</strong> ${(transaction.amount * 0.66).toFixed(2)}€</p>
  </div>

  <div class="footer">
    <p>Association des Sapeurs-Pompiers de Clermont</p>
    <p>Ce reçu fiscal vous permet de déduire 66% du montant de vos impôts.</p>
  </div>
</body>
</html>
`;

return { html, transaction };
```

#### Node 5: Gotenberg - HTML to PDF
```json
{
  "url": "http://gotenberg:3000/forms/chromium/convert/html",
  "method": "POST",
  "bodyParametersUi": {
    "parameter": [
      {
        "name": "files",
        "value": "={{ $json.html }}"
      }
    ]
  },
  "options": {
    "response": {
      "responseFormat": "file"
    }
  }
}
```

**Note:** Si Gotenberg est dans le même réseau Docker Coolify, utiliser le nom du service (`http://gotenberg:3000`). Sinon, utiliser l'URL complète.

#### Node 6: Minio S3 - Upload
```json
{
  "operation": "upload",
  "bucket": "receipts",
  "fileName": "={{ $('Function - Build HTML').item.json.transaction.receipt_number }}.pdf",
  "binaryData": true,
  "options": {
    "acl": "private"
  }
}
```

**Configuration Minio dans n8n:**
- Credentials → Add → S3
- Access Key ID: (depuis Minio)
- Secret Access Key: (depuis Minio)
- Endpoint: `http://minio:9000` (ou URL externe)
- Force Path Style: true
- Region: us-east-1 (si défaut)

#### Node 7: Supabase - Update Receipt
```json
{
  "url": "https://votre-projet.supabase.co/rest/v1/receipts",
  "method": "PATCH",
  "qs": {
    "id": "eq.{{ $('HTTP Request - Fetch Transaction').item.json[0].receipt_id }}"
  },
  "headers": {
    "apikey": "{{ $credentials.supabaseKey }}",
    "Authorization": "Bearer {{ $credentials.supabaseKey }}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
  },
  "body": {
    "pdf_url": "={{ $json.url }}",
    "status": "completed",
    "pdf_generated_at": "={{ new Date().toISOString() }}"
  }
}
```

#### Node 8: (Optional) Resend - Email with PDF
```json
{
  "operation": "send",
  "from": "no-reply@sapeurs-pompiers-clermont.fr",
  "to": "={{ $('Function - Build HTML').item.json.transaction.donor_email }}",
  "subject": "Votre reçu fiscal n°{{ $('Function - Build HTML').item.json.transaction.receipt_number }}",
  "text": "Votre reçu fiscal est disponible en pièce jointe.",
  "attachments": [
    {
      "filename": "recu-fiscal.pdf",
      "content": "={{ $binary.data }}"
    }
  ]
}
```

---

### Phase 3: Tests (15 min)

**1. Test Manuel dans n8n**
- Workflow → Execute Workflow
- Passer un payload de test:
```json
{
  "transaction_id": "une-id-test",
  "receipt_number": "2025-001",
  "amount": 50,
  "donor_name": "Test Donateur",
  "donor_email": "test@example.com"
}
```

**2. Test via Supabase**
```sql
-- Créer une transaction test
INSERT INTO support_transactions (
  amount,
  calendar_accepted,
  donor_email,
  donor_name,
  payment_method
) VALUES (
  50,
  false, -- Don fiscal
  'test@example.com',
  'Test Donateur',
  'test'
);
```

**3. Vérifier logs**
- n8n → Executions (voir si workflow s'est exécuté)
- Minio → Bucket `receipts` (PDF présent?)
- Supabase → Table `receipts` (status = completed?)

---

### Phase 4: Monitoring & Alertes (15 min)

**1. Activer notifications n8n**
- Settings → Error Workflow
- Créer workflow d'erreur:
  - Trigger: Error
  - Action: Send Email/Slack

**2. Dashboard Coolify**
- Vérifier logs n8n
- Vérifier logs Gotenberg
- Vérifier usage Minio

**3. Alertes Supabase**
```sql
-- Créer vue pour surveiller échecs
CREATE VIEW failed_receipt_generations AS
SELECT
  st.id,
  st.receipt_number,
  st.created_at,
  r.status,
  r.pdf_url
FROM support_transactions st
LEFT JOIN receipts r ON r.transaction_id = st.id
WHERE st.amount >= 6
  AND st.calendar_accepted = false
  AND (r.status IS NULL OR r.status = 'pending')
  AND st.created_at < NOW() - INTERVAL '1 hour';
```

---

## 🔧 CONFIGURATION SPÉCIFIQUE COOLIFY

### 1. Réseau Docker

**Vérifier que tous les services sont sur le même réseau:**

```bash
# Lister les réseaux Coolify
docker network ls | grep coolify

# Vérifier les containers
docker ps --format "table {{.Names}}\t{{.Networks}}"
```

**Si n8n, Gotenberg, Minio sur réseau séparé:**
- Dans Coolify, éditer chaque service
- Section "Network" → utiliser le même réseau

### 2. URLs Internes vs Externes

**Depuis n8n (dans Docker):**
- Gotenberg: `http://gotenberg:3000` (nom service Docker)
- Minio: `http://minio:9000`
- Redis: `redis://redis:6379`

**Depuis Supabase (externe):**
- n8n: `https://n8n.yourdomain.com/webhook/...`

### 3. Variables d'Environnement n8n

**Dans Coolify → n8n → Environment:**
```bash
N8N_ENCRYPTION_KEY=votre-key-securisee
WEBHOOK_URL=https://n8n.yourdomain.com
N8N_PAYLOAD_SIZE_MAX=16
EXECUTIONS_DATA_SAVE_ON_SUCCESS=all
EXECUTIONS_DATA_PRUNE=true
EXECUTIONS_DATA_MAX_AGE=168 # 7 jours
```

### 4. Minio Configuration

**Créer bucket via Minio Console:**
```
Bucket name: receipts
Access: Private
Versioning: Disabled (ou Enabled si backup souhaité)
```

**Access Keys:**
- Minio Console → Access Keys → Create
- Copier Access Key + Secret Key pour n8n

---

## 📈 ÉVOLUTIONS FUTURES avec n8n

### Workflows Additionnels Faciles à Ajouter

**1. Rappel Automatique (J+7 si pas de don)**
```
Cron (tous les jours 9h)
  → Supabase: Fetch donation_intents non convertis
  → Filter: created > 7 days ago
  → Resend: Email de rappel personnalisé
```

**2. Export Annuel CERFA**
```
Webhook Admin (bouton dashboard)
  → Supabase: Fetch all donations 2025
  → Function: Format CSV CERFA
  → Minio: Upload CSV
  → Resend: Email admin avec lien
```

**3. Stats Hebdomadaires**
```
Cron (lundi 9h)
  → Supabase: Aggregate donations semaine passée
  → Function: Build HTML report
  → Gotenberg: PDF
  → Slack/Email: Envoi équipe
```

**4. Backup Automatique**
```
Cron (tous les jours 3h)
  → Supabase: Export transactions via API
  → Minio: Upload JSON dump
  → Retention: 30 jours
```

---

## 🆚 QUAND UTILISER BullMQ AU LIEU DE n8n?

**Cas où BullMQ serait meilleur:**

1. **Logique métier très complexe**
   - Calculs fiscaux complexes avec conditions multiples
   - Besoin de types TypeScript stricts
   - Algorithmes nécessitant librairies NPM spécifiques

2. **Volume très élevé (>100 jobs/seconde)**
   - n8n peut avoir latence webhook
   - BullMQ plus performant pour high-throughput

3. **Tests critiques**
   - Besoin de tests unitaires Jest/Vitest
   - Coverage code >90%
   - CI/CD avec tests automatisés

4. **Transactions DB complexes**
   - Besoin de gérer transactions Postgres manuellement
   - Rollback conditionnel complexe
   - Locks DB spécifiques

**Pour votre cas (reçus fiscaux):**
→ **n8n suffit largement** ✅

---

## 💡 RECOMMANDATION FINALE RÉVISÉE

### 🥇 Option 1: Pure n8n (recommandée)

**Délai:** 2-3 heures
**Coût:** 0€
**Complexité:** Faible

✅ Utilise toute l'infra existante
✅ Simple à débugger (UI visuelle)
✅ Facile d'évoluer (autres workflows)
✅ Monitoring intégré

**Prochaine étape:** Je peux créer le workflow n8n complet (JSON export) que vous importez dans n8n.

---

### 🥈 Option 2: Hybride (si besoin tests stricts)

**Délai:** 1 jour
**Coût:** 0€
**Complexité:** Moyenne

- PDF via n8n (workflow ci-dessus)
- Autres jobs via BullMQ in-app (emails batch, rappels)

**Prochaine étape:** Implémenter les deux en parallèle.

---

### 🥉 Option 3: Pure BullMQ (si vous abandonnez n8n pour autre chose)

**Délai:** 2 jours
**Coût:** 0€
**Complexité:** Élevée

- Worker TypeScript déployé sur Coolify
- Utilise Redis existant
- Gotenberg appelé directement depuis worker
- Minio utilisé pour upload

**Prochaine étape:** Setup BullMQ + déployer worker.

---

## 🎯 MA RECOMMANDATION

**Aller avec n8n (Option 1)** pour:
- ✅ Rapidité (2-3h vs 2 jours)
- ✅ Utiliser l'infra déjà payée et configurée
- ✅ Simplicité opérationnelle
- ✅ Interface visuelle pour modifier workflows
- ✅ Évolutivité (facile d'ajouter exports, stats, etc.)

**Le seul cas où BullMQ serait meilleur:** Si vous avez besoin de tests unitaires très stricts sur la génération PDF (peu probable pour des reçus fiscaux).

---

## 🚀 PROCHAINES ACTIONS CONCRÈTES

### Si vous choisissez n8n:

1. **Je crée le workflow n8n complet** (fichier JSON)
2. **Vous l'importez dans votre n8n**
3. **Configuration (15 min):**
   - Credentials Supabase
   - Credentials Minio
   - URL webhook dans Supabase
4. **Test avec transaction réelle**
5. **Production** ✅

**Voulez-vous que je vous génère le workflow n8n JSON prêt à importer?** 🎯

---

## 📋 CHECKLIST FINALE

Avant mise en production:
- [ ] Workflow n8n créé et testé
- [ ] Credentials configurées (Supabase, Minio, Resend)
- [ ] Webhook URL configurée dans Supabase (`set_n8n_webhook_url()`)
- [ ] Bucket Minio `receipts` créé
- [ ] Test avec vraie transaction
- [ ] Vérification PDF généré dans Minio
- [ ] Vérification `receipts.status = completed` dans Supabase
- [ ] Error workflow n8n configuré (alertes)
- [ ] Documentation mise à jour
- [ ] Monitoring actif (logs Coolify)

**Temps total estimé:** ⏱️ 2-3 heures max

---

**Quelle option préférez-vous?** Je suis prêt à vous fournir:
1. Le workflow n8n JSON complet (import direct)
2. OU le code BullMQ TypeScript
3. OU les deux (hybride)

Dites-moi et on lance l'implémentation ! 🚀
