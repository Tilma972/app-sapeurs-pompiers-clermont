# 🧪 Guide d'utilisation - Données de test

## 📋 **Script SQL créé**

Le script `supabase/migrations/007_test_data_tournee_active.sql` a été créé pour générer des données de test réalistes.

## 🚀 **Instructions d'utilisation**

### **1. Préparation**

1. **Connectez-vous à votre dashboard Supabase**
2. **Allez dans Authentication > Users**
3. **Créez un utilisateur de test** (ou utilisez un existant)
4. **Copiez l'UUID de cet utilisateur**

### **2. Modification du script**

1. **Ouvrez le fichier** `supabase/migrations/007_test_data_tournee_active.sql`
2. **Trouvez cette ligne** :
   ```sql
   test_user_id UUID := '00000000-0000-0000-0000-000000000000'; -- REMPLACER PAR VOTRE UUID
   ```
3. **Remplacez** `00000000-0000-0000-0000-000000000000` par votre UUID utilisateur
4. **Exemple** :
   ```sql
   test_user_id UUID := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
   ```

### **3. Exécution du script**

1. **Allez dans l'éditeur SQL de Supabase**
2. **Copiez-collez le contenu du script modifié**
3. **Cliquez sur "Run"**

## 📊 **Données créées**

### **Profil utilisateur**
- **Nom** : Jean Dupont
- **Équipe** : Équipe Alpha
- **Rôle** : sapeur_pompier

### **Tournée active**
- **Zone** : Secteur Centre-Ville - Zone A
- **Calendriers alloués** : 50
- **Statut** : active
- **Date de début** : Maintenant

### **4 Transactions de test**

| # | Type | Montant | Mode paiement | Donateur | Email |
|---|------|---------|---------------|----------|-------|
| 1 | **Soutien** | 15€ | Espèces | Marie Martin | marie.martin@email.com |
| 2 | **Don fiscal** | 25€ | Chèque | Pierre Durand | pierre.durand@email.com |
| 3 | **Soutien** | 10€ | Carte | Sophie Leroy | sophie.leroy@email.com |
| 4 | **Don fiscal** | 20€ | Espèces | Michel Bernard | michel.bernard@email.com |

## 🧪 **Tests à effectuer**

### **1. Test de la page Dashboard**
- ✅ Vérifier que le profil "Jean Dupont" s'affiche
- ✅ Vérifier que l'équipe "Équipe Alpha" est visible
- ✅ Vérifier que le rôle "sapeur_pompier" est affiché

### **2. Test de la page Ma Tournée**
- ✅ Vérifier qu'une tournée active est détectée
- ✅ Vérifier que les 4 transactions s'affichent
- ✅ Vérifier les statistiques (calendriers distribués, montant collecté)

### **3. Test du DonationModal**
- ✅ Tester l'ajout d'une nouvelle transaction
- ✅ Tester la distinction fiscal/soutien
- ✅ Vérifier la validation des champs

### **4. Test du TourneeClotureModal**
- ✅ Vérifier le bilan structuré
- ✅ Vérifier les sections Dons Fiscaux et Soutiens
- ✅ Tester la clôture de tournée

## 🔍 **Vérifications dans Supabase**

### **Tables à vérifier**
```sql
-- Vérifier le profil
SELECT * FROM public.profiles WHERE full_name = 'Jean Dupont';

-- Vérifier la tournée
SELECT * FROM public.tournees WHERE zone = 'Secteur Centre-Ville - Zone A';

-- Vérifier les transactions
SELECT 
    st.*,
    CASE 
        WHEN st.calendar_accepted THEN 'Soutien'
        ELSE 'Don fiscal'
    END as type_transaction
FROM public.support_transactions st
JOIN public.tournees t ON st.tournee_id = t.id
WHERE t.zone = 'Secteur Centre-Ville - Zone A';

-- Vérifier la vue tournee_summary
SELECT * FROM public.tournee_summary 
WHERE tournee_id IN (
    SELECT id FROM public.tournees 
    WHERE zone = 'Secteur Centre-Ville - Zone A'
);
```

## 🚨 **Gestion des erreurs**

### **Erreur : "Veuillez remplacer test_user_id"**
- **Cause** : L'UUID n'a pas été modifié
- **Solution** : Remplacer `00000000-0000-0000-0000-000000000000` par votre UUID

### **Erreur : "L'utilisateur n'existe pas"**
- **Cause** : L'UUID ne correspond à aucun utilisateur
- **Solution** : Vérifier l'UUID dans Authentication > Users

### **Erreur : "Tournée active existe déjà"**
- **Cause** : Une tournée active existe déjà pour cet utilisateur
- **Solution** : Le script gère automatiquement cette situation

## 🔄 **Réinitialisation des données**

### **Supprimer les données de test**
```sql
-- Supprimer les transactions de test
DELETE FROM public.support_transactions 
WHERE tournee_id IN (
    SELECT id FROM public.tournees 
    WHERE zone = 'Secteur Centre-Ville - Zone A'
);

-- Supprimer la tournée de test
DELETE FROM public.tournees 
WHERE zone = 'Secteur Centre-Ville - Zone A';

-- Supprimer le profil de test (optionnel)
DELETE FROM public.profiles 
WHERE full_name = 'Jean Dupont';
```

## 📱 **Tests de l'application**

### **1. Connexion avec l'utilisateur de test**
- Utilisez l'email/mot de passe de l'utilisateur créé
- Vérifiez que le dashboard s'affiche correctement

### **2. Navigation vers Ma Tournée**
- Cliquez sur "Tournées & Calendriers"
- Vérifiez que la tournée active est détectée
- Vérifiez l'affichage des transactions

### **3. Test des fonctionnalités**
- Ajouter une nouvelle transaction
- Tester la distinction fiscal/soutien
- Clôturer la tournée
- Vérifier les statistiques

## ✅ **Validation finale**

### **Checklist de validation**
- [ ] ✅ Script exécuté sans erreur
- [ ] ✅ Profil utilisateur créé/mis à jour
- [ ] ✅ Tournée active créée
- [ ] ✅ 4 transactions de test créées
- [ ] ✅ Application Next.js connectée aux vraies données
- [ ] ✅ Toutes les fonctionnalités testées

## 🎯 **Résultat attendu**

Après exécution du script, vous devriez avoir :
- **1 profil utilisateur** avec des données réalistes
- **1 tournée active** prête pour les tests
- **4 transactions variées** (2 soutiens + 2 dons fiscaux)
- **Application Next.js** connectée à de vraies données Supabase

Votre application est maintenant prête pour des tests complets avec des données réelles ! 🚀

