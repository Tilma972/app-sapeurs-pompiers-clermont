# 🐛 Guide de debugging du toast de paiement

**Problème :** Le modal se ferme après le paiement mais aucun toast ne s'affiche.

**Objectif :** Identifier pourquoi le toast ne s'affiche pas et corriger le problème.

---

## 🧪 Option 1 : Test avec INSERT manuel (Recommandé)

### Étape 1 : Préparer l'application

1. **Ouvrir l'application** sur la page "Ma tournée"
2. **Ouvrir la console du navigateur** (F12 ou Cmd+Option+I)
3. **Cliquer sur "💳 PAIEMENT CARTE"**
4. **Entrer un montant** (ex: 5€)
5. **Cliquer sur "Générer QR paiement"**
6. **⚠️ NE PAS fermer le modal** - le laisser ouvert

### Étape 2 : Noter les informations

Dans l'URL du QR code affiché, vous verrez quelque chose comme :
```
https://your-app.com/pay/pi_3SX9Aj4Iwp2z3Wxn1ROnXiAJ_secret_xxxxx
```

**Noter le PaymentIntent ID** : `pi_3SX9Aj4Iwp2z3Wxn1ROnXiAJ`

**Récupérer aussi :**
- Votre `user_id` (visible dans la console : `localStorage.getItem('supabase.auth.token')`)
- Votre `tournee_id` (dans l'URL de la page ou via l'inspecteur React)

### Étape 3 : Exécuter le test SQL

1. **Ouvrir Supabase Dashboard → SQL Editor**
2. **Copier le contenu de** `scripts/test_realtime_toast.sql`
3. **Remplacer les variables :**
   - `VOTRE_PI_ID` → Le PI ID noté à l'étape 2
   - `VOTRE_TOURNEE_ID` → Votre tournée active
   - `VOTRE_USER_ID` → Votre user ID
4. **Exécuter la requête**

### Étape 4 : Observer le résultat

**✅ Comportement attendu :**
- Un toast apparaît : "Paiement confirmé 5,00€ • Test Donateur"
- Le modal se ferme automatiquement
- Les KPI de la page se mettent à jour

**❌ Si rien ne se passe :**
→ Le Realtime ne fonctionne pas, passez à l'Option 2

---

## 🧪 Option 2 : Utiliser le modal de debug

### Étape 1 : Activer le modal debug

Dans `app/(pwa)/ma-tournee/page.tsx`, remplacer temporairement :

```typescript
// AVANT
import { PaymentCardModal } from '@/components/payment-card-modal'

// APRÈS
import { PaymentCardModalDebug as PaymentCardModal } from '@/components/payment-card-modal-debug'
```

### Étape 2 : Tester avec un vrai paiement

1. **Ouvrir la console du navigateur** (F12)
2. **Générer un QR code** (montant 3€)
3. **Scanner et payer** avec votre carte
4. **Observer les logs dans la console**

### Étape 3 : Analyser les logs

Vous devriez voir des logs comme :

```
🔑 PaymentIntent ID: pi_xxxxx
🎧 Starting Realtime listener for PI: pi_xxxxx
📡 Realtime subscription status: SUBSCRIBED
🔄 Starting polling for PI: pi_xxxxx
🔍 Polling check...
📊 Polling result: No transaction yet
🔍 Polling check...
📊 Polling result: No transaction yet
```

**Après le paiement, vous devriez voir :**

```
🔔 Realtime INSERT received: { new: { amount: 3, supporter_name: "Stève" } }
✅ Displaying toast: Paiement confirmé 3,00€ • Stève
🚪 Closing modal
```

**OU (si Realtime ne fonctionne pas) :**

```
🔍 Polling check...
📊 Polling result: Found transaction
✅ Transaction found via polling, displaying toast: Paiement confirmé 3,00€ • Stève
🚪 Closing modal
```

---

## 🔍 Diagnostic des problèmes

### Problème A : Le modal se ferme avant le paiement

**Symptômes dans les logs :**
```
🚪 Modal state changing: true → false
🛑 Cleaning up Realtime listener
🛑 Cleaning up polling
```

**Causes possibles :**
1. L'utilisateur ferme le modal manuellement
2. Le composant parent se refresh/remonte
3. Un clic à l'extérieur du modal

**Solution :**
- Garder le modal ouvert pendant le test
- Ajouter `onPointerDownOutside={(e) => e.preventDefault()}` au DialogContent

---

### Problème B : Realtime ne se connecte pas

**Symptômes dans les logs :**
```
📡 Realtime subscription status: CHANNEL_ERROR
```
ou pas de log `🔔 Realtime INSERT received`

**Causes possibles :**
1. Realtime pas activé sur la table
2. RLS bloque les événements
3. Channel mal configuré

**Vérifications SQL :**

```sql
-- Vérifier que Realtime est activé
SELECT * FROM pg_publication;

-- Vérifier que support_transactions est publié
SELECT * FROM pg_publication_tables
WHERE tablename = 'support_transactions';

-- Résultat attendu : une ligne avec pubname = 'supabase_realtime'
```

**Solution si non activé :**
```sql
-- Ajouter la table à la publication Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE support_transactions;
```

---

### Problème C : RLS bloque la lecture

**Symptômes dans les logs :**
```
🔍 Polling check...
❌ Polling error: { code: "42501", message: "permission denied" }
```

**Vérification SQL :**

```sql
-- Se connecter avec votre compte utilisateur et tester
SELECT id, amount, supporter_name
FROM support_transactions
WHERE stripe_session_id = 'pi_xxx'
LIMIT 1;

-- Si aucune ligne n'est retournée, RLS bloque
```

**Solution :**

Vérifier que la migration `20251124_fix_duplicates_and_realtime.sql` a bien été appliquée avec la policy :

```sql
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'support_transactions'
AND policyname = 'Allow realtime notifications for active payments';
```

---

### Problème D : Le toast s'affiche mais disparaît trop vite

**Symptômes :**
- Logs montrent `✅ Displaying toast`
- Mais vous ne voyez pas le toast visuellement

**Causes possibles :**
1. Toast s'affiche en dehors de la zone visible
2. Z-index trop faible (caché par d'autres éléments)
3. Durée trop courte

**Solution :**

Le modal debug augmente déjà la durée à 5 secondes :
```typescript
toast.success(message, { duration: 5000 })
```

Vérifier aussi le positionnement du Toaster dans le layout :

```typescript
// Dans app/layout.tsx ou layout principal
import { Toaster } from 'react-hot-toast'

<Toaster position="top-right" />
```

---

## 🎯 Checklist de validation

Après avoir corrigé le problème, valider que :

- [ ] Le modal reste ouvert pendant le paiement
- [ ] Les logs montrent `📡 Realtime subscription status: SUBSCRIBED`
- [ ] Après paiement, log `🔔 Realtime INSERT received` OU `📊 Polling result: Found transaction`
- [ ] Le toast s'affiche avec le bon message
- [ ] Le toast reste visible au moins 5 secondes
- [ ] Le modal se ferme automatiquement
- [ ] Les KPI se mettent à jour (peut nécessiter un refresh manuel pour l'instant)

---

## 🔧 Solutions courantes

### Solution 1 : Activer Realtime sur support_transactions

```sql
-- Dans Supabase SQL Editor
ALTER PUBLICATION supabase_realtime ADD TABLE support_transactions;
```

### Solution 2 : Empêcher la fermeture accidentelle du modal

Dans `payment-card-modal.tsx`, modifier le DialogContent :

```typescript
<DialogContent
  className="..."
  onPointerDownOutside={(e) => {
    // Empêcher la fermeture si un QR est généré
    if (checkoutUrl) {
      e.preventDefault()
    }
  }}
>
```

### Solution 3 : Augmenter la durée du toast

```typescript
toast.success(message, {
  duration: 10000, // 10 secondes
  position: 'top-center',
})
```

---

## 📊 Tableau de diagnostic rapide

| Symptôme | Cause probable | Solution |
|----------|----------------|----------|
| Modal se ferme immédiatement | Clic extérieur ou refresh | Bloquer onPointerDownOutside |
| Pas de log Realtime | Realtime non activé | ALTER PUBLICATION |
| Polling error | RLS bloque | Vérifier policies |
| Toast invisible | Z-index ou position | Vérifier Toaster config |
| Logs OK mais pas de toast | Toast déjà affiché et fermé | Augmenter duration |

---

## 🚀 Prochaines étapes

Une fois le toast fonctionnel :

1. **Refresh automatique des KPI** : Ajouter un listener Realtime sur la page "Ma tournée"
2. **Retirer les logs debug** : Revenir au composant original
3. **Tester en production** avec de vrais paiements

---

**Commencez par l'Option 1 (INSERT manuel) pour un diagnostic rapide !** 🎯
