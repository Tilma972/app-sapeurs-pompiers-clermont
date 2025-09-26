# 🚀 Guide de test - Données réelles de tournées

## 📋 **Transformation effectuée**

La page `/dashboard/ma-tournee` a été transformée pour utiliser des **données réelles** de Supabase au lieu des données mockées.

### **Changements apportés** :

1. ✅ **Fonction serveur créée** : `getActiveTourneeWithTransactions()`
2. ✅ **Page transformée** : Utilise maintenant les vraies données
3. ✅ **Gestion des cas d'erreur** : Redirection si aucune tournée active
4. ✅ **Données dynamiques** : Statistiques, transactions, durée en temps réel

## 🧪 **Tests à effectuer**

### **1. Prérequis**

Avant de tester, assurez-vous d'avoir :
- ✅ Exécuté le script de données de test (`007_test_data_tournee_active.sql`)
- ✅ Un utilisateur de test avec une tournée active
- ✅ Des transactions de test dans la base de données

### **2. Test de la page Ma Tournée**

#### **Scénario 1 : Utilisateur avec tournée active**
1. **Connectez-vous** avec votre utilisateur de test
2. **Allez sur** `/dashboard/ma-tournee`
3. **Vérifiez** que la page s'affiche avec :
   - ✅ Zone de la tournée (ex: "Secteur Centre-Ville - Zone A")
   - ✅ Durée calculée en temps réel
   - ✅ Statistiques réelles (calendriers distribués, montant collecté)
   - ✅ Transactions réelles de la base de données
   - ✅ Boutons fonctionnels avec l'ID de tournée correct

#### **Scénario 2 : Utilisateur sans tournée active**
1. **Connectez-vous** avec un utilisateur sans tournée active
2. **Allez sur** `/dashboard/ma-tournee`
3. **Vérifiez** que vous êtes redirigé vers `/dashboard/calendriers`

### **3. Test des fonctionnalités**

#### **Test du DonationModal**
1. **Cliquez sur** "Enregistrer un don"
2. **Vérifiez** que le modal s'ouvre
3. **Vérifiez** que `tourneeId` est correctement passé
4. **Testez** l'ajout d'une transaction
5. **Vérifiez** que la page se met à jour après ajout

#### **Test du TourneeClotureModal**
1. **Cliquez sur** "Clôturer ma tournée"
2. **Vérifiez** que le modal s'ouvre avec les vraies données
3. **Vérifiez** que le résumé affiche les bonnes statistiques
4. **Testez** la clôture de tournée

## 🔍 **Vérifications dans Supabase**

### **Requêtes de vérification**

```sql
-- Vérifier les tournées actives
SELECT 
    t.*,
    p.full_name,
    p.team
FROM public.tournees t
JOIN public.profiles p ON t.user_id = p.id
WHERE t.statut = 'active'
ORDER BY t.date_debut DESC;

-- Vérifier les transactions d'une tournée
SELECT 
    st.*,
    CASE 
        WHEN st.calendar_accepted THEN 'Soutien'
        ELSE 'Don fiscal'
    END as type_transaction
FROM public.support_transactions st
JOIN public.tournees t ON st.tournee_id = t.id
WHERE t.statut = 'active'
ORDER BY st.created_at DESC;

-- Vérifier le résumé d'une tournée
SELECT * FROM public.tournee_summary 
WHERE tournee_id IN (
    SELECT id FROM public.tournees WHERE statut = 'active'
);
```

## 🚨 **Gestion des erreurs**

### **Erreur : "Cannot find module"**
- **Cause** : Cache TypeScript
- **Solution** : Redémarrez le serveur de développement

### **Erreur : Redirection vers calendriers**
- **Cause** : Aucune tournée active
- **Solution** : Créez une tournée active avec le script de test

### **Erreur : Données non affichées**
- **Cause** : Problème de RLS ou de permissions
- **Solution** : Vérifiez les politiques RLS dans Supabase

## 📊 **Données attendues**

### **Avec le script de test, vous devriez voir** :

#### **Header de la page** :
- **Zone** : "Secteur Centre-Ville - Zone A"
- **Durée** : Calculée depuis `date_debut`
- **Calendriers distribués** : Nombre réel de transactions
- **Montant collecté** : Somme réelle des transactions

#### **Transactions affichées** :
- **Marie Martin** - 15€ (Soutien)
- **Pierre Durand** - 25€ (Don fiscal)
- **Sophie Leroy** - 10€ (Soutien)
- **Michel Bernard** - 20€ (Don fiscal)

#### **Résumé** :
- **Total** : 4 calendriers • 70€ aujourd'hui

## 🔄 **Test de bout en bout**

### **Workflow complet** :
1. **Connexion** avec utilisateur de test
2. **Navigation** vers Ma Tournée
3. **Vérification** des données réelles
4. **Ajout** d'une nouvelle transaction
5. **Vérification** de la mise à jour
6. **Clôture** de la tournée
7. **Vérification** de la redirection

## ✅ **Checklist de validation**

- [ ] ✅ Page s'affiche sans erreur
- [ ] ✅ Données réelles affichées (zone, durée, statistiques)
- [ ] ✅ Transactions réelles listées
- [ ] ✅ Boutons fonctionnels avec bons IDs
- [ ] ✅ Modals s'ouvrent correctement
- [ ] ✅ Ajout de transaction fonctionne
- [ ] ✅ Clôture de tournée fonctionne
- [ ] ✅ Redirection si pas de tournée active

## 🎯 **Résultat attendu**

Après transformation, votre page `/dashboard/ma-tournee` devrait :
- **Afficher des données réelles** de Supabase
- **Se mettre à jour dynamiquement** lors des actions
- **Gérer les cas d'erreur** (pas de tournée active)
- **Fonctionner parfaitement** avec les vraies données

Votre application est maintenant connectée à la base de données réelle ! 🚀


