# 🚀 Guide : Migrations Supabase via CLI

## 📋 Problème identifié
Les migrations SQL manuelles ne génèrent pas les types TypeScript automatiquement.

## ✅ Solution : Utiliser Supabase CLI

### 1. Ajouter DATABASE_URL dans `.env.local`

Récupérez votre DATABASE_URL depuis Supabase Dashboard :
1. Allez sur https://supabase.com/dashboard/project/npyfregghvnmqxwgkfea
2. **Settings** > **Database**
3. Sous **Connection string** > **URI**, copiez l'URL
4. Format : `postgresql://postgres.[ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`

Ajoutez dans `.env.local` :
```bash
DATABASE_URL="postgresql://postgres.npyfregghvnmqxwgkfea:[YOUR_PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
```

⚠️ Remplacez `[YOUR_PASSWORD]` par votre mot de passe de base de données.

### 2. Scripts npm ajoutés

✅ **Déjà ajouté dans package.json** :
```json
"supabase": "npx supabase",
"db:push": "npx supabase db push --db-url $DATABASE_URL",
"db:types": "npx supabase gen types typescript --db-url $DATABASE_URL > lib/supabase/database.types.ts"
```

### 3. Appliquer les migrations

#### Option A : Push automatique (Recommandé)
```powershell
# Applique TOUTES les migrations du dossier supabase/migrations/
npm run db:push
```

Cela va :
- ✅ Détecter les nouvelles migrations
- ✅ Les appliquer dans l'ordre
- ✅ Créer une table d'historique `supabase_migrations.schema_migrations`

#### Option B : Push via URL directe
```powershell
npx supabase db push --db-url "postgresql://postgres.npyfregghvnmqxwgkfea:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
```

### 4. Générer les types TypeScript

Après chaque migration :
```powershell
npm run db:types
```

Cela va créer/mettre à jour `lib/supabase/database.types.ts` avec tous les types à jour.

### 5. Workflow complet

```powershell
# 1. Créer une migration (déjà fait ✅)
# supabase/migrations/20251106_xxx.sql

# 2. Appliquer la migration
npm run db:push

# 3. Générer les types
npm run db:types

# 4. Build & test
npm run build
npm run dev
```

## 📁 Migrations à appliquer

### Migration 1 : Ideas audio columns
**Fichier** : `20251106_add_audio_columns_to_ideas.sql`
- Ajoute `audio_duration` et `transcription`

### Migration 2 : Gallery likes system
**Fichier** : `20251106_gallery_likes_system.sql`
- Crée table `gallery_likes`
- Trigger pour `likes_count`
- RLS policies

## 🔧 Alternative : Via Supabase Dashboard (actuel)

Si vous préférez continuer manuellement :
1. **SQL Editor** dans Dashboard
2. Copier le SQL de la migration
3. Exécuter
4. **Puis manuellement** générer les types :
```powershell
npm run db:types
```

## 🎯 Avantages de la CLI

| Méthode | Dashboard Manuel | CLI (npx) |
|---------|------------------|-----------|
| Apply migration | ⚠️ Manuel | ✅ Auto |
| Historique | ❌ Non tracé | ✅ Table schema_migrations |
| Rollback | ❌ Impossible | ✅ Possible |
| Types TS | ❌ Manuel | ✅ Auto avec `db:types` |
| CI/CD | ❌ Non | ✅ Oui |

## 📊 Vérifier les migrations appliquées

```sql
-- Via SQL Editor
SELECT * FROM supabase_migrations.schema_migrations 
ORDER BY version DESC;
```

Ou via CLI :
```powershell
npx supabase migration list --db-url $DATABASE_URL
```

## 🚨 Troubleshooting

### Erreur : "Cannot find DATABASE_URL"
→ Ajoutez DATABASE_URL dans `.env.local`

### Erreur : "Authentication failed"
→ Vérifiez le mot de passe dans DATABASE_URL

### Erreur : "Already applied"
→ Normal, la migration existe déjà (skip)

### Types non générés
```powershell
# Force regeneration
npm run db:types
```

## 🔄 Prochaine fois

Pour créer une nouvelle migration :
```powershell
# Créer le fichier
npx supabase migration new ma_nouvelle_feature

# Éditer le fichier SQL généré
# supabase/migrations/[timestamp]_ma_nouvelle_feature.sql

# Appliquer
npm run db:push

# Générer types
npm run db:types
```
