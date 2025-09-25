# 🔧 Guide de dépannage - Système de profils

## ❌ Erreur : "Cannot coerce the result to a single JSON object"

### 🎯 **Problème identifié**
L'erreur `PGRST116` indique qu'aucun profil n'existe pour l'utilisateur connecté. Cela arrive quand :
- L'utilisateur s'est inscrit avant la création de la migration des profils
- Le trigger automatique n'a pas fonctionné
- Il y a eu un problème lors de la création du profil

### ✅ **Solutions appliquées**

#### 1. **Correction automatique dans le code**
- La fonction `getCurrentUserProfile()` crée maintenant automatiquement le profil s'il n'existe pas
- Gestion intelligente de l'erreur `PGRST116`
- Extraction du nom depuis les métadonnées ou l'email

#### 2. **Migration pour les utilisateurs existants**
Exécuter cette migration dans l'éditeur SQL de Supabase :
```sql
-- Fichier: supabase/migrations/002_create_missing_profiles.sql
-- Cette migration crée automatiquement des profils pour tous les utilisateurs existants
```

#### 3. **Script de vérification**
Utiliser le script `scripts/check-profiles.sql` pour diagnostiquer :
- Nombre d'utilisateurs vs profils
- Utilisateurs sans profil
- État des politiques RLS
- Fonctionnement des triggers

### 🚀 **Étapes de résolution**

#### **Étape 1 : Exécuter la migration des profils manquants**
1. Ouvrir l'éditeur SQL de Supabase
2. Copier-coller le contenu de `supabase/migrations/002_create_missing_profiles.sql`
3. Exécuter la requête

#### **Étape 2 : Vérifier avec le script de diagnostic**
1. Exécuter `scripts/check-profiles.sql`
2. Vérifier qu'il n'y a plus d'utilisateurs sans profil

#### **Étape 3 : Tester l'application**
1. Rafraîchir la page du dashboard
2. Le profil devrait maintenant s'afficher correctement
3. Tester la page `/dashboard/profil`

### 🔍 **Vérifications supplémentaires**

#### **Vérifier que la table profiles existe :**
```sql
SELECT * FROM public.profiles LIMIT 5;
```

#### **Vérifier les politiques RLS :**
```sql
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'profiles';
```

#### **Vérifier les triggers :**
```sql
SELECT trigger_name, action_statement FROM information_schema.triggers 
WHERE event_object_table = 'profiles';
```

### 🛠️ **Si le problème persiste**

#### **Solution manuelle :**
```sql
-- Créer manuellement un profil pour un utilisateur spécifique
INSERT INTO public.profiles (id, full_name, role)
VALUES (
    'USER_ID_ICI', 
    'Nom de l''utilisateur', 
    'membre'
);
```

#### **Vérifier les logs :**
- Ouvrir la console du navigateur
- Vérifier les messages de log
- Rechercher "Profil non trouvé, création automatique..."

### 📊 **État attendu après correction**

✅ **Dashboard affiche :**
- Nom complet de l'utilisateur
- Rôle (membre)
- Équipe (si renseignée)
- Badges de statut

✅ **Page profil accessible :**
- `/dashboard/profil` fonctionne
- Formulaire de modification opérationnel
- Mise à jour des informations possible

✅ **Base de données :**
- Tous les utilisateurs ont un profil
- Politiques RLS actives
- Triggers fonctionnels

### 🎯 **Prévention future**

Le système est maintenant robuste et :
- Crée automatiquement les profils manquants
- Gère les erreurs gracieusement
- Fournit des messages de log clairs
- Maintient la cohérence des données

