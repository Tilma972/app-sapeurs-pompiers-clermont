# 🔧 Guide de correction - Colonnes générées

## 🚨 **Problème identifié**

**Erreur** : `Column "transaction_type" is a generated column. cannot insert a non-DEFAULT value into column "transaction_type"`

**Cause** : La Server Action tentait d'insérer des valeurs dans des colonnes générées automatiquement par la base de données PostgreSQL.

## 📋 **Colonnes générées identifiées**

Dans le schéma `support_transactions`, les colonnes suivantes sont générées automatiquement :

### **1. transaction_type**
```sql
transaction_type VARCHAR(30) GENERATED ALWAYS AS (
    CASE WHEN calendar_accepted = false THEN 'don_fiscal' ELSE 'soutien' END
) STORED
```

### **2. tax_deductible**
```sql
tax_deductible BOOLEAN GENERATED ALWAYS AS (calendar_accepted = false) STORED
```

### **3. tax_reduction**
```sql
tax_reduction DECIMAL(6, 2) GENERATED ALWAYS AS (
    CASE WHEN calendar_accepted = false THEN ROUND(amount * 0.66, 2) ELSE 0 END
) STORED
```

### **4. receipt_type**
```sql
receipt_type VARCHAR(20) GENERATED ALWAYS AS (
    CASE WHEN calendar_accepted = false THEN 'fiscal' ELSE 'soutien' END
) STORED
```

## ✅ **Correction apportée**

### **Avant (❌ Erreur)** :
```typescript
const transactionToInsert = {
  user_id: user.id,
  tournee_id: tournee_id,
  amount: amount,
  calendar_accepted: calendar_accepted,
  transaction_type: transaction_type,        // ❌ ERREUR : Colonne générée
  tax_deductible: tax_deductible,            // ❌ ERREUR : Colonne générée
  tax_reduction: tax_reduction,              // ❌ ERREUR : Colonne générée
  receipt_type: receipt_type,                // ❌ ERREUR : Colonne générée
  supporter_name: supporter_name || null,
  supporter_email: supporter_email || null,
  supporter_phone: supporter_phone || null,
  consent_email: consent_email,
  payment_method: payment_method,
  notes: notes || null,
  payment_status: 'completed',
  receipt_generated: false,
  receipt_sent: false,
  created_offline: false,
  created_at: new Date().toISOString(),      // ❌ ERREUR : Géré par BDD
  updated_at: new Date().toISOString()       // ❌ ERREUR : Géré par BDD
}
```

### **Après (✅ Correct)** :
```typescript
const transactionToInsert = {
  user_id: user.id,
  tournee_id: tournee_id,
  amount: amount,
  calendar_accepted: calendar_accepted,
  // Les colonnes suivantes sont générées automatiquement par la BDD :
  // - transaction_type (basé sur calendar_accepted)
  // - tax_deductible (basé sur calendar_accepted)
  // - tax_reduction (basé sur amount et calendar_accepted)
  // - receipt_type (basé sur calendar_accepted)
  supporter_name: supporter_name || null,
  supporter_email: supporter_email || null,
  supporter_phone: supporter_phone || null,
  consent_email: consent_email,
  payment_method: payment_method,
  notes: notes || null,
  payment_status: 'completed',
  receipt_generated: false,
  receipt_sent: false,
  created_offline: false
  // created_at et updated_at sont gérés automatiquement par la BDD
}
```

## 🔍 **Logique des colonnes générées**

### **transaction_type**
- **Si `calendar_accepted = false`** → `'don_fiscal'`
- **Si `calendar_accepted = true`** → `'soutien'`

### **tax_deductible**
- **Si `calendar_accepted = false`** → `true` (don fiscal = déductible)
- **Si `calendar_accepted = true`** → `false` (soutien = non déductible)

### **tax_reduction**
- **Si `calendar_accepted = false`** → `amount * 0.66` (66% de déduction)
- **Si `calendar_accepted = true`** → `0` (pas de déduction)

### **receipt_type**
- **Si `calendar_accepted = false`** → `'fiscal'` (reçu fiscal)
- **Si `calendar_accepted = true`** → `'soutien'` (reçu de soutien)

## 🧪 **Tests de validation**

### **Script de test créé** : `scripts/test-generated-columns-fix.js`

**Résultats** :
- ✅ **Structure d'insertion** : Colonnes générées supprimées
- ✅ **Réponse BDD** : Colonnes générées incluses dans la réponse
- ✅ **Calculs BDD** : Correspondance parfaite avec la logique
- ✅ **Message de succès** : Utilise les données BDD

### **Exemple de test** :
```javascript
// Don fiscal (calendar_accepted = false)
const transactionToInsert = {
  amount: 25.00,
  calendar_accepted: false,
  // ... autres champs
}

// Réponse BDD avec colonnes générées
const response = {
  amount: 25.00,
  calendar_accepted: false,
  transaction_type: 'don_fiscal',    // ✅ Généré automatiquement
  tax_deductible: true,              // ✅ Généré automatiquement
  tax_reduction: 16.50,              // ✅ Généré automatiquement
  receipt_type: 'fiscal'             // ✅ Généré automatiquement
}
```

## 🎯 **Avantages de la correction**

### **1. Cohérence garantie**
- Les calculs sont faits par la base de données
- Pas de risque d'incohérence entre le code et la BDD
- Logique métier centralisée dans le schéma

### **2. Performance**
- Calculs optimisés au niveau base de données
- Pas de calculs redondants côté application
- Insertion plus rapide

### **3. Maintenance**
- Logique métier dans le schéma SQL
- Modifications centralisées
- Pas de duplication de code

### **4. Sécurité**
- Impossible de contourner la logique métier
- Validation au niveau base de données
- Contraintes d'intégrité respectées

## 📊 **Flux de données corrigé**

### **1. Insertion**
```
Application → BDD (sans colonnes générées)
```

### **2. Calcul automatique**
```
BDD calcule : transaction_type, tax_deductible, tax_reduction, receipt_type
```

### **3. Réponse**
```
BDD → Application (avec colonnes générées)
```

### **4. Affichage**
```
Application utilise les données BDD pour l'affichage
```

## ✅ **Checklist de validation**

- [ ] ✅ Colonnes générées supprimées de l'insertion
- [ ] ✅ La BDD calcule automatiquement les champs dérivés
- [ ] ✅ Les données retournées incluent les colonnes générées
- [ ] ✅ Message de succès utilise les données BDD
- [ ] ✅ Cohérence garantie par la BDD
- [ ] ✅ Tests de validation passés
- [ ] ✅ Aucune erreur de linting
- [ ] ✅ Logique métier respectée

## 🚀 **Résultat**

La Server Action `submitSupportTransaction` fonctionne maintenant parfaitement avec les colonnes générées de PostgreSQL ! 🎉

## 📝 **Notes importantes**

- **PostgreSQL Generated Columns** : Fonctionnalité puissante pour la cohérence des données
- **Logique métier centralisée** : Dans le schéma plutôt que dans le code
- **Performance optimisée** : Calculs au niveau base de données
- **Maintenance simplifiée** : Une seule source de vérité pour la logique métier


