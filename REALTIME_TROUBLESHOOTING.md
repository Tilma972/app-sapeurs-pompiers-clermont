# 🔍 Troubleshooting Realtime - Pourquoi le polling fonctionne mais pas Realtime ?

**Problème :** Realtime est activé et connecté (`SUBSCRIBED`) mais ne reçoit jamais les événements INSERT.

---

## 📊 État actuel

✅ **Ce qui fonctionne :**
- Realtime activé : table dans `supabase_realtime` publication
- Connexion établie : `SUBSCRIBED`
- Polling fonctionne : trouve la transaction après 2-4 secondes

❌ **Ce qui ne fonctionne pas :**
- Événement INSERT jamais reçu par Realtime
- Pas de log `🔔 Realtime INSERT received`
- Toujours le polling qui prend le relais

---

## 🎯 Hypothèse principale : RLS bloque les événements

**Supabase Realtime respecte les RLS policies !**

Quand le webhook insère une transaction :
1. ✅ Insertion réussit (service role bypass RLS)
2. ❓ Supabase vérifie si les clients connectés peuvent lire cette ligne
3. ❌ Si la policy RLS retourne FALSE → Événement NOT envoyé au client
4. ✅ Polling fonctionne car il interroge après coup avec SELECT (policy différente)

---

## 🧪 Plan de test

### Test 1 : Vérifier si vous pouvez lire la transaction

**Ouvrir la console du navigateur (F12) et exécuter :**

```javascript
// Importer Supabase client
const { createClient } = await import('./lib/supabase/client.js')
const supabase = createClient()

// Tester la lecture de la dernière transaction
const piId = 'pi_3SXNx64Iwp2z3Wxn1yOYSek0' // Remplacer par votre dernier PI

const { data, error } = await supabase
  .from('support_transactions')
  .select('id, amount, supporter_name, stripe_session_id, created_at')
  .eq('stripe_session_id', piId)
  .single()

console.log('✅ Data:', data)
console.log('❌ Error:', error)
```

**Résultats possibles :**

| Résultat | Signification | Action |
|----------|---------------|--------|
| `data` contient la transaction | RLS OK, problème ailleurs | Voir Test 2 |
| `error.code = '42501'` | RLS bloque | Appliquer migration simplifiée |
| `error` PGRST... | Policy trop restrictive | Appliquer migration simplifiée |

---

### Test 2 : Vérifier le timing du listener

**Problème possible :** Le listener s'abonne APRÈS que la transaction soit déjà insérée.

**Dans les logs, vérifier l'ordre :**

```
🎧 Starting Realtime listener      ← t = 0s
📡 SUBSCRIBED                      ← t = 0.2s
🔍 Polling check (no transaction)  ← t = 0s
🔍 Polling check (no transaction)  ← t = 2s
📊 Found transaction               ← t = 4s  ← Transaction insérée entre t=2s et t=4s
```

**Si la transaction est insérée APRÈS subscription :** Realtime devrait la capter.
**Si Realtime ne la capte pas :** C'est les RLS qui bloquent.

---

### Test 3 : Test manuel avec INSERT pendant que le modal est ouvert

**Étape 1 :** Ouvrir le modal debug et générer un QR
**Étape 2 :** Noter le PI ID dans les logs
**Étape 3 :** Ne PAS fermer le modal
**Étape 4 :** Aller dans Supabase SQL Editor

```sql
-- Insérer manuellement une transaction
INSERT INTO support_transactions (
  tournee_id,
  user_id,
  amount,
  calendar_accepted,
  payment_method,
  payment_status,
  stripe_session_id,
  supporter_name,
  supporter_email,
  notes
) VALUES (
  'VOTRE_TOURNEE_ID',        -- Remplacer
  'VOTRE_USER_ID',           -- Remplacer
  5.00,
  true,
  'carte',
  'completed',
  'VOTRE_PI_ID',             -- Remplacer par le PI du modal ouvert
  'Test Realtime',
  'test@example.com',
  'TEST MANUEL - Vérification Realtime'
);
```

**Résultat attendu :**
- Dans la console : `🔔 Realtime INSERT received`
- Toast apparaît
- Modal se ferme

**Si rien ne se passe :** RLS bloque les événements Realtime.

---

## 🔧 Solution : Simplifier temporairement la policy RLS

### Appliquer la migration de test

**Fichier :** `supabase/migrations/20251124_simplify_rls_for_realtime_test.sql`

**Cette migration :**
1. Retire la contrainte `t.statut = 'active'`
2. Augmente la fenêtre de 10 à 30 minutes
3. Simplifie la policy pour tester

**Dans Supabase SQL Editor :**

```sql
-- Version simplifiée de la policy pour test
DROP POLICY IF EXISTS "Allow realtime notifications for active payments" ON support_transactions;

CREATE POLICY "Allow realtime notifications for active payments"
ON support_transactions
FOR SELECT
USING (
  created_at > (NOW() - INTERVAL '30 minutes')
  AND EXISTS (
    SELECT 1 FROM tournees t
    WHERE t.id = support_transactions.tournee_id
    AND t.user_id = auth.uid()
    -- REMOVED: AND t.statut = 'active'
  )
);
```

**Puis retester un paiement et observer si Realtime capte l'événement.**

---

## 🔍 Diagnostic détaillé

### Vérifier l'état de la tournée

```sql
SELECT
  t.id,
  t.statut,
  t.user_id,
  t.date_debut,
  t.date_fin,
  (t.statut = 'active') as is_active,
  st.stripe_session_id,
  st.created_at as transaction_created
FROM tournees t
LEFT JOIN support_transactions st ON st.tournee_id = t.id
WHERE t.id = 'VOTRE_TOURNEE_ID'
ORDER BY st.created_at DESC
LIMIT 5;
```

**Vérifier que :**
- ✅ `statut = 'active'`
- ✅ `date_fin IS NULL`
- ✅ Transaction bien liée à cette tournée

### Vérifier REPLICA IDENTITY

```sql
SELECT
  schemaname,
  tablename,
  relreplident
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE tablename = 'support_transactions';
```

**Résultat attendu :** `relreplident = 'f'` (FULL)

---

## 📋 Checklist de validation

Après avoir appliqué la migration simplifiée, tester :

- [ ] Générer un QR code (modal ouvert)
- [ ] Scanner et payer (ou INSERT manuel)
- [ ] Observer les logs console
- [ ] Vérifier que `🔔 Realtime INSERT received` apparaît
- [ ] Toast s'affiche correctement
- [ ] Modal se ferme automatiquement

---

## 🎯 Solutions selon les résultats

### Si Realtime fonctionne après simplification de la policy

**Conclusion :** La contrainte `t.statut = 'active'` bloquait les événements.

**Solution définitive :**
- Garder la policy simplifiée (sans vérification du statut)
- OU vérifier côté client si la tournée est active

### Si Realtime ne fonctionne toujours pas

**Causes possibles :**
1. **Filter incorrect** : Vérifier que le `stripe_session_id` match exactement
2. **Timing** : Transaction insérée avant que le listener soit prêt
3. **Supabase config** : Vérifier les paramètres Realtime du projet

**Vérifications Supabase Dashboard :**
- Settings → API → Realtime → Ensure it's enabled
- Database → Replication → Verify publications

---

## 📊 Comparaison Polling vs Realtime

| Aspect | Polling (fonctionne) | Realtime (ne fonctionne pas) |
|--------|---------------------|------------------------------|
| Méthode | SELECT toutes les 2s | Écoute événements PostgreSQL |
| RLS | Vérifié à chaque SELECT | Vérifié au moment de l'INSERT |
| Timing | Peut trouver transaction déjà insérée | Doit être connecté AVANT insertion |
| Délai | 2-4 secondes | Instantané (si fonctionne) |

**Pourquoi Polling fonctionne :** Il interroge APRÈS que la transaction existe, avec la policy RLS du moment présent.

**Pourquoi Realtime échoue :** Il filtre les événements au moment de l'INSERT, avec la policy RLS évaluée à ce moment-là.

---

## 💡 Recommandation finale

Si la policy simplifiée fonctionne :
- **Court terme** : Garder la policy simplifiée sans `statut = 'active'`
- **Long terme** : Utiliser Realtime + polling comme fallback (configuration actuelle)
- **Sécurité** : La contrainte `user_id = auth.uid()` suffit à protéger les données

---

**Commencer par le Test 1 et me dire le résultat !** 🔍
