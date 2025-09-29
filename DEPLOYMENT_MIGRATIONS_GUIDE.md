# 🚀 Guide de déploiement des migrations

## 🚨 **Problème identifié**

L'erreur `Erreur lors de la récupération du résumé des équipes` est causée par le fait que les migrations SQL n'ont pas encore été appliquées dans la base de données Supabase.

## 📋 **Migrations à appliquer**

### **1. Migration 006 : Feature Fiscal Support**
**Fichier :** `supabase/migrations/006_feature_fiscal_support.sql`

Cette migration contient :
- ✅ Table `support_transactions` avec logique fiscale
- ✅ Table `receipts` pour les reçus
- ✅ **Vue `tournee_summary`** (nécessaire pour `getTeamsSummary`)
- ✅ Fonctions SQL et triggers
- ✅ RLS policies

### **2. Migration 008 : Global Stats Function**
**Fichier :** `supabase/migrations/008_create_global_tournee_stats_function.sql`

Cette migration contient :
- ✅ Fonction `get_global_tournee_stats()` (nécessaire pour `getGlobalStats`)
- ✅ Index de performance
- ✅ Permissions

## 🔧 **Solutions implémentées**

### **1. Gestion d'erreurs améliorée**
```typescript
console.error('Erreur lors de la récupération du résumé des équipes:', {
  message: error.message,
  details: error.details,
  hint: error.hint,
  code: error.code
});
```

### **2. Solution de fallback**
```typescript
try {
  // Essayer d'abord la vue tournee_summary
  const result = await supabase.from('tournee_summary').select(...);
} catch (viewError) {
  // Fallback : utiliser directement les tables tournees et profiles
  const result = await supabase.from('tournees').select(...);
}
```

### **3. Logique adaptative**
```typescript
// Gérer les deux cas : vue tournee_summary ou fallback direct
const calendars = stat.calendars_distributed || stat.calendriers_distribues || 0;
const amount = stat.montant_total || stat.montant_collecte || 0;
```

## 📊 **Instructions de déploiement**

### **Option 1 : Via l'interface Supabase (Recommandé)**

1. **Connectez-vous à Supabase Dashboard**
   - Allez sur [supabase.com](https://supabase.com)
   - Sélectionnez votre projet

2. **Accédez à l'éditeur SQL**
   - Cliquez sur "SQL Editor" dans le menu de gauche
   - Cliquez sur "New query"

3. **Appliquez la migration 006**
   - Copiez le contenu de `supabase/migrations/006_feature_fiscal_support.sql`
   - Collez-le dans l'éditeur SQL
   - Cliquez sur "Run" pour exécuter

4. **Appliquez la migration 008**
   - Copiez le contenu de `supabase/migrations/008_create_global_tournee_stats_function.sql`
   - Collez-le dans l'éditeur SQL
   - Cliquez sur "Run" pour exécuter

### **Option 2 : Via CLI Supabase**

```bash
# Installer Supabase CLI si pas déjà fait
npm install -g supabase

# Se connecter au projet
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Appliquer les migrations
supabase db push
```

### **Option 3 : Via l'interface de migration**

1. **Dans Supabase Dashboard**
   - Allez sur "Database" > "Migrations"
   - Cliquez sur "New migration"
   - Nommez-la "006_feature_fiscal_support"
   - Collez le contenu du fichier SQL
   - Cliquez sur "Apply"

2. **Répétez pour la migration 008**

## ✅ **Vérification du déploiement**

### **1. Vérifier la vue tournee_summary**
```sql
SELECT * FROM tournee_summary LIMIT 5;
```

### **2. Vérifier la fonction get_global_tournee_stats**
```sql
SELECT * FROM get_global_tournee_stats();
```

### **3. Vérifier les tables**
```sql
-- Vérifier la table support_transactions
SELECT COUNT(*) FROM support_transactions;

-- Vérifier la table receipts
SELECT COUNT(*) FROM receipts;

-- Vérifier la table tournees
SELECT COUNT(*) FROM tournees;
```

## 🧪 **Test de l'application**

### **1. Redémarrer le serveur**
```bash
npm run dev -- --turbo
```

### **2. Tester les pages**
- **Dashboard** : `/dashboard` (statistiques globales)
- **Calendriers** : `/dashboard/calendriers` (graphique des équipes)

### **3. Vérifier les logs**
- Ouvrir la console du navigateur
- Vérifier qu'aucune erreur n'apparaît
- Les données devraient s'afficher correctement

## 🔍 **Diagnostic des erreurs**

### **Si l'erreur persiste après déploiement :**

1. **Vérifier les permissions RLS**
```sql
-- Vérifier les politiques RLS
SELECT * FROM pg_policies WHERE tablename = 'tournee_summary';
```

2. **Vérifier les relations**
```sql
-- Vérifier les foreign keys
SELECT * FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' 
AND table_name IN ('support_transactions', 'receipts');
```

3. **Vérifier les données de test**
```sql
-- Vérifier s'il y a des données
SELECT COUNT(*) FROM tournees;
SELECT COUNT(*) FROM profiles;
SELECT COUNT(*) FROM support_transactions;
```

## 🚀 **Avantages de la solution de fallback**

### **1. Robustesse**
- ✅ **Fonctionne avec ou sans vue** : Fallback automatique
- ✅ **Gestion d'erreurs** : Messages détaillés pour debug
- ✅ **Compatibilité** : Support des deux structures de données

### **2. Performance**
- ✅ **Vue optimisée** : Utilise `tournee_summary` si disponible
- ✅ **Fallback direct** : Requête sur les tables de base si nécessaire
- ✅ **Cache** : Mise en cache automatique par Next.js

### **3. Maintenance**
- ✅ **Code adaptatif** : S'adapte à l'état de la base
- ✅ **Logging** : Messages informatifs pour le debug
- ✅ **Évolutif** : Facile à étendre

## 📋 **Checklist de déploiement**

- [ ] ✅ Migration 006 appliquée (feature_fiscal_support)
- [ ] ✅ Migration 008 appliquée (global_tournee_stats_function)
- [ ] ✅ Vue tournee_summary créée
- [ ] ✅ Fonction get_global_tournee_stats créée
- [ ] ✅ Tables support_transactions et receipts créées
- [ ] ✅ RLS policies configurées
- [ ] ✅ Permissions accordées
- [ ] ✅ Données de test insérées (optionnel)
- [ ] ✅ Application testée
- [ ] ✅ Aucune erreur dans les logs

## 🎉 **Résultat attendu**

Après le déploiement des migrations :

- **📊 Dashboard** : Statistiques globales affichées
- **📈 Graphique** : Classement des équipes fonctionnel
- **🔧 Fallback** : Solution robuste en cas de problème
- **⚡ Performance** : Données optimisées avec vues SQL

**Testez maintenant** : Appliquez les migrations et naviguez vers `/dashboard` et `/dashboard/calendriers` ! 🚀



