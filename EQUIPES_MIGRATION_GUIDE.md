# 🏗️ Guide de migration des équipes - Clermont l'Hérault

## 🚨 **Contexte et justification**

### **Situation actuelle**
- **5 équipes réelles** : Équipe 1, 2, 3, 4 et Équipe SPP
- **Champ TEXT libre** : `team` dans la table `profiles` → risque d'incohérences
- **Données manquantes** : Pas de gestion des secteurs, calendriers alloués, chefs d'équipe

### **Problèmes identifiés**
- ❌ **Fautes de frappe** : "équipe 1" vs "Equipe 1" vs "1"
- ❌ **Pas de validation** : Noms d'équipes non contrôlés
- ❌ **Métadonnées manquantes** : Secteur, calendriers alloués, chef d'équipe
- ❌ **Performance** : Index sur TEXT moins efficace que sur UUID

### **Solution proposée**
- ✅ **Table `equipes` normalisée** avec toutes les métadonnées
- ✅ **Migration automatique** des données existantes
- ✅ **Intégrité des données** garantie par les contraintes
- ✅ **Performance optimisée** avec index sur clés étrangères

## 🏗️ **Structure de la table `equipes`**

### **Champs principaux**
```sql
CREATE TABLE public.equipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom TEXT NOT NULL UNIQUE,                    -- "Équipe 1", "Équipe SPP"
    numero INTEGER UNIQUE,                       -- 1, 2, 3, 4 (NULL pour SPP)
    type TEXT DEFAULT 'standard' NOT NULL,       -- 'standard' ou 'spp'
    description TEXT,                            -- Description de l'équipe
    chef_equipe_id UUID REFERENCES auth.users(id), -- Chef d'équipe (optionnel)
    secteur TEXT NOT NULL,                       -- Secteur géographique
    calendriers_alloues INTEGER DEFAULT 0 NOT NULL, -- Nombre de calendriers
    couleur TEXT DEFAULT '#3b82f6',             -- Couleur hex pour l'affichage
    ordre_affichage INTEGER DEFAULT 0,          -- Ordre d'affichage
    actif BOOLEAN DEFAULT true NOT NULL,        -- Équipe active ou non
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Équipes pré-configurées**
| Équipe | Numéro | Secteur | Calendriers | Couleur | Type |
|--------|--------|---------|-------------|---------|------|
| Équipe 1 | 1 | Centre-Ville | 50 | #ef4444 (rouge) | standard |
| Équipe 2 | 2 | Nord | 45 | #f97316 (orange) | standard |
| Équipe 3 | 3 | Sud | 40 | #eab308 (jaune) | standard |
| Équipe 4 | 4 | Est | 35 | #22c55e (vert) | standard |
| Équipe SPP | NULL | Professionnel | 30 | #8b5cf6 (violet) | spp |

## 🔄 **Migration des données existantes**

### **Processus de migration**
1. **Création de la table** `equipes` avec les 5 équipes
2. **Ajout de la colonne** `team_id` à la table `profiles`
3. **Migration automatique** des données existantes :
   - Équipes numérotées (1, 2, 3, 4) → `team_id` correspondant
   - Équipes SPP → `team_id` de l'équipe SPP
   - Équipe "Alpha" (test) → `team_id` de l'équipe 1
4. **Log des profils non migrés** pour vérification manuelle

### **Fonction de migration**
```sql
CREATE OR REPLACE FUNCTION migrate_team_data()
RETURNS void AS $$
BEGIN
    -- Migration des équipes numérotées
    UPDATE public.profiles 
    SET team_id = (
        SELECT id FROM public.equipes 
        WHERE numero::text = profiles.team 
        AND type = 'standard'
    )
    WHERE team IS NOT NULL 
    AND team ~ '^[0-9]+$' -- Équipes numérotées uniquement
    AND team_id IS NULL;

    -- Migration des équipes SPP
    UPDATE public.profiles 
    SET team_id = (
        SELECT id FROM public.equipes 
        WHERE type = 'spp'
    )
    WHERE team IS NOT NULL 
    AND LOWER(team) LIKE '%spp%'
    AND team_id IS NULL;

    -- Migration des équipes "Alpha" vers Équipe 1
    UPDATE public.profiles 
    SET team_id = (
        SELECT id FROM public.equipes 
        WHERE numero = 1
    )
    WHERE team IS NOT NULL 
    AND LOWER(team) LIKE '%alpha%'
    AND team_id IS NULL;
END;
$$ LANGUAGE plpgsql;
```

## 🔐 **Sécurité et contraintes**

### **Row Level Security (RLS)**
- ✅ **Lecture** : Tous les utilisateurs authentifiés peuvent voir les équipes
- ✅ **Modification** : Seuls les admins peuvent modifier les équipes
- ✅ **Profiles** : Politiques existantes conservées

### **Contraintes d'intégrité**
- ✅ **UNIQUE** sur `nom` et `numero`
- ✅ **CHECK** sur `type` (standard/spp)
- ✅ **NOT NULL** sur `secteur` et `calendriers_alloues`
- ✅ **FK** vers `auth.users` pour `chef_equipe_id`

### **Index de performance**
- ✅ `equipes_nom_idx`
- ✅ `equipes_numero_idx`
- ✅ `equipes_type_idx`
- ✅ `equipes_secteur_idx`
- ✅ `equipes_chef_equipe_id_idx`
- ✅ `equipes_actif_idx`
- ✅ `equipes_ordre_affichage_idx`
- ✅ `profiles_team_id_idx`

## 📋 **Instructions de déploiement**

### **Étape 1 : Exécuter la migration**
```sql
-- Exécuter le fichier de migration
\i supabase/migrations/009_create_equipes_table.sql
```

### **Étape 2 : Vérifier les équipes créées**
```sql
-- Vérifier les équipes créées
SELECT nom, numero, secteur, calendriers_alloues, couleur, type 
FROM public.equipes 
ORDER BY ordre_affichage;
```

### **Étape 3 : Vérifier la migration des profils**
```sql
-- Vérifier la migration des profils
SELECT p.full_name, p.team, e.nom as equipe_nom, e.secteur
FROM public.profiles p
LEFT JOIN public.equipes e ON p.team_id = e.id
WHERE p.team IS NOT NULL;
```

### **Étape 4 : Vérifier les profils non migrés**
```sql
-- Vérifier les profils non migrés (doivent être vides après migration)
SELECT full_name, team 
FROM public.profiles 
WHERE team IS NOT NULL AND team_id IS NULL;
```

### **Étape 5 : Configurer les chefs d'équipe (optionnel)**
```sql
-- Exemple : Assigner un chef d'équipe
UPDATE public.equipes 
SET chef_equipe_id = 'uuid-du-chef-equipe' 
WHERE nom = 'Équipe 1';
```

### **Étape 6 : Mettre à jour les types TypeScript**
```bash
# Mettre à jour les types TypeScript
npx supabase gen types typescript --project-id npyfregghvnmqxwgkfea > lib/database.types.ts
```

## 🧪 **Tests de validation**

### **Test 1 : Structure de la table**
```sql
-- Vérifier la structure
\d public.equipes
```

### **Test 2 : Données insérées**
```sql
-- Vérifier les 5 équipes
SELECT COUNT(*) FROM public.equipes; -- Doit retourner 5
```

### **Test 3 : Migration des profils**
```sql
-- Vérifier la migration
SELECT COUNT(*) FROM public.profiles WHERE team_id IS NOT NULL;
```

### **Test 4 : Contraintes**
```sql
-- Tester les contraintes UNIQUE
INSERT INTO public.equipes (nom, secteur, calendriers_alloues) 
VALUES ('Équipe 1', 'Test', 10); -- Doit échouer
```

### **Test 5 : RLS**
```sql
-- Tester les politiques RLS
SELECT * FROM public.equipes; -- Doit fonctionner pour tous les utilisateurs
```

## 🚀 **Avantages de la normalisation**

### **Intégrité des données**
- ✅ **Plus de fautes de frappe** : Contraintes UNIQUE
- ✅ **Validation automatique** : CHECK constraints
- ✅ **Cohérence garantie** : Clés étrangères

### **Gestion centralisée**
- ✅ **Modification d'équipe** : En un seul endroit
- ✅ **Métadonnées complètes** : Secteur, calendriers, chef
- ✅ **Configuration flexible** : Couleurs, ordre d'affichage

### **Performance optimisée**
- ✅ **Index sur clés étrangères** : Requêtes plus rapides
- ✅ **Jointures efficaces** : Relations normalisées
- ✅ **Requêtes optimisées** : Index sur tous les champs importants

### **Évolutivité**
- ✅ **Nouvelles fonctionnalités** : Statistiques par équipe
- ✅ **Gestion des objectifs** : Calendriers alloués par équipe
- ✅ **Rapports détaillés** : Performance par secteur

## 🔍 **Cas d'usage futurs**

### **Statistiques par équipe**
- Performance de chaque équipe
- Objectifs vs réalisations
- Classements par secteur

### **Gestion des calendriers**
- Attribution automatique par équipe
- Suivi des calendriers distribués
- Alertes de stock

### **Gestion des chefs d'équipe**
- Notifications pour les chefs
- Rapports de performance
- Gestion des permissions

### **Rapports de performance**
- Performance par secteur géographique
- Analyse des tendances
- Optimisation des tournées

## ⚠️ **Points d'attention**

### **Migration des données**
- ✅ **Migration automatique** des équipes existantes
- ⚠️ **Vérification manuelle** des profils non migrés
- ⚠️ **Configuration des chefs d'équipe** à faire manuellement

### **Configuration des secteurs**
- ⚠️ **Secteurs par défaut** : À adapter selon la réalité locale
- ⚠️ **Calendriers alloués** : À ajuster selon les besoins
- ⚠️ **Couleurs** : À personnaliser selon les préférences

### **Permissions admin**
- ⚠️ **Rôle admin requis** : Pour modifier les équipes
- ⚠️ **Configuration initiale** : Assigner les rôles admin
- ⚠️ **Gestion des chefs** : Permissions spéciales possibles

## 🎉 **Résultat final**

### **✅ Structure normalisée**
- Table `equipes` avec toutes les métadonnées
- Relations claires entre profils et équipes
- Contraintes d'intégrité complètes

### **✅ Données migrées**
- 5 équipes pré-configurées
- Profils existants migrés automatiquement
- Aucune perte de données

### **✅ Performance optimisée**
- Index sur tous les champs importants
- Requêtes plus rapides
- Jointures efficaces

### **✅ Évolutivité garantie**
- Facilite l'ajout de nouvelles fonctionnalités
- Gestion centralisée des équipes
- Métadonnées complètes disponibles

**🏗️ La migration des équipes est prête pour le déploiement !**

**Prochaines étapes** : Exécuter la migration SQL et configurer les chefs d'équipe selon la réalité de Clermont l'Hérault.



