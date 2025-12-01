# Prompt : Système de relance pour paiements échoués

**Version :** 2.0 (mis à jour avec règles métier correctes)
**Date :** 2025-11-30

---

## 📋 Contexte mis à jour

Application web pour les sapeurs-pompiers de Clermont avec système de dons/soutiens via Stripe.

**Nouvelles règles métier importantes :**
- Tous les dons >= 6€ ont droit au reçu fiscal, AVEC ou SANS calendrier
- Valeur du calendrier = 1,33€ (contrepartie légale)
- Les reçus fiscaux PDF sont générés par le trigger PostgreSQL → n8n → Gotenberg
- Les emails de confirmation sont envoyés via Resend (webhook Stripe)

**Problème :** De nombreux paiements Stripe échouent car les donateurs ne valident pas la transaction auprès de leur banque (3D Secure, SMS, etc.).

---

## 🎯 Objectif

Créer un système d'emails de relance pour les paiements échoués, avec :
- Un message bienveillant expliquant que le paiement n'a pas abouti
- Les raisons possibles (validation bancaire manquante, carte refusée, etc.)
- Un lien pour réessayer le paiement
- Mention que s'il s'agit d'un don >= 6€, un reçu fiscal PDF sera envoyé

---

## 🔍 Critères techniques

### Cibler les payment intents qui :
- Ont un email fourni (`customer_details.email` ou `metadata.donor_email`)
- Ont un statut échec :
  - `payment_intent.payment_failed` (carte refusée, fonds insuffisants)
  - `requires_action` puis timeout (3D Secure non validé)
  - `requires_payment_method` (méthode de paiement invalide)
  - `canceled` (annulé par le donateur ou timeout)
- N'ont PAS abouti à une transaction complétée dans `support_transactions`

---

## 💻 Stack technique existant

### Paiement
- **Stripe** : Payment Intents, Checkout Sessions
- **Webhook actuel** : `app/api/webhooks/stripe/route.ts`
  - Événements gérés : `checkout.session.completed`, `payment_intent.succeeded`, `charge.succeeded`

### Emails
- **Resend** : `lib/email/resend-client.ts`
- **Templates existants** : `lib/email/receipt-templates.ts`
  - `buildSubject()`, `buildHtml()`, `buildText()`

### Base de données
- **Supabase** (PostgreSQL)
- **Tables principales** :
  - `support_transactions` : Transactions complétées
  - `webhook_logs` : Logs de tous les webhooks (Stripe, n8n)
  - `n8n_settings` : Configuration n8n

### Trigger n8n (nouveau système)
- Trigger PostgreSQL détecte `INSERT` dans `support_transactions`
- Envoie webhook à n8n via `pg_net`
- n8n génère PDF via Gotenberg
- n8n envoie email avec PDF (tous les dons >= 6€)

---

## 📐 Règles métier à respecter

### Reçus fiscaux
1. **Tous les dons >= 6€ avec email** reçoivent un reçu fiscal PDF
2. **AVEC ou SANS calendrier** (le calendrier est une contrepartie légale de 1,33€)
3. Calcul du montant déductible :
   - `calendar_accepted = false` → déduction 100% (ex: 10€ × 66% = 6,60€)
   - `calendar_accepted = true` → déduction (montant - 1,33€) (ex: (10€ - 1,33€) × 66% = 5,72€)

### Montants
- Don minimum : aucun (peut être 1€, 2€, etc.)
- Reçu fiscal : uniquement si >= 6€
- Calendrier : valeur fixe de 1,33€

### Flow email actuel (à ne pas casser)
1. **Email immédiat** (Resend, webhook Stripe) : "Merci pour votre don/soutien !"
2. **Email PDF** (n8n, 2-5 min après) : "Voici votre reçu fiscal PDF" (si >= 6€)

---

## 🎬 Étapes attendues

### 1. Analyse de l'existant
- Auditer le code du webhook Stripe (`app/api/webhooks/stripe/route.ts`)
- Identifier les événements Stripe liés aux échecs de paiement
- Vérifier si ces événements sont déjà loggés dans `webhook_logs`
- Comprendre le cycle de vie d'un payment intent Stripe

### 2. Déterminer l'approche technique

**Options possibles :**

**Option A : Écouter les événements d'échec dans le webhook (recommandé)**
- Ajouter un handler pour `payment_intent.payment_failed`
- Ajouter un handler pour `checkout.session.expired`
- Envoyer email de relance immédiatement
- ✅ Temps réel
- ❌ Nécessite que Stripe envoie ces événements

**Option B : Script de backfill quotidien**
- Créer un cron job qui interroge l'API Stripe
- Récupérer tous les payment intents échoués des dernières 24h
- Envoyer emails de relance groupés
- ✅ Contrôle total
- ❌ Pas temps réel (décalage jusqu'à 24h)

**Option C : Hybride (recommandé)**
- Webhook pour les échecs temps réel
- Script quotidien pour les cas manqués
- ✅ Meilleure couverture
- ✅ Résilient aux erreurs webhook

**Recommande la meilleure approche et justifie ton choix.**

### 3. Implémenter la solution

#### A. Template d'email de relance

Créer un template bienveillant et pédagogique :

```typescript
// lib/email/recovery-templates.ts

interface RecoveryEmailData {
  supporterName: string | null
  amount: number
  calendarAccepted: boolean
  failureReason?: string  // 'card_declined', '3d_secure_timeout', etc.
  retryUrl: string        // Nouveau lien Stripe pour réessayer
}

export function buildRecoverySubject(data: RecoveryEmailData): string {
  return `Votre paiement de ${data.amount.toFixed(2)}€ n'a pas abouti`
}

export function buildRecoveryHtml(data: RecoveryEmailData): string {
  // Template HTML avec :
  // - Message bienveillant
  // - Explication du problème (3D Secure, carte refusée, etc.)
  // - Bouton "Réessayer le paiement"
  // - Mention du reçu fiscal si >= 6€
  // - Support contact
}
```

**Exemple de message :**

> Bonjour Jean,
>
> Votre paiement de 10,00€ n'a pas pu être finalisé.
>
> **Raison possible :** Votre banque vous a envoyé un SMS de validation que vous n'avez pas confirmé.
>
> **Pas d'inquiétude !** Vous pouvez réessayer votre paiement en cliquant sur le bouton ci-dessous :
>
> [Réessayer mon paiement] ← Bouton
>
> **Votre soutien est important** : Si votre paiement aboutit, vous recevrez :
> - ✅ Un email de confirmation immédiat
> - ✅ Un reçu fiscal PDF (réduction d'impôt de 5,72€) dans quelques minutes
>
> Besoin d'aide ? Répondez à cet email.
>
> Merci pour votre générosité !
> Les Sapeurs-Pompiers de Clermont

#### B. Génération du lien de paiement

**Créer une nouvelle Checkout Session Stripe :**

```typescript
// lib/stripe/create-recovery-checkout.ts

export async function createRecoveryCheckout(params: {
  amount: number
  calendarAccepted: boolean
  customerEmail: string
  customerName?: string
  metadata: {
    original_payment_intent_id: string
    retry_attempt: number
  }
}): Promise<string> {
  const stripe = getStripe()

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'eur',
        product_data: {
          name: params.calendarAccepted
            ? `Soutien avec calendrier - ${params.amount}€`
            : `Don - ${params.amount}€`,
          description: params.calendarAccepted
            ? 'Soutien aux sapeurs-pompiers avec calendrier (contrepartie 1,33€)'
            : 'Don aux sapeurs-pompiers (reçu fiscal 66%)'
        },
        unit_amount: params.amount * 100
      },
      quantity: 1
    }],
    customer_email: params.customerEmail,
    metadata: {
      ...params.metadata,
      calendar_given: params.calendarAccepted.toString(),
      source: 'recovery_email'
    },
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/merci?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/`
  })

  return session.url!
}
```

#### C. Handler webhook pour paiements échoués

**Ajouter dans `app/api/webhooks/stripe/route.ts` :**

```typescript
// Nouvel événement à gérer
if (e.type === 'payment_intent.payment_failed') {
  const paymentIntent = e.data.object as {
    id: string
    amount: number
    last_payment_error?: {
      code?: string
      message?: string
    }
    metadata?: Record<string, string>
    customer_details?: { email?: string; name?: string }
  }

  // Vérifier qu'on n'a pas déjà envoyé l'email de relance
  const { data: alreadySent } = await admin
    .from('recovery_emails_sent')
    .select('id')
    .eq('payment_intent_id', paymentIntent.id)
    .maybeSingle()

  if (alreadySent) {
    log.info('Email de relance déjà envoyé', { payment_intent_id: paymentIntent.id })
    return NextResponse.json({ received: true })
  }

  // Générer nouveau lien de paiement
  const retryUrl = await createRecoveryCheckout({ ... })

  // Envoyer email de relance
  await sendRecoveryEmail({ ... })

  // Logger pour éviter les doublons
  await admin.from('recovery_emails_sent').insert({
    payment_intent_id: paymentIntent.id,
    email: customerEmail,
    retry_url: retryUrl,
    sent_at: new Date()
  })
}
```

#### D. Table de tracking (idempotence)

```sql
-- Nouvelle table pour éviter les doublons
CREATE TABLE IF NOT EXISTS recovery_emails_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_intent_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  retry_url TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  clicked BOOLEAN DEFAULT false,
  clicked_at TIMESTAMPTZ,
  retry_succeeded BOOLEAN DEFAULT false,
  retry_transaction_id UUID REFERENCES support_transactions(id)
);

CREATE INDEX idx_recovery_emails_payment_intent ON recovery_emails_sent(payment_intent_id);
CREATE INDEX idx_recovery_emails_sent_at ON recovery_emails_sent(sent_at DESC);
```

### 4. Dashboard de monitoring

```sql
-- Statistiques des paiements échoués
SELECT
  COUNT(*) as total_echecs,
  COUNT(*) FILTER (WHERE clicked = true) as clics,
  COUNT(*) FILTER (WHERE retry_succeeded = true) as conversions,
  ROUND(COUNT(*) FILTER (WHERE clicked = true) * 100.0 / COUNT(*), 2) as taux_clic,
  ROUND(COUNT(*) FILTER (WHERE retry_succeeded = true) * 100.0 / COUNT(*), 2) as taux_conversion
FROM recovery_emails_sent
WHERE sent_at >= NOW() - INTERVAL '30 days';

-- Derniers emails de relance envoyés
SELECT
  payment_intent_id,
  email,
  sent_at,
  clicked,
  retry_succeeded,
  retry_transaction_id
FROM recovery_emails_sent
ORDER BY sent_at DESC
LIMIT 20;

-- Identifier les raisons d'échec les plus fréquentes
SELECT
  payload->>'last_payment_error'->>'code' as error_code,
  COUNT(*) as count
FROM webhook_logs
WHERE source = 'stripe'
  AND event_type = 'payment_intent.payment_failed'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY error_code
ORDER BY count DESC;
```

---

## 🚫 Contraintes et bonnes pratiques

### Emails
- ✅ Maximum 1 email de relance par payment intent
- ✅ Ton bienveillant et pédagogique (pas de culpabilisation)
- ✅ Bouton d'action clair : "Réessayer mon paiement"
- ✅ Mentionner le reçu fiscal si montant >= 6€
- ✅ Fournir un contact support

### RGPD
- ✅ Permettre de ne plus recevoir d'emails (footer avec lien)
- ✅ Ne pas conserver les emails au-delà de 90 jours
- ✅ Logger les envois pour audit

### Technique
- ✅ Idempotence : utiliser la table `recovery_emails_sent`
- ✅ Gérer les webhook retries Stripe
- ✅ Timeout sur les appels API Stripe (5 secondes max)
- ✅ Logs complets dans `webhook_logs`

---

## 📦 Livrables attendus

1. **Analyse technique** (markdown) :
   - Événements Stripe disponibles pour détecter les échecs
   - Recommandation d'approche (webhook vs cron vs hybride)
   - Diagramme du flow complet

2. **Code d'implémentation** :
   - Template d'email de relance (`lib/email/recovery-templates.ts`)
   - Fonction de génération de lien Stripe (`lib/stripe/create-recovery-checkout.ts`)
   - Handler webhook (`app/api/webhooks/stripe/route.ts`)
   - Migration SQL (table `recovery_emails_sent`)

3. **Tests** :
   - Script de test manuel pour simuler un échec
   - Tests unitaires pour les templates
   - Tests d'intégration webhook

4. **Documentation** :
   - Guide d'utilisation pour l'équipe
   - Dashboard SQL de monitoring
   - Procédure de rollback si problème

---

## 🎭 Exemples de cas d'usage

### Cas 1 : 3D Secure non validé (le plus fréquent)

**Scénario :**
1. Marie veut donner 20€ sans calendrier
2. Arrive sur Stripe Checkout, remplit sa carte
3. Reçoit SMS de sa banque : "Validez votre paiement"
4. Ne voit pas le SMS / l'ignore / timeout
5. Payment intent passe en statut `requires_action` puis `canceled` après 1h

**Action système :**
1. Webhook Stripe envoie `payment_intent.payment_failed`
2. Notre système génère un nouveau lien Stripe
3. Email de relance envoyé : "Votre paiement n'a pas abouti (validation SMS manquante)"
4. Marie clique sur le bouton
5. Nouvelle session Stripe, cette fois elle valide le SMS
6. ✅ Paiement réussi → email de confirmation + reçu fiscal PDF (20€ × 66% = 13,20€)

### Cas 2 : Carte refusée (fonds insuffisants)

**Scénario :**
1. Jean veut donner 10€ avec calendrier
2. Sa carte est refusée (solde insuffisant)
3. Payment intent passe en statut `payment_failed`

**Action système :**
1. Webhook Stripe envoie `payment_intent.payment_failed`
2. Email de relance : "Votre carte a été refusée (fonds insuffisants ?)"
3. Jean clique, utilise une autre carte
4. ✅ Paiement réussi → reçu fiscal PDF ((10€ - 1,33€) × 66% = 5,72€)

### Cas 3 : Abandon du formulaire

**Scénario :**
1. Sophie arrive sur Stripe Checkout
2. Ferme la page sans remplir
3. Checkout session expire après 24h

**Action système :**
1. Webhook Stripe envoie `checkout.session.expired`
2. **Décision à prendre :** Envoyer email de relance ou non ?
   - 🤔 Argument POUR : Elle a montré de l'intérêt
   - 🤔 Argument CONTRE : Elle n'a même pas rempli le formulaire
   - **Recommandation :** NE PAS envoyer (trop intrusif)

### Cas 4 : Petit don (3€) échoué

**Scénario :**
1. Paiement de 3€ échoue
2. Email de relance envoyé
3. Paiement réussi

**Action système :**
- ✅ Email de confirmation envoyé
- ❌ **Pas de reçu fiscal** (montant < 6€)
- Message dans l'email de relance : "Merci pour votre soutien !" (sans mention de reçu fiscal)

---

## ❓ Questions à résoudre

### Questions stratégiques
1. Doit-on envoyer l'email immédiatement ou attendre X heures ?
2. Combien de tentatives max par payment intent ? (1 seule recommandé)
3. Doit-on relancer les checkout.session.expired (abandon formulaire) ?
4. Quel délai d'expiration pour le lien de retry ? (7 jours recommandé)

### Questions techniques
1. Stripe envoie-t-il vraiment `payment_intent.payment_failed` pour tous les échecs ?
2. Faut-il créer une table dédiée ou utiliser `webhook_logs` ?
3. Comment tracker les clics sur le lien de retry ?
4. Comment savoir si le retry a réussi ? (lier via metadata Stripe)

### Questions design email
1. Doit-on expliquer techniquement le problème (3D Secure, etc.) ou rester simple ?
2. Quelle formulation pour ne pas culpabiliser le donateur ?
3. Faut-il rappeler le montant de la réduction d'impôt ?
4. Inclure un numéro de téléphone support ?

---

## 🔗 Contexte technique supplémentaire

### Migrations déjà appliquées (à ne pas casser)
- `20251130_fix_n8n_trigger_use_pg_net.sql` : Trigger n8n pour PDF
- `20251130_fix_n8n_trigger_calendar_filter.sql` : Règles métier calendrier
- `BACKFILL_generate_missing_receipts.sql` : Script de rattrapage

### Code récemment modifié (à ne pas toucher)
- `app/api/webhooks/stripe/route.ts` (lignes 98-185, 362-424, 584-646)
  - Génération de reçu fiscal **désactivée** (commentée)
  - Email de confirmation conservé (Resend)
  - Logs pour tracer le trigger n8n

### Règles métier confirmées
- **calendar_accepted = false** → Don pur, déduction 100%
- **calendar_accepted = true** → Don avec calendrier, déduction (montant - 1,33€)
- **Tous les dons >= 6€** ont droit au reçu fiscal PDF (pas de filtre sur calendrier)

---

## 🎯 Ordre de travail recommandé

1. **Rechercher dans la doc Stripe** quels événements existent pour les échecs
2. **Analyser les logs existants** dans `webhook_logs` (y a-t-il déjà des `payment_failed` ?)
3. **Proposer une approche technique** (webhook vs cron vs hybride) avec justification
4. **Créer le template d'email** en markdown (pour validation avant code)
5. **Implémenter le handler webhook** avec logs détaillés
6. **Créer la table de tracking** (migration SQL)
7. **Tester manuellement** avec une vraie carte test Stripe
8. **Créer le dashboard de monitoring** SQL
9. **Documenter** la solution et le rollback

---

## 📖 Documentation à consulter

- [Stripe Webhooks Events](https://stripe.com/docs/api/events/types)
- [Stripe Payment Intents Lifecycle](https://stripe.com/docs/payments/payment-intents/lifecycle)
- [Stripe Error Codes](https://stripe.com/docs/error-codes)
- Code actuel : `app/api/webhooks/stripe/route.ts`
- Audit système : `AUDIT_FISCAL_RECEIPT_GENERATION.md`

---

**🚀 Commence par l'analyse des événements Stripe disponibles et propose une approche technique détaillée avant d'implémenter.**

**Documente ton raisonnement à chaque étape et pose des questions si tu as besoin de clarifications.**
