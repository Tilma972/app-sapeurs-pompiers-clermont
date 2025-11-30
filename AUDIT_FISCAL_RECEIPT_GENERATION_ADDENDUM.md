# Addendum - Audit génération de reçus fiscaux via n8n

**Date :** 2025-11-30
**Complément à :** AUDIT_FISCAL_RECEIPT_GENERATION.md

---

## ⚠️ CORRECTION IMPORTANTE - Règle métier sur les calendriers

### Information critique fournie après l'audit initial

**Valeur du calendrier : ~1,33€**

Cette précision change **fondamentalement** l'analyse des règles métier.

---

## ❌ Erreur dans l'audit initial

### Ce que j'avais compris (INCORRECT)

Dans l'audit initial, j'ai écrit :

> **Règles métier attendues :**
> - `calendar_accepted = false` → Don fiscal (éligible reçu fiscal)
> - `calendar_accepted = true` → Soutien avec calendrier (**PAS éligible** reçu fiscal)

Et j'ai ajouté un filtre dans la migration de correction :
```sql
IF NEW.amount < 6 OR NEW.supporter_email IS NULL OR NEW.calendar_accepted = true THEN
  RETURN NEW;
END IF;
```

**❌ Ce filtre est FAUX et aurait exclu tous les dons avec calendrier du système de reçus fiscaux.**

---

## ✅ Règles métier CORRECTES

### Législation fiscale française applicable

Selon l'article 200 du Code Général des Impôts, un don **avec contrepartie** reste éligible à la réduction d'impôt SI :
1. La valeur de la contrepartie < **25% du montant du don**
2. La valeur de la contrepartie < **73€**

**Dans notre cas :**
- Valeur du calendrier = **1,33€**
- Pour un don de 6€ : 1,33€ < 25% × 6€ = 1,50€ ✅
- 1,33€ < 73€ ✅

**→ Donc TOUS les dons >= 6€ sont éligibles au reçu fiscal, AVEC ou SANS calendrier.**

### Calcul du montant déductible

**Formule :**
```
Montant déductible = Montant du don - Valeur de la contrepartie
```

**Cas 1 : Don pur (sans calendrier)**
- `calendar_accepted = false`
- Montant déductible = 100% du don
- Exemple : Don de 10€ → Déduction de 10€ × 66% = **6,60€**

**Cas 2 : Don avec calendrier**
- `calendar_accepted = true`
- Montant déductible = Montant - 1,33€
- Exemple : Don de 10€ → Déduction de (10€ - 1,33€) × 66% = **5,72€**

**Cas 3 : Don minimum avec calendrier**
- Don de 6€ avec calendrier
- Montant déductible = 6€ - 1,33€ = 4,67€
- Déduction = 4,67€ × 66% = **3,08€**
- ✅ Reste éligible

---

## 🔧 Corrections apportées

### 1. Nouvelle migration : `20251130_fix_n8n_trigger_calendar_filter.sql`

Cette migration corrige le filtre erroné :

**✅ Filtre CORRECT :**
```sql
-- TOUS les dons >= 6€ avec email valide (avec ou sans calendrier)
IF NEW.amount < 6 OR NEW.supporter_email IS NULL THEN
  RETURN NEW;
END IF;
```

**Payload JSON enrichi avec calculs fiscaux :**
```sql
payload := jsonb_build_object(
  'amount', NEW.amount,
  'calendar_accepted', NEW.calendar_accepted,
  'calendar_value', 1.33,  -- Valeur de la contrepartie

  -- Calcul du montant déductible
  'deductible_amount', CASE
    WHEN NEW.calendar_accepted = true THEN NEW.amount - 1.33
    ELSE NEW.amount
  END,

  -- Calcul de la réduction d'impôt
  'tax_reduction', CASE
    WHEN NEW.calendar_accepted = true THEN ROUND((NEW.amount - 1.33) * 0.66, 2)
    ELSE ROUND(NEW.amount * 0.66, 2)
  END,

  -- ... autres champs
);
```

### 2. Le workflow n8n doit calculer le montant déductible

**Code JavaScript dans n8n :**
```javascript
// Récupérer les données du webhook
const amount = $json.amount;
const calendarAccepted = $json.calendar_accepted;
const calendarValue = 1.33;

// Calculer le montant déductible
const deductibleAmount = calendarAccepted
  ? amount - calendarValue
  : amount;

// Calculer la réduction d'impôt (66%)
const taxReduction = Math.round(deductibleAmount * 0.66 * 100) / 100;

// Utiliser ces valeurs dans le PDF généré par Gotenberg
return {
  amount: amount,
  deductibleAmount: deductibleAmount,
  taxReduction: taxReduction,
  calendarGiven: calendarAccepted
};
```

### 3. Le PDF du reçu fiscal doit mentionner

**Si `calendar_accepted = true` :**
```
Montant du versement : 10,00€
Valeur de la contrepartie (calendrier) : 1,33€
Montant ouvrant droit à réduction : 8,67€
Réduction d'impôt (66%) : 5,72€
```

**Si `calendar_accepted = false` :**
```
Montant du versement : 10,00€
Don sans contrepartie
Montant ouvrant droit à réduction : 10,00€
Réduction d'impôt (66%) : 6,60€
```

---

## 📊 Impact de la correction

### Avant la correction (migration erronée)

**Trigger n8n avec filtre incorrect :**
```sql
-- ❌ Excluait les dons avec calendrier
IF ... OR NEW.calendar_accepted = true THEN RETURN NEW; END IF;
```

**Résultat :**
- Don de 10€ sans calendrier → ✅ Reçu fiscal généré
- Don de 10€ avec calendrier → ❌ **AUCUN reçu fiscal** (filtré par le trigger)

**→ Non-conformité fiscale : des personnes éligibles ne recevraient pas leur reçu fiscal**

### Après la correction

**Trigger n8n avec filtre correct :**
```sql
-- ✅ Tous les dons >= 6€ avec email
IF NEW.amount < 6 OR NEW.supporter_email IS NULL THEN RETURN NEW; END IF;
```

**Résultat :**
- Don de 10€ sans calendrier → ✅ Reçu fiscal généré (déduction 6,60€)
- Don de 10€ avec calendrier → ✅ Reçu fiscal généré (déduction 5,72€)

**→ Conformité fiscale respectée**

---

## 🔍 Pourquoi le trigger original n'avait PAS de filtre sur `calendar_accepted`

En relisant le trigger original (`supabase/migrations/20251111_webhook_trigger_n8n_pdf.sql:141-144`) :

```sql
-- Ne traiter que les dons >= 6€ avec email valide
IF NEW.amount < 6 OR NEW.supporter_email IS NULL THEN
  RETURN NEW;
END IF;
-- ⚠️ Pas de filtre sur calendar_accepted !
```

**Ce n'était PAS un oubli, c'était VOLONTAIRE.**

Le développeur initial connaissait la règle métier :
- Tous les dons >= 6€ ont droit au reçu fiscal
- La valeur du calendrier (1,33€) doit juste être déduite du montant

**Mon erreur dans l'audit initial :**
- J'ai vu l'absence de filtre et j'ai pensé que c'était un bug
- J'ai recommandé d'ajouter le filtre `calendar_accepted = false`
- **J'avais tort**

---

## 📝 Analyse du webhook Stripe

### Le webhook Stripe fait-il le bon calcul ?

**Code dans `app/api/webhooks/stripe/route.ts:98-123` :**

```typescript
// Générer un reçu fiscal UNIQUEMENT pour les dons (calendar_accepted: false)
// Boutique et achats avec contrepartie n'ont PAS droit au reçu fiscal
if (tx && amount >= 6 && !calendarAccepted) {
  const { data: rec } = await admin.rpc('issue_receipt', { p_transaction_id: tx.id }).single()
  // ...
}
```

**⚠️ Le webhook Stripe a le MÊME filtre erroné que j'avais ajouté au trigger !**

**Il filtre `!calendarAccepted`**, ce qui signifie :
- Don >= 6€ sans calendrier → ✅ Reçu généré
- Don >= 6€ avec calendrier → ❌ **AUCUN reçu généré**

**→ Le webhook Stripe actuel n'est PAS conforme à la réglementation fiscale.**

### Pourquoi ce filtre existe-t-il dans le webhook Stripe ?

Deux hypothèses :

**Hypothèse 1 : Simplification volontaire**
- Le développeur a choisi de ne générer des reçus que pour les dons "purs"
- Les dons avec calendrier ne reçoivent pas de reçu (même s'ils y ont droit)
- → Simplifie la gestion mais prive des donateurs de leur droit

**Hypothèse 2 : Mauvaise interprétation de la loi**
- Le développeur a cru que "contrepartie = pas de reçu fiscal"
- Or, la loi autorise les contreparties de faible valeur (< 25% du don)

### Correction recommandée pour le webhook Stripe

**Option A : Supprimer le filtre `!calendarAccepted`**

```typescript
// ✅ TOUS les dons >= 6€ ont droit au reçu fiscal
if (tx && amount >= 6 && tx.supporter_email) {
  const { data: rec } = await admin.rpc('issue_receipt', { p_transaction_id: tx.id }).single()

  // Calculer le montant déductible
  const calendarValue = 1.33;
  const deductibleAmount = calendarAccepted ? amount - calendarValue : amount;
  const taxReduction = Math.round(deductibleAmount * 0.66 * 100) / 100;

  // Envoyer l'email avec le bon calcul fiscal
  const html = buildHtml({
    supporterName: tx.supporter_name,
    amount: amount,
    deductibleAmount: deductibleAmount,
    taxReduction: taxReduction,
    calendarGiven: calendarAccepted,
    receiptNumber: receiptNumber,
    transactionType: 'fiscal'
  })

  await sendEmail({ to: donorEmail, subject, html, text })
}
```

**Option B : Désactiver le webhook Stripe et utiliser uniquement le trigger n8n**

Si vous préférez centraliser la génération de reçus fiscaux dans n8n :

```typescript
// Dans le webhook Stripe, NE PAS appeler issue_receipt()
if (tx && amount >= 6 && !calendarAccepted) {
  // ❌ Supprimer cette section
  // Le trigger PostgreSQL va s'en charger
  log.info('Don fiscal détecté, le trigger n8n va générer le reçu', {
    transaction_id: tx.id
  })
}
```

---

## 📋 Tableau récapitulatif des cas

| Montant | Calendrier | Éligible reçu ? | Montant déductible | Réduction 66% |
|---------|------------|-----------------|-------------------|---------------|
| 5,00€ | Non | ❌ Montant < 6€ | - | - |
| 5,00€ | Oui | ❌ Montant < 6€ | - | - |
| 6,00€ | Non | ✅ Oui | 6,00€ | 3,96€ |
| 6,00€ | Oui | ✅ Oui | 4,67€ | 3,08€ |
| 10,00€ | Non | ✅ Oui | 10,00€ | 6,60€ |
| 10,00€ | Oui | ✅ Oui | 8,67€ | 5,72€ |
| 20,00€ | Non | ✅ Oui | 20,00€ | 13,20€ |
| 20,00€ | Oui | ✅ Oui | 18,67€ | 12,32€ |

---

## 🎯 Actions recommandées mises à jour

### 1. Appliquer la migration de correction (URGENT)

```sql
-- Appliquer la nouvelle migration qui corrige le filtre
\i supabase/migrations/20251130_fix_n8n_trigger_calendar_filter.sql
```

### 2. Corriger le webhook Stripe (URGENT si utilisé en production)

Actuellement, le webhook Stripe **ne génère PAS de reçu fiscal pour les dons avec calendrier**.

**Vérifier l'impact :**
```sql
-- Combien de dons >= 6€ avec calendrier n'ont PAS de reçu ?
SELECT
  COUNT(*) as dons_sans_recu,
  SUM(amount) as montant_total,
  MIN(created_at) as premier_don,
  MAX(created_at) as dernier_don
FROM support_transactions
WHERE amount >= 6
  AND calendar_accepted = true
  AND supporter_email IS NOT NULL
  AND receipt_number IS NULL;  -- Pas de reçu généré
```

Si cette requête retourne des lignes, **vous avez des donateurs qui n'ont pas reçu leur reçu fiscal alors qu'ils y ont droit**.

### 3. Mettre à jour les templates d'email

Les templates de reçu fiscal doivent mentionner :
- Le montant total du don
- La valeur de la contrepartie (si calendrier remis)
- Le montant ouvrant droit à réduction
- Le montant de la réduction d'impôt (66%)

### 4. Tester avec les deux cas

```sql
-- Test 1: Don sans calendrier
INSERT INTO support_transactions (...)
VALUES (..., 10.00, false, ...);  -- calendar_accepted = false

-- Test 2: Don avec calendrier
INSERT INTO support_transactions (...)
VALUES (..., 10.00, true, ...);   -- calendar_accepted = true

-- Vérifier que LES DEUX génèrent un webhook vers n8n
SELECT * FROM webhook_logs WHERE source = 'pg_net_trigger' ORDER BY created_at DESC LIMIT 2;
```

---

## 🔗 Références légales

### Code Général des Impôts - Article 200

> Les dons et versements effectués au profit d'organismes d'intérêt général ouvrent droit à une réduction d'impôt sur le revenu égale à 66% du montant versé.

> **Contreparties admises :**
> La réduction d'impôt s'applique même si le don donne lieu à une contrepartie, sous réserve que :
> - La valeur de la contrepartie n'excède pas 25% du montant du don
> - La valeur de la contrepartie n'excède pas 73€

**Source :** [Article 200 du CGI](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042912891)

### Bofip (Bulletin Officiel des Finances Publiques)

**BOI-IR-RICI-250-20-20** : Réductions d'impôt accordées au titre des dons faits par les particuliers

> "La remise de biens ou services de faible valeur en remerciement du versement effectué ne remet pas en cause le caractère de libéralité du don, dès lors que leur valeur n'excède pas 25% du montant du versement et 73€."

---

## 📚 Conclusion de l'addendum

### Erreurs corrigées

1. ❌ **Audit initial** : Recommandation d'ajouter un filtre `calendar_accepted = false`
2. ✅ **Correction** : Supprimer ce filtre, tous les dons >= 6€ sont éligibles
3. ❌ **Webhook Stripe** : Filtre `!calendarAccepted` exclut les dons avec calendrier
4. ✅ **Recommandation** : Corriger le webhook Stripe pour générer les reçus pour tous les dons >= 6€

### Règle métier définitive

```
Reçu fiscal généré SI ET SEULEMENT SI :
  amount >= 6€
  ET supporter_email IS NOT NULL

Montant déductible :
  SI calendar_accepted = false : amount
  SI calendar_accepted = true : amount - 1,33€

Réduction d'impôt (66%) :
  montant_déductible × 0,66
```

### Migrations à appliquer dans l'ordre

1. ✅ `20251130_fix_n8n_trigger_use_pg_net.sql` (remplace `http` par `pg_net`)
2. ✅ `20251130_fix_n8n_trigger_calendar_filter.sql` (corrige le filtre calendrier)

---

**Merci pour cette précision cruciale qui a permis de corriger une erreur potentiellement grave !**

---

*Addendum rédigé le 2025-11-30 par Claude*
