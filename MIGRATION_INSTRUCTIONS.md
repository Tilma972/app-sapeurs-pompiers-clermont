# Instructions pour appliquer les migrations Supabase

## ⚠️ IMPORTANT : Vous devez appliquer ces migrations pour que le système de dépôt de fonds fonctionne

Les erreurs que vous rencontrez sont dues au fait que les migrations SQL n'ont pas encore été appliquées sur votre instance Supabase.

## Migrations à appliquer (dans l'ordre)

### 1. Migration principale : Système de dépôt de fonds

**Fichier :** `supabase/migrations/20251202_demandes_depot_fonds.sql`

**Ce que cette migration fait :**
- Crée la table `demandes_depot_fonds`
- Ajoute les politiques RLS de base
- Crée les fonctions SQL :
  - `get_montant_non_depose(user_id)` : calcule le montant non déposé d'un utilisateur
  - `valider_demande_depot(...)` : valide une demande de dépôt

### 2. Migration corrective : Foreign keys et RLS policies

**Fichier :** `supabase/migrations/20251205_fix_demandes_depot_fonds.sql`

**Ce que cette migration fait :**
- Ajoute les contraintes de foreign key explicites :
  - `demandes_depot_fonds.user_id → profiles.id`
  - `demandes_depot_fonds.valide_par → profiles.id`
- Ajoute la policy RLS permettant aux trésoriers de créer des dépôts directs
- Met à jour la policy UPDATE pour les trésoriers

### 3. Migration RLS comptes : Accès trésorier

**Fichier :** `supabase/migrations/20251205_add_treasurer_access_comptes_sp.sql`

**Ce que cette migration fait :**
- Permet aux trésoriers de voir tous les comptes SP (pour les KPI)

## Comment appliquer les migrations sur Supabase

### Option A : Via l'interface Supabase Dashboard

1. Connectez-vous à votre dashboard Supabase : https://app.supabase.com
2. Sélectionnez votre projet
3. Allez dans **SQL Editor** (icône de base de données dans le menu gauche)
4. Cliquez sur **New Query**
5. Copiez-collez le contenu de chaque fichier de migration dans l'ordre :
   - `20251202_demandes_depot_fonds.sql`
   - `20251205_fix_demandes_depot_fonds.sql`
   - `20251205_add_treasurer_access_comptes_sp.sql`
6. Cliquez sur **Run** pour chaque migration
7. Vérifiez qu'il n'y a pas d'erreurs

### Option B : Via la CLI Supabase (recommandé pour production)

```bash
# Assurez-vous d'avoir la CLI Supabase installée
# npm install -g supabase

# Lier votre projet local à votre projet Supabase
supabase link --project-ref YOUR_PROJECT_REF

# Appliquer toutes les migrations
supabase db push
```

## Vérification que les migrations ont été appliquées

Après avoir appliqué les migrations, vérifiez dans le SQL Editor :

```sql
-- Vérifier que la table existe
SELECT * FROM pg_tables WHERE tablename = 'demandes_depot_fonds';

-- Vérifier que les foreign keys existent
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'demandes_depot_fonds'
  AND tc.constraint_type = 'FOREIGN KEY';

-- Vérifier que les fonctions existent
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%depot%';
```

## Résultat attendu après les migrations

Une fois les migrations appliquées, vous devriez pouvoir :

1. ✅ Créer des demandes de dépôt en tant qu'utilisateur
2. ✅ Voir toutes les demandes en tant que trésorier
3. ✅ Enregistrer des dépôts directs en tant que trésorier
4. ✅ Voir les KPIs correctement dans le dashboard trésorerie
5. ✅ Calculer automatiquement les montants non déposés

## En cas d'erreur lors de l'application des migrations

Si vous obtenez une erreur indiquant qu'un objet existe déjà :

- C'est normal si vous avez déjà appliqué partiellement certaines migrations
- Les migrations utilisent `CREATE TABLE IF NOT EXISTS` et `DO $$ BEGIN ... END $$` pour être idempotentes
- Vous pouvez simplement ignorer ces avertissements et passer à la migration suivante

## Support

Si vous rencontrez des problèmes lors de l'application des migrations, partagez-moi :
1. Le message d'erreur complet
2. La migration qui pose problème
3. Le résultat des requêtes de vérification ci-dessus
