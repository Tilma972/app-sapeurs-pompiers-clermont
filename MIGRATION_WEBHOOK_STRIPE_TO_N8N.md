# Migration : Webhook Stripe → n8n pour reçus fiscaux

**Date :** 2025-11-30
**Objectif :** Désactiver la génération de reçus fiscaux dans le webhook Stripe et laisser le trigger PostgreSQL → n8n gérer 100% des PDF

---

## ✅ Modifications apportées

### Fichier modifié : `app/api/webhooks/stripe/route.ts`

**3 événements modifiés :**

#### 1. `checkout.session.completed` (lignes 98-185)
- ❌ **Désactivé** : Génération de reçu fiscal via `issue_receipt()`
- ✅ **Ajouté** : Email de confirmation immédiat (Resend)
- ✅ **Ajouté** : Log pour tracer le trigger n8n

#### 2. `payment_intent.succeeded` (lignes 362-424)
- ❌ **Désactivé** : Génération de reçu fiscal via `issue_receipt()`
- ✅ **Conservé** : Email de confirmation immédiat (déjà présent)
- ✅ **Ajouté** : Log pour tracer le trigger n8n

#### 3. `charge.succeeded` (lignes 584-646)
- ❌ **Désactivé** : Génération de reçu fiscal via `issue_receipt()`
- ✅ **Conservé** : Email de confirmation immédiat (déjà présent)
- ✅ **Ajouté** : Log pour tracer le trigger n8n

---

## 📧 Nouveau flow des emails

### Avant (ancien système)
```
Paiement Stripe
  ↓
Webhook Stripe insère transaction
  ↓
SI amount >= 6€ ET calendar_accepted = false
  ↓
issue_receipt() → Reçu HTML
  ↓
sendEmail() via Resend (1 seul email avec reçu)
```

### Après (nouveau système)
```
Paiement Stripe
  ↓
Webhook Stripe insère transaction
  ↓
✉️ EMAIL 1 (immédiat, Resend) : "Merci pour votre don/soutien !"
  ↓
Trigger PostgreSQL détecte INSERT
  ↓
Webhook vers n8n via pg_net
  ↓
n8n génère PDF via Gotenberg
  ↓
✉️ EMAIL 2 (2-5 min après, n8n) : "Voici votre reçu fiscal PDF"
```

**Avantages :**
- ✅ 2 emails distincts et clairs
- ✅ Confirmation immédiate (quelques secondes)
- ✅ Reçu fiscal PDF professionnel (quelques minutes)
- ✅ Règles métier correctes (calendrier = 1,33€)

---

## 🔄 Procédure de rollback d'urgence

**Si n8n est HS pendant plusieurs heures :**

### Étape 1 : Réactiver l'import buildSubject

**Ligne 6 de `app/api/webhooks/stripe/route.ts` :**

```typescript
// Avant (actuel)
import { buildHtml, buildText } from '@/lib/email/receipt-templates'

// Après (rollback)
import { buildSubject, buildHtml, buildText } from '@/lib/email/receipt-templates'
```

### Étape 2 : Décommenter le code de génération de reçu

Décommenter les 3 blocs de code dans `app/api/webhooks/stripe/route.ts` :

```typescript
// Lignes 110-134 (checkout.session.completed)
// Lignes 370-414 (payment_intent.succeeded)
// Lignes 592-636 (charge.succeeded)

// Supprimer les /* et */ pour réactiver
```

### Étape 3 : Redéployer
```bash
git add app/api/webhooks/stripe/route.ts
git commit -m "Rollback: réactivation Resend (n8n HS)"
git push origin main
# Déployer sur Vercel/production
```

### Étape 4 : Traiter les transactions manquantes
```sql
-- Générer manuellement les reçus HTML pour les transactions sans PDF
SELECT * FROM issue_receipt('<transaction_id>');

-- Ou utiliser le script de backfill
SELECT * FROM backfill_all_missing_receipts();
```

**Temps de rollback estimé : 5-10 minutes**

---

## 📊 Dashboard de monitoring

Requêtes SQL à exécuter quotidiennement pour surveiller n8n :

```sql
-- 1. Transactions >= 6€ créées hier
SELECT COUNT(*) as transactions_eligibles
FROM support_transactions
WHERE amount >= 6
  AND supporter_email IS NOT NULL
  AND created_at >= NOW() - INTERVAL '24 hours';

-- 2. Webhooks n8n envoyés hier
SELECT COUNT(*) as webhooks_envoyes
FROM webhook_logs
WHERE source = 'pg_net_trigger'
  AND event_type = 'receipt.generate'
  AND created_at >= NOW() - INTERVAL '24 hours';

-- 3. Taux de succès n8n (doit être > 95%)
SELECT
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM webhook_logs
WHERE source = 'pg_net_trigger'
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY status;

-- ⚠️ ALERTE si taux d'erreur > 5% ou si 0 webhook envoyé
```

---

## 🧪 Plan de test avant production

### Test 1 : Don sans calendrier (10€)
1. Faire un don de 10€ sans calendrier
2. Vérifier email de confirmation immédiat (Resend)
3. Attendre 5 minutes
4. Vérifier email avec PDF (n8n)
5. Vérifier que les calculs fiscaux sont corrects (déduction 10€ × 66% = 6,60€)

### Test 2 : Don avec calendrier (10€)
1. Faire un don de 10€ avec calendrier
2. Vérifier email de confirmation immédiat (Resend)
3. Attendre 5 minutes
4. Vérifier email avec PDF (n8n)
5. Vérifier que les calculs fiscaux sont corrects (déduction (10€ - 1,33€) × 66% = 5,72€)

### Test 3 : Petit don (3€)
1. Faire un don de 3€
2. Vérifier email de confirmation immédiat (Resend)
3. Vérifier qu'AUCUN PDF n'est envoyé (montant < 6€)

### Test 4 : Vérifier les logs
```sql
-- Voir les logs webhook Stripe
SELECT * FROM webhook_logs WHERE source = 'stripe' ORDER BY created_at DESC LIMIT 5;

-- Voir les logs trigger n8n
SELECT * FROM webhook_logs WHERE source = 'pg_net_trigger' ORDER BY created_at DESC LIMIT 5;
```

---

## 📝 Checklist de déploiement

Avant de déployer en production :

- [ ] ✅ Migrations SQL appliquées (pg_net, trigger corrigé)
- [ ] ✅ URL webhook n8n configurée dans `n8n_settings`
- [ ] ✅ Workflow n8n actif et opérationnel
- [ ] ✅ Gotenberg disponible et testé
- [ ] ✅ Tests en staging réussis (3 scénarios ci-dessus)
- [ ] ✅ Dashboard de monitoring SQL prêt
- [ ] ✅ Procédure de rollback documentée
- [ ] ✅ Équipe technique informée du changement
- [ ] ✅ Backup de la base de données effectué

---

## 🎯 Règles métier confirmées

### Tous les dons >= 6€ ont droit au reçu fiscal

**AVEC ou SANS calendrier** (valeur calendrier = 1,33€)

| Montant | Calendrier | Reçu fiscal ? | Montant déductible | Réduction 66% |
|---------|------------|---------------|-------------------|---------------|
| 6€      | Non        | ✅ Oui        | 6,00€             | 3,96€         |
| 6€      | Oui        | ✅ Oui        | 4,67€             | 3,08€         |
| 10€     | Non        | ✅ Oui        | 10,00€            | 6,60€         |
| 10€     | Oui        | ✅ Oui        | 8,67€             | 5,72€         |
| 5€      | Non/Oui    | ❌ Non        | -                 | -             |

**Base légale :** Article 200 du Code Général des Impôts
- Contrepartie < 25% du don ✅
- Contrepartie < 73€ ✅
- → Don avec calendrier éligible à réduction d'impôt

---

## 📚 Documentation associée

- `AUDIT_FISCAL_RECEIPT_GENERATION.md` - Audit complet du système
- `AUDIT_FISCAL_RECEIPT_GENERATION_ADDENDUM.md` - Règles métier calendrier
- `GUIDE_BACKFILL_RECEIPTS.md` - Guide de régénération des PDF manquants
- `supabase/migrations/20251130_fix_n8n_trigger_use_pg_net.sql` - Migration trigger
- `supabase/migrations/BACKFILL_generate_missing_receipts.sql` - Script de rattrapage

---

**Date de déploiement :** _À compléter après validation_
**Validé par :** _À compléter_
