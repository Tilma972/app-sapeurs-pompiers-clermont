# 🚀 Guide de déploiement - Statistiques globales

## 🚨 **Erreur actuelle**

```
Erreur lors de la récupération des statistiques globales: {}
```

**Cause** : La fonction SQL `get_global_tournee_stats` n'existe pas encore dans la base de données Supabase.

## 🔧 **Solution : Appliquer la migration SQL**

### **Étape 1 : Vérifier la connexion Supabase**

1. **Ouvrir le dashboard Supabase** : https://supabase.com/dashboard
2. **Sélectionner votre projet** : `amicale-sp-prod`
3. **Aller dans l'onglet "SQL Editor"**

### **Étape 2 : Appliquer la migration**

1. **Créer une nouvelle requête** dans le SQL Editor
2. **Copier et coller** le contenu du fichier `supabase/migrations/008_create_global_tournee_stats_function.sql`
3. **Exécuter la requête** (bouton "Run")

### **Étape 3 : Vérifier la création**

Exécuter cette requête pour vérifier que la fonction a été créée :

```sql
-- Vérifier que la fonction existe
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'get_global_tournee_stats';
```

### **Étape 4 : Tester la fonction**

Exécuter cette requête pour tester la fonction :

```sql
-- Tester la fonction
SELECT * FROM get_global_tournee_stats();
```

## 📋 **Contenu de la migration à appliquer**

```sql
-- Migration pour créer la fonction get_global_tournee_stats
-- Cette fonction retourne les statistiques globales de toutes les tournées

-- Créer la fonction get_global_tournee_stats
CREATE OR REPLACE FUNCTION get_global_tournee_stats()
RETURNS TABLE (
    total_calendriers_distribues BIGINT,
    total_montant_collecte NUMERIC,
    total_tournees_actives BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(calendriers_distribues), 0) as total_calendriers_distribues,
        COALESCE(SUM(montant_collecte), 0) as total_montant_collecte,
        COUNT(CASE WHEN statut = 'active' THEN 1 END) as total_tournees_actives
    FROM public.tournees;
END;
$$;

-- Commentaire sur la fonction
COMMENT ON FUNCTION get_global_tournee_stats() IS 'Retourne les statistiques globales de toutes les tournées : total calendriers distribués, total montant collecté, et nombre de tournées actives';

-- Donner les permissions d'exécution à tous les utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION get_global_tournee_stats() TO authenticated;

-- Optionnel : Créer un index pour optimiser les requêtes sur le statut
CREATE INDEX IF NOT EXISTS idx_tournees_statut ON public.tournees(statut);

-- Optionnel : Créer un index pour optimiser les requêtes sur les colonnes agrégées
CREATE INDEX IF NOT EXISTS idx_tournees_calendriers_distribues ON public.tournees(calendriers_distribues) WHERE calendriers_distribues IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tournees_montant_collecte ON public.tournees(montant_collecte) WHERE montant_collecte IS NOT NULL;
```

## 🧪 **Tests de validation**

### **Test 1 : Vérifier la fonction**
```sql
-- Vérifier l'existence de la fonction
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'get_global_tournee_stats';
```

**Résultat attendu** : Une ligne avec `get_global_tournee_stats` et `FUNCTION`

### **Test 2 : Tester la fonction**
```sql
-- Tester la fonction avec des données
SELECT * FROM get_global_tournee_stats();
```

**Résultat attendu** : Une ligne avec 3 colonnes (totaux)

### **Test 3 : Vérifier les permissions**
```sql
-- Vérifier les permissions
SELECT routine_name, grantee, privilege_type
FROM information_schema.routine_privileges 
WHERE routine_name = 'get_global_tournee_stats';
```

**Résultat attendu** : Une ligne avec `authenticated` et `EXECUTE`

## 🔍 **Diagnostic des erreurs**

### **Erreur : "function get_global_tournee_stats() does not exist"**
- **Cause** : La migration n'a pas été appliquée
- **Solution** : Appliquer la migration SQL

### **Erreur : "permission denied for function get_global_tournee_stats"**
- **Cause** : Permissions manquantes
- **Solution** : Vérifier le GRANT EXECUTE

### **Erreur : "relation 'tournees' does not exist"**
- **Cause** : Table tournees n'existe pas
- **Solution** : Appliquer les migrations précédentes

### **Erreur : "column 'calendriers_distribues' does not exist"**
- **Cause** : Colonnes manquantes dans la table
- **Solution** : Vérifier la structure de la table tournees

## 📊 **Vérification de la structure de la table**

Si vous avez des erreurs de colonnes, vérifiez la structure de la table :

```sql
-- Vérifier la structure de la table tournees
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'tournees' 
AND table_schema = 'public'
ORDER BY ordinal_position;
```

**Colonnes attendues** :
- `calendriers_distribues` (integer)
- `montant_collecte` (numeric)
- `statut` (text)

## 🚀 **Déploiement avec Supabase CLI (optionnel)**

Si vous utilisez Supabase CLI :

```bash
# Appliquer toutes les migrations
supabase db push

# Ou appliquer une migration spécifique
supabase db push --include-all
```

## ✅ **Checklist de déploiement**

- [ ] ✅ Connexion au dashboard Supabase
- [ ] ✅ Migration SQL appliquée
- [ ] ✅ Fonction créée et testée
- [ ] ✅ Permissions accordées
- [ ] ✅ Index créés
- [ ] ✅ Tests de validation passés
- [ ] ✅ Application Next.js testée
- [ ] ✅ Statistiques affichées correctement

## 🎯 **Résultat attendu**

Après l'application de la migration :

1. **Fonction SQL** : `get_global_tournee_stats()` créée
2. **Permissions** : Utilisateurs authentifiés peuvent exécuter
3. **Application** : Dashboard affiche les statistiques réelles
4. **Performance** : Index optimisent les requêtes

## 🆘 **Support**

Si vous rencontrez des problèmes :

1. **Vérifiez les logs** : Console du navigateur et logs Supabase
2. **Testez la fonction** : Directement dans le SQL Editor
3. **Vérifiez les permissions** : RLS et GRANT
4. **Consultez la documentation** : Supabase Functions

## 📝 **Notes importantes**

- **Sauvegarde** : Toujours sauvegarder avant d'appliquer des migrations
- **Test** : Tester en environnement de développement d'abord
- **Permissions** : Vérifier que les utilisateurs ont les bonnes permissions
- **Performance** : Les index améliorent les performances des requêtes


