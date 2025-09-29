# 🗄️ Guide Base de Données - Tournées & Transactions

## 📋 **Tables créées**

### **Table `tournees`**
```sql
- id (UUID, PK)
- user_id (UUID, FK vers auth.users)
- date_debut (TIMESTAMP)
- date_fin (TIMESTAMP, nullable)
- statut (TEXT: 'active', 'completed', 'cancelled')
- zone (TEXT)
- calendriers_alloues (INTEGER)
- calendriers_distribues (INTEGER)
- montant_collecte (DECIMAL)
- notes (TEXT, nullable)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### **Table `transactions`**
```sql
- id (UUID, PK)
- tournee_id (UUID, FK vers tournees)
- montant (DECIMAL)
- calendars_given (INTEGER)
- payment_method (TEXT: 'espèces', 'chèque', 'carte')
- donor_name (TEXT, nullable)
- donor_email (TEXT, nullable)
- donor_phone (TEXT, nullable)
- notes (TEXT, nullable)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## 🔐 **Sécurité (RLS)**

### **Politiques Row Level Security :**
- **Lecture** : Utilisateurs voient uniquement leurs propres tournées/transactions
- **Création** : Utilisateurs peuvent créer des tournées/transactions pour eux-mêmes
- **Modification** : Utilisateurs peuvent modifier leurs propres données
- **Suppression** : Utilisateurs peuvent supprimer leurs propres données

### **Contraintes de sécurité :**
- Les transactions ne peuvent être créées que pour des tournées appartenant à l'utilisateur
- Toutes les opérations vérifient l'appartenance via `user_id`
- Les montants doivent être positifs
- Les modes de paiement sont limités aux valeurs autorisées

## ⚡ **Fonctions automatiques**

### **1. Mise à jour automatique des statistiques**
- **Trigger** : `transactions_update_tournee_stats`
- **Déclencheur** : INSERT, UPDATE, DELETE sur `transactions`
- **Action** : Met à jour automatiquement `calendriers_distribues` et `montant_collecte` dans `tournees`

### **2. Gestion des timestamps**
- **Trigger** : `tournees_updated_at` et `transactions_updated_at`
- **Action** : Met à jour automatiquement `updated_at` à chaque modification

## 🛠️ **Fonctions SQL créées**

### **1. `get_tournee_stats(tournee_uuid)`**
```sql
-- Retourne les statistiques d'une tournée
SELECT * FROM get_tournee_stats('uuid-de-la-tournee');
```

### **2. `cloturer_tournee(tournee_uuid, calendriers_finaux, montant_final)`**
```sql
-- Clôture une tournée avec les valeurs finales
SELECT cloturer_tournee('uuid', 25, 250.50);
```

### **3. `get_tournee_detailed_stats(tournee_uuid)`**
```sql
-- Retourne les statistiques détaillées avec répartition par mode de paiement
SELECT * FROM get_tournee_detailed_stats('uuid-de-la-tournee');
```

### **4. `get_user_tournee_stats(user_uuid)`**
```sql
-- Retourne les statistiques globales d'un utilisateur
SELECT * FROM get_user_tournee_stats('uuid-de-l-utilisateur');
```

## 📱 **Utilisation dans l'application**

### **Créer une tournée :**
```typescript
import { createTournee } from "@/lib/supabase/tournee";

const tournee = await createTournee({
  zone: "Secteur 15e arrondissement",
  calendriers_alloues: 50,
  notes: "Tournée du matin"
});
```

### **Créer une transaction :**
```typescript
import { createTransaction } from "@/lib/supabase/transaction";

const transaction = await createTransaction({
  tournee_id: "uuid-de-la-tournee",
  montant: 15.50,
  calendars_given: 2,
  payment_method: "espèces",
  donor_name: "Mme Dupont",
  notes: "Très sympathique"
});
```

### **Récupérer la tournée active :**
```typescript
import { getActiveTournee } from "@/lib/supabase/tournee";

const tourneeActive = await getActiveTournee();
```

### **Clôturer une tournée :**
```typescript
import { cloturerTournee } from "@/lib/supabase/tournee";

const success = await cloturerTournee(
  "uuid-de-la-tournee",
  25, // calendriers distribués
  250.50 // montant collecté
);
```

## 🧪 **Tests à effectuer**

### **1. Exécuter les migrations :**
```sql
-- Dans l'éditeur SQL de Supabase
\i supabase/migrations/003_create_tournees_table.sql
\i supabase/migrations/004_create_transactions_table.sql
\i supabase/migrations/005_test_tables.sql
```

### **2. Vérifier les tables :**
```sql
-- Vérifier que les tables existent
SELECT * FROM public.tournees LIMIT 5;
SELECT * FROM public.transactions LIMIT 5;
```

### **3. Tester les politiques RLS :**
```sql
-- Vérifier les politiques
SELECT policyname, cmd, qual FROM pg_policies 
WHERE tablename IN ('tournees', 'transactions');
```

### **4. Tester les fonctions :**
```sql
-- Tester la création d'une tournée
INSERT INTO public.tournees (user_id, zone, calendriers_alloues) 
VALUES (auth.uid(), 'Test Zone', 10);

-- Tester la création d'une transaction
INSERT INTO public.transactions (tournee_id, montant, calendars_given, payment_method)
VALUES ('uuid-de-la-tournee', 10.00, 1, 'espèces');
```

## 📊 **Exemples de requêtes utiles**

### **Récupérer les tournées d'un utilisateur :**
```sql
SELECT * FROM public.tournees 
WHERE user_id = auth.uid() 
ORDER BY date_debut DESC;
```

### **Récupérer les transactions d'une tournée :**
```sql
SELECT t.*, tr.* 
FROM public.tournees t
JOIN public.transactions tr ON t.id = tr.tournee_id
WHERE t.id = 'uuid-de-la-tournee' 
AND t.user_id = auth.uid()
ORDER BY tr.created_at DESC;
```

### **Statistiques globales d'un utilisateur :**
```sql
SELECT 
  COUNT(*) as total_tournees,
  SUM(calendriers_distribues) as total_calendriers,
  SUM(montant_collecte) as total_montant
FROM public.tournees 
WHERE user_id = auth.uid() 
AND statut = 'completed';
```

## 🔧 **Résolution de problèmes**

### **Erreur de permissions :**
1. Vérifier que l'utilisateur est connecté
2. Vérifier que les politiques RLS sont actives
3. Vérifier que l'utilisateur a les bonnes permissions

### **Erreur de contrainte :**
1. Vérifier que les valeurs respectent les contraintes CHECK
2. Vérifier que les clés étrangères existent
3. Vérifier que les types de données sont corrects

### **Trigger ne fonctionne pas :**
1. Vérifier que les triggers sont créés
2. Vérifier que les fonctions existent
3. Vérifier les logs d'erreur

## ✅ **Validation finale**

Les tables sont maintenant prêtes pour :
- ✅ Gérer les tournées de collecte
- ✅ Enregistrer les transactions
- ✅ Calculer automatiquement les statistiques
- ✅ Sécuriser les données avec RLS
- ✅ Intégrer avec l'application Next.js

La base de données est maintenant complète et fonctionnelle ! 🚀



