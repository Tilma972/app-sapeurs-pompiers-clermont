# 🔍 AUDIT DU PIPELINE DE PAIEMENT PAR CODE QR

**Date:** 2025-11-24
**Contexte:** Paiement par carte bancaire via QR code (Stripe PaymentIntent)
**Payment Intent ID:** `pi_3SX1sB4Iwp2z3Wxn1WLeUmPj`
**Montant:** 2,00 €
**Statut Stripe:** ✅ Succès (payment_intent.succeeded)

---

## 📊 RÉSUMÉ EXÉCUTIF

### ✅ Ce qui fonctionne

1. **Génération du QR code** : Le modal génère correctement le code QR avec l'URL de paiement
2. **Stripe PaymentIntent** : Le PaymentIntent est créé avec succès avec les metadata nécessaires
3. **Page de paiement** : La page `/pay/[clientSecret]` s'ouvre et affiche le formulaire Stripe
4. **Paiement Stripe** : Le paiement est traité avec succès par Stripe (3D Secure, charge captured)
5. **Webhook reception** : Le webhook `payment_intent.succeeded` est bien reçu et loggé dans `webhook_logs`

### ❌ Ce qui ne fonctionne PAS

1. **Insertion dans `support_transactions`** : La transaction n'est pas enregistrée dans la base de données
2. **Notifications toast** : L'utilisateur ne reçoit pas de confirmation visuelle
3. **Email de confirmation** : Aucun email n'est envoyé au donateur
4. **Suivi de la transaction** : Aucune trace de la transaction dans l'application

---

## 🔎 ANALYSE TECHNIQUE DÉTAILLÉE

### 1. Pipeline de paiement QR code

#### 📁 Fichiers impliqués

| Fichier | Rôle | Statut |
|---------|------|--------|
| `components/payment-card-modal.tsx` | Modal de génération QR + écoute Realtime | ✅ OK |
| `app/actions/create-payment-intent.ts` | Création du PaymentIntent Stripe | ✅ OK |
| `app/pay/[clientSecret]/page.tsx` | Redirection vers formulaire de paiement | ✅ OK |
| `components/stripe-payment-page.tsx` | Formulaire de paiement Stripe | ✅ OK |
| `app/api/webhooks/stripe/route.ts` | Traitement du webhook | ⚠️ **PROBLÈME** |

#### 🔄 Flux de paiement

```
1. Utilisateur ouvre PaymentCardModal
   ↓
2. Saisit montant + coche "Calendrier remis"
   ↓
3. Clique "Générer QR paiement"
   ↓
4. createPaymentIntent() crée le PI avec metadata:
   - tournee_id: "af7e6841-e06f-482b-bc9d-63283c83139a"
   - calendar_given: "true"
   - user_id: "c7a9dc2a-ef93-4e9a-b594-de407daa30d8"
   ↓
5. QR code affiché avec URL: /pay/pi_xxx_secret_yyy
   ↓
6. Donateur scanne QR → Page StripePaymentPage
   ↓
7. Saisit nom, email, carte bancaire
   ↓
8. Confirme paiement → Stripe traite (3D Secure)
   ↓
9. ✅ Paiement réussi → Stripe envoie webhook
   ↓
10. ❌ ÉCHEC ICI : Transaction non enregistrée
```

---

### 2. Problème #1 : Gestion d'erreur manquante dans le webhook

#### 🐛 Code problématique

**Fichier:** `app/api/webhooks/stripe/route.ts:210-225`

```typescript
const { data: tx } = await admin
  .from('support_transactions')
  .insert({
    user_id: meta.user_id ?? null,
    tournee_id: meta.tournee_id ?? null,
    amount,
    calendar_accepted: calendarAccepted,
    payment_method: 'carte',
    payment_status: 'completed',
    notes: `Stripe PI - ${paymentIntent.id}`,
    supporter_name: effectiveName,
    supporter_email: effectiveEmail,
    stripe_session_id: paymentIntent.id,
  })
  .select('id, amount, supporter_name, supporter_email')
  .single()
```

#### ⚠️ Problèmes identifiés

1. **Pas de try/catch** : Si l'insertion échoue, l'exception n'est pas capturée
2. **Pas de vérification d'erreur** : Le code ne vérifie pas si `tx` est `null` ou si une erreur est retournée
3. **Retour optimiste** : Le webhook retourne `{ received: true }` à Stripe même en cas d'échec
4. **Pas de logging d'erreur** : Aucune trace de l'échec dans les logs

#### 💡 Conséquence

Si l'insertion échoue pour une raison quelconque (contrainte de base de données, RLS, timeout, etc.), le webhook ne log rien et Stripe pense que tout s'est bien passé. La transaction est perdue.

---

### 3. Problème #2 : Contraintes de base de données

#### 📋 Contraintes sur `support_transactions`

**Fichier:** `supabase/migrations/006_feature_fiscal_support.sql`

```sql
-- Ligne 14-15 : Champs NOT NULL
tournee_id UUID REFERENCES tournees(id) NOT NULL,
user_id UUID REFERENCES auth.users(id) NOT NULL,

-- Ligne 65-68 : Contrainte email pour dons fiscaux
CONSTRAINT email_required_for_fiscal_donation CHECK (
    (calendar_accepted = true) OR
    (calendar_accepted = false AND supporter_email IS NOT NULL AND supporter_email <> '')
)
```

#### ✅ Vérification des données du webhook

D'après le payload fourni :

```json
"metadata": {
  "calendar_given": "true",           ✅ OK
  "tournee_id": "af7e6841-...",        ✅ OK
  "user_id": "c7a9dc2a-ef93-..."       ✅ OK
},
"charges": {
  "data": [{
    "billing_details": {
      "name": "Stève DONIVAR ",         ✅ OK
      "email": "tilma972@gmail.com"     ✅ OK
    }
  }]
}
```

Toutes les contraintes devraient être respectées. **Le problème n'est donc pas une contrainte SQL.**

---

### 4. Problème #3 : Événements webhook multiples

#### 🔄 Événements Stripe traités

Le webhook traite **3 types d'événements** pour le même paiement :

1. `checkout.session.completed` (Stripe Checkout)
2. `payment_intent.succeeded` (PaymentIntent direct)  ← **Utilisé par le QR code**
3. `charge.succeeded` (Charge confirmée)

#### ⚠️ Risque de duplication

Pour un paiement QR, Stripe envoie **deux événements** :
- `payment_intent.succeeded` (en premier)
- `charge.succeeded` (quelques secondes après)

**Système d'idempotence actuel :**
- Les 3 handlers utilisent le champ `stripe_session_id` pour stocker différents IDs
- Si `payment_intent.succeeded` échoue silencieusement, `charge.succeeded` pourrait réussir et créer la transaction
- Mais si `payment_intent.succeeded` réussit, `charge.succeeded` sera bloqué par l'idempotence

#### 🧪 Hypothèse

**Scénario probable :**
1. Webhook `payment_intent.succeeded` reçu
2. Insertion dans `support_transactions` échoue silencieusement (erreur non loggée)
3. Webhook `charge.succeeded` reçu quelques secondes après
4. Insertion échoue également (même erreur)
5. Aucune transaction n'est créée, aucune erreur n'est loggée

---

### 5. Problème #4 : Système de notifications (toasts)

#### 🔔 Mécanisme actuel

**Fichier:** `components/payment-card-modal.tsx:36-60`

```typescript
useEffect(() => {
  if (!open || !piId) return
  const supabase = createClient()
  const channel = supabase
    .channel(`st-${piId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'support_transactions',
      filter: `stripe_session_id=eq.${piId}`,
    }, (payload) => {
      const amt = payload?.new?.amount ?? null
      const name = payload?.new?.supporter_name ?? null
      toast.success(`Paiement confirmé ${amt}€ • ${name}`)
      setOpen(false)
    })
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}, [open, piId])
```

#### ⚠️ Problème

Le modal écoute les **INSERT** dans `support_transactions` via Supabase Realtime.

**Si l'insertion échoue → Aucun événement INSERT → Aucun toast**

Le système de polling de fallback (lignes 63-92) a le même problème :
```typescript
const { data } = await supabase
  .from('support_transactions')
  .select('id, amount, supporter_name')
  .eq('stripe_session_id', piId)
  .maybeSingle()
```

Si aucune transaction n'est créée, le polling ne trouvera rien.

---

### 6. Problème #5 : Emails de confirmation

#### 📧 Configuration actuelle

**Fichier:** `app/api/webhooks/stripe/route.ts:228-251`

Le webhook envoie un email **UNIQUEMENT** si :
1. `amount >= 6` (minimum pour reçu fiscal)
2. `!calendarAccepted` (don fiscal sans contrepartie)

```typescript
if (tx && amount >= 6 && !calendarAccepted) {
  // Génère reçu fiscal + envoie email
}
```

#### ⚠️ Dans votre cas

- Montant : 2,00 € → `amount < 6` ❌
- Calendrier remis : `true` → `calendarAccepted = true` ❌

**Résultat : Aucun email n'est envoyé, même si la transaction était créée !**

#### 🤔 Design intentionnel ?

Cette logique semble intentionnelle :
- Les dons < 6 € ne génèrent pas de reçu fiscal (seuil légal)
- Les soutiens avec calendrier ne sont pas fiscalement déductibles

**Mais :** Un email de confirmation (non fiscal) devrait quand même être envoyé pour rassurer le donateur.

---

## 🔧 RECOMMANDATIONS PRIORITAIRES

### 🚨 CRITIQUE : Correction du webhook

#### 1. Ajouter une gestion d'erreur complète

**Fichier:** `app/api/webhooks/stripe/route.ts:210-254`

```typescript
// Avant (code actuel)
const { data: tx } = await admin
  .from('support_transactions')
  .insert({...})
  .select('id, amount, supporter_name, supporter_email')
  .single()

// Après (code recommandé)
const { data: tx, error: insertError } = await admin
  .from('support_transactions')
  .insert({...})
  .select('id, amount, supporter_name, supporter_email')
  .single()

if (insertError) {
  log.error('❌ Échec insertion support_transactions (PI)', {
    payment_intent_id: paymentIntent.id,
    error: insertError.message,
    code: insertError.code,
    details: insertError.details,
    hint: insertError.hint,
    metadata: meta,
    amount,
    effectiveName,
    effectiveEmail
  })

  // IMPORTANT: Retourner 500 pour que Stripe retry
  return NextResponse.json(
    { error: 'Database insertion failed' },
    { status: 500 }
  )
}

log.info('✅ Transaction créée (PI)', {
  transaction_id: tx.id,
  payment_intent_id: paymentIntent.id,
  amount,
  supporter_name: effectiveName
})
```

#### 2. Ajouter un try/catch global

```typescript
try {
  // ... tout le code d'insertion et génération de reçu
} catch (err) {
  log.error('❌ Exception webhook payment_intent.succeeded', {
    payment_intent_id: paymentIntent.id,
    error: (err as Error).message,
    stack: (err as Error).stack
  })
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}
```

### 📧 IMPORTANT : Email de confirmation systématique

#### 3. Séparer email fiscal et email de confirmation

**Logique recommandée :**

```typescript
if (tx) {
  // 1. Email de confirmation (TOUJOURS envoyé)
  if (tx.supporter_email) {
    const confirmSubject = `Confirmation de votre don de ${amount.toFixed(2)}€`
    const confirmHtml = buildConfirmationHtml({
      supporterName: tx.supporter_name,
      amount: tx.amount,
      transactionType: calendarAccepted ? 'soutien' : 'fiscal'
    })

    await sendEmail({
      to: tx.supporter_email,
      subject: confirmSubject,
      html: confirmHtml
    })

    log.info('✅ Email de confirmation envoyé', {
      transaction_id: tx.id,
      email: tx.supporter_email
    })
  }

  // 2. Reçu fiscal (SEULEMENT si éligible)
  if (amount >= 6 && !calendarAccepted) {
    // ... code existant de génération de reçu fiscal
  }
}
```

#### 4. Créer un nouveau template d'email de confirmation

**Nouveau fichier:** `lib/email/confirmation-template.ts`

```typescript
export function buildConfirmationHtml(params: {
  supporterName?: string | null
  amount: number
  transactionType: 'fiscal' | 'soutien'
}) {
  const amountFmt = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(params.amount)

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">✅ Paiement confirmé !</h1>
      </div>

      <div style="background: white; padding: 40px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
          Bonjour <strong>${params.supporterName || 'Généreux donateur'}</strong>,
        </p>

        <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">
          Nous vous confirmons la réception de votre paiement de
          <strong style="color: #667eea; font-size: 20px;">${amountFmt}</strong>
          à l'Amicale des Sapeurs-Pompiers de Clermont-l'Hérault.
        </p>

        ${params.transactionType === 'soutien' ? `
        <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px; color: #1e40af;">
            🎁 <strong>Merci pour votre soutien !</strong>
          </p>
          <p style="margin: 10px 0 0 0; font-size: 14px; color: #1e40af;">
            Votre contribution nous aide à financer nos activités et équipements.
          </p>
        </div>
        ` : `
        <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; margin: 30px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px; color: #166534;">
            📄 <strong>Reçu fiscal en cours de génération</strong>
          </p>
          <p style="margin: 10px 0 0 0; font-size: 14px; color: #166534;">
            Vous recevrez votre reçu fiscal par email sous quelques minutes.
          </p>
        </div>
        `}

        <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 13px; margin: 0;">
            <strong>Amicale des Sapeurs-Pompiers de Clermont-l'Hérault</strong><br>
            Association loi 1901<br>
            Caserne des Sapeurs-Pompiers, 34800 Clermont-l'Hérault
          </p>
        </div>
      </div>
    </div>
  `
}
```

### 🔍 DIAGNOSTIC : Vérifier les logs existants

#### 5. Requête SQL pour diagnostiquer le problème

```sql
-- Vérifier si le webhook a bien été reçu
SELECT
  id,
  event_type,
  status,
  created_at,
  payload->'data'->'object'->>'id' as payment_intent_id,
  payload->'data'->'object'->'metadata'->>'tournee_id' as tournee_id,
  payload->'data'->'object'->'metadata'->>'user_id' as user_id
FROM webhook_logs
WHERE event_type = 'payment_intent.succeeded'
  AND payload->'data'->'object'->>'id' = 'pi_3SX1sB4Iwp2z3Wxn1WLeUmPj'
ORDER BY created_at DESC;

-- Vérifier si la transaction existe
SELECT *
FROM support_transactions
WHERE stripe_session_id = 'pi_3SX1sB4Iwp2z3Wxn1WLeUmPj';
```

#### 6. Vérifier les logs applicatifs

Chercher dans les logs Vercel/serveur :
- `[webhook/stripe]` - Logs du webhook handler
- Rechercher `pi_3SX1sB4Iwp2z3Wxn1WLeUmPj` pour voir toutes les traces

---

## 🎯 PLAN D'ACTION RECOMMANDÉ

### Phase 1 : Diagnostic (maintenant)

1. ✅ Vérifier si le webhook a été reçu (table `webhook_logs`)
2. ✅ Vérifier si la transaction existe (table `support_transactions`)
3. ✅ Vérifier les logs applicatifs pour trouver l'erreur exacte

### Phase 2 : Correction critique (1h)

1. 🔧 Ajouter gestion d'erreur complète dans le webhook
2. 🔧 Ajouter logging détaillé des insertions et erreurs
3. 🔧 Tester en staging avec un PaymentIntent de test

### Phase 3 : Amélioration emails (2h)

1. 📧 Créer template email de confirmation
2. 📧 Séparer logique confirmation vs reçu fiscal
3. 📧 Tester envoi d'emails pour tous les cas

### Phase 4 : Tests de régression (1h)

1. 🧪 Tester paiement QR avec calendrier remis
2. 🧪 Tester paiement QR sans calendrier (don fiscal)
3. 🧪 Vérifier que les 3 flux webhook ne créent pas de doublons
4. 🧪 Vérifier les toasts et notifications

---

## 📝 CHECKLIST DE VALIDATION

Après corrections, valider que :

- [ ] Le webhook log toutes les erreurs d'insertion
- [ ] La transaction est bien créée dans `support_transactions`
- [ ] Le toast de confirmation s'affiche dans le modal
- [ ] Un email de confirmation est envoyé (pour TOUS les montants)
- [ ] Un reçu fiscal est généré (SEULEMENT si ≥ 6€ ET don fiscal)
- [ ] Pas de doublons créés par les événements multiples
- [ ] Les logs sont suffisamment détaillés pour débugger

---

## 🔗 FICHIERS À MODIFIER

| Priorité | Fichier | Action |
|----------|---------|--------|
| 🚨 CRITIQUE | `app/api/webhooks/stripe/route.ts` | Ajouter gestion d'erreur + logging |
| 🚨 CRITIQUE | `app/api/webhooks/stripe/route.ts` | Ajouter email de confirmation systématique |
| 📧 IMPORTANT | `lib/email/confirmation-template.ts` | Créer template de confirmation |
| 🔍 DIAGNOSTIC | Scripts SQL de diagnostic | Identifier l'erreur exacte |

---

## 💬 NOTES TECHNIQUES SUPPLÉMENTAIRES

### Architecture du webhook

Le webhook Stripe est exposé à `/api/webhooks/stripe` et vérifie la signature pour sécuriser les appels.

**Variables d'environnement requises :**
- `STRIPE_WEBHOOK_SECRET` - Secret webhook Stripe
- `SUPABASE_SERVICE_ROLE_KEY` - Clé admin Supabase (bypass RLS)
- `RESEND_API_KEY` - Clé API Resend pour emails

### Idempotence

Le système utilise `stripe_session_id` comme clé d'idempotence :
- Pour Checkout : stocke le `session.id`
- Pour PaymentIntent : stocke le `paymentIntent.id`
- Pour Charge : stocke le `charge.payment_intent` ou `charge.id`

Cette approche fonctionne mais rend le debugging difficile car le même champ stocke différents types d'IDs.

**Recommandation future :**
Ajouter des colonnes séparées :
- `stripe_checkout_session_id`
- `stripe_payment_intent_id`
- `stripe_charge_id`

### RLS et client admin

Le webhook utilise `createAdminClient()` qui utilise la `SUPABASE_SERVICE_ROLE_KEY`. Ce client **bypass automatiquement** toutes les RLS policies.

Les policies RLS sur `support_transactions` ne devraient donc **jamais** bloquer les insertions du webhook.

---

**Fin de l'audit - Prêt pour les corrections**
