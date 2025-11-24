# 🔧 Instructions pour appliquer la migration critique

**Date:** 2025-11-24
**Problème résolu:** `column "value" does not exist` lors des paiements QR

---

## 🚨 Problème identifié

Les paiements QR échouent à cause d'un **conflit de table** :

1. Migration `20251029120000_app_settings.sql` a créé `app_settings` avec :
   ```sql
   (id, calendar_price, min_retrocession, ...)
   ```

2. Migration `20251111_webhook_trigger_n8n_pdf.sql` essaie de créer `app_settings` avec :
   ```sql
   (key, value, updated_at)
   ```

3. Le `IF NOT EXISTS` empêche la 2ème migration de s'exécuter

4. Le trigger `trigger_n8n_pdf_generation()` essaie de lire `app_settings.value` → **ERREUR 42703**

---

## ✅ Solution appliquée

Migration `20251124_fix_n8n_webhook_settings.sql` qui :
- Crée une table séparée `n8n_settings` pour les webhooks N8N
- Met à jour `get_n8n_webhook_url()` pour utiliser `n8n_settings`
- Met à jour `set_n8n_webhook_url()` pour utiliser `n8n_settings`

---

## 📋 Comment appliquer la migration

### Option 1 : Via le Dashboard Supabase (Recommandé)

1. **Aller sur le Dashboard Supabase**
   - https://supabase.com/dashboard/project/YOUR_PROJECT_ID

2. **Ouvrir l'éditeur SQL**
   - Menu gauche → **SQL Editor**
   - Cliquer sur **New Query**

3. **Copier-coller le contenu de la migration**
   ```bash
   cat supabase/migrations/20251124_fix_n8n_webhook_settings.sql
   ```

4. **Exécuter la requête**
   - Cliquer sur **Run** ou `Ctrl+Enter`

5. **Vérifier le succès**
   - Vous devriez voir : "Success. No rows returned"

### Option 2 : Via Supabase CLI

```bash
# Assurez-vous d'être authentifié
npx supabase login

# Appliquer la migration
npx supabase db push --db-url $DATABASE_URL
```

### Option 3 : Via script SQL direct

Si vous avez accès direct à PostgreSQL :

```bash
psql $DATABASE_URL -f supabase/migrations/20251124_fix_n8n_webhook_settings.sql
```

---

## 🧪 Vérification post-migration

### 1. Vérifier que la table n8n_settings existe

Dans l'éditeur SQL Supabase :

```sql
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'n8n_settings'
ORDER BY ordinal_position;
```

**Résultat attendu :**
| table_name    | column_name | data_type                 |
|---------------|-------------|---------------------------|
| n8n_settings  | key         | text                      |
| n8n_settings  | value       | text                      |
| n8n_settings  | updated_at  | timestamp with time zone  |

### 2. Vérifier que les fonctions sont à jour

```sql
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_name IN ('get_n8n_webhook_url', 'set_n8n_webhook_url');
```

Les fonctions devraient référencer `n8n_settings` et non `app_settings`.

### 3. Tester un paiement QR

1. **Générer un QR code** avec montant 2€ et "Calendrier remis"
2. **Scanner et payer**
3. **Vérifier les logs** - Vous devriez voir :
   ```
   ✅ Transaction créée (PI) | { transaction_id: ..., amount: 2, ... }
   ✅ Email de confirmation envoyé (PI) | { transaction_id: ..., email: ... }
   ```

4. **Vérifier la base de données** :
   ```sql
   SELECT id, amount, supporter_name, supporter_email, created_at
   FROM support_transactions
   ORDER BY created_at DESC
   LIMIT 5;
   ```

5. **Vérifier l'email de confirmation** dans votre boîte mail

---

## 📊 Checklist de validation

Après avoir appliqué la migration :

- [ ] Table `n8n_settings` créée avec colonnes (key, value, updated_at)
- [ ] Fonction `get_n8n_webhook_url()` utilise `n8n_settings`
- [ ] Fonction `set_n8n_webhook_url()` utilise `n8n_settings`
- [ ] Test de paiement QR réussi (2€)
- [ ] Transaction enregistrée dans `support_transactions`
- [ ] Email de confirmation reçu
- [ ] Toast de confirmation affiché dans le modal
- [ ] Plus d'erreur "column value does not exist" dans les logs

---

## 🔍 Diagnostic en cas de problème

### Si la migration échoue

**Erreur : "table n8n_settings already exists"**
→ La table existe déjà, vous pouvez passer à l'étape de vérification

**Erreur : "permission denied"**
→ Assurez-vous d'être connecté avec un compte ayant les droits d'administration

### Si les paiements échouent encore

1. **Vérifier les logs du webhook Stripe :**
   ```
   Chercher "webhook/stripe" dans les logs Vercel
   ```

2. **Vérifier si le trigger s'exécute :**
   ```sql
   SELECT tgname, tgenabled
   FROM pg_trigger
   WHERE tgrelid = 'support_transactions'::regclass;
   ```

3. **Tester manuellement la fonction :**
   ```sql
   SELECT get_n8n_webhook_url();
   ```
   Devrait retourner `NULL` (pas encore configuré) sans erreur

---

## 🚀 Après la migration

Une fois la migration appliquée et validée :

1. **Faire un nouveau test de paiement QR** (2€ avec calendrier)
2. **Vérifier que tout fonctionne** :
   - ✅ Transaction enregistrée
   - ✅ Email de confirmation reçu
   - ✅ Toast affiché
   - ✅ Pas d'erreur dans les logs

3. **Déployer les changements de code** (déjà sur la branche)
4. **Surveiller les logs pendant 24h**

---

## 💡 Configuration optionnelle du webhook N8N

Si vous souhaitez activer la génération de PDF via N8N (optionnel) :

```sql
SELECT set_n8n_webhook_url('https://your-n8n-instance.com/webhook/receipt-pdf');
```

Sinon, le trigger détectera que l'URL n'est pas configurée et continuera normalement sans envoyer de webhook.

---

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifier les logs Vercel/Supabase
2. Exécuter les requêtes de diagnostic ci-dessus
3. Vérifier que la migration a bien été appliquée

---

**Prêt à appliquer la migration !** 🚀
