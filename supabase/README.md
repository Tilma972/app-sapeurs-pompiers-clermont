# Système de Profils Utilisateur - Amicale des Sapeurs-Pompiers

## 🚀 Migration SQL

### 1. Exécuter la migration
```sql
-- Exécuter le fichier de migration
\i supabase/migrations/001_create_profiles_table.sql
```

### 2. Vérifier la création de la table
```sql
-- Vérifier que la table a été créée
SELECT * FROM public.profiles LIMIT 5;

-- Vérifier les politiques RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';
```

## 📋 Structure de la table `profiles`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Clé primaire, référence `auth.users(id)` |
| `full_name` | TEXT | Nom complet de l'utilisateur |
| `team` | TEXT | Équipe/caserne (optionnel) |
| `role` | TEXT | Rôle dans l'amicale (défaut: 'membre') |
| `created_at` | TIMESTAMP | Date de création |
| `updated_at` | TIMESTAMP | Date de dernière modification |

## 🔐 Sécurité (RLS)

### Politiques Row Level Security :
- **Lecture** : Tous les utilisateurs peuvent voir tous les profils
- **Modification** : Les utilisateurs peuvent modifier uniquement leur propre profil
- **Insertion** : Les utilisateurs peuvent créer uniquement leur propre profil
- **Suppression** : Les utilisateurs peuvent supprimer uniquement leur propre profil

## ⚡ Fonctionnalités automatiques

### 1. Création automatique de profil
- Un profil est automatiquement créé lors de l'inscription d'un utilisateur
- Le nom est extrait des métadonnées ou de l'email
- Le rôle par défaut est 'membre'

### 2. Mise à jour automatique des timestamps
- `updated_at` est automatiquement mis à jour à chaque modification

## 🛠️ Utilisation dans l'application

### Récupérer le profil de l'utilisateur connecté
```typescript
import { getCurrentUserProfile } from "@/lib/supabase/profile";

const profile = await getCurrentUserProfile();
```

### Mettre à jour le profil
```typescript
import { updateUserProfile } from "@/lib/supabase/profile";

const updatedProfile = await updateUserProfile({
  full_name: "Nouveau nom",
  team: "Caserne de Paris 15e"
});
```

## 📱 Pages disponibles

- **Dashboard** : `/dashboard` - Affiche le nom de l'utilisateur et ses informations
- **Profil** : `/dashboard/profil` - Permet de modifier les informations personnelles

## 🔧 Rôles disponibles

- `membre` : Membre standard de l'amicale
- `admin` : Administrateur (à implémenter)
- `moderateur` : Modérateur (à implémenter)

## 📊 Statistiques du profil

Le dashboard affiche maintenant des données réelles :
- Nom complet de l'utilisateur
- Équipe/caserne (si renseignée)
- Rôle dans l'amicale
- Statut de complétion du profil

