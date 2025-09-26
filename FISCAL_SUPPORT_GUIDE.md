# 🏆 Guide Test - Système Fiscal/Soutien

## 📋 **Vue d'ensemble**

Le système a été évolué pour distinguer juridiquement les **dons fiscaux** (sans contrepartie) des **soutiens** (avec calendrier offert), conformément à la législation française.

## 🔑 **Champ clé : `calendar_accepted`**

- **`true`** = Soutien avec calendrier (pas de déduction fiscale)
- **`false`** = Don fiscal sans contrepartie (déduction d'impôt 66%)

## 🗄️ **Base de données**

### **Tables créées :**
- `support_transactions` : Transactions avec logique fiscal/soutien
- `receipts` : Suivi des reçus fiscaux et de soutien
- Vue `tournee_summary` : Statistiques agrégées

### **Migration à appliquer :**
```sql
-- Dans l'éditeur SQL de Supabase
\i supabase/migrations/006_feature_fiscal_support.sql
```

## 🧪 **Tests à effectuer**

### **1. Test DonationModal**

#### **Scénario 1 : Soutien avec calendrier (par défaut)**
1. Ouvrir `/dashboard/ma-tournee`
2. Cliquer sur "Enregistrer un don"
3. **Vérifier** : Checkbox "Je souhaite recevoir le calendrier" cochée par défaut
4. Saisir montant : `15€`
5. **Vérifier** : Card bleue "🤝 Soutien de 15€ avec calendrier offert"
6. **Vérifier** : "Pas de déduction fiscale"
7. Email optionnel
8. Valider → **Vérifier** : Message "Soutien de 15€ avec calendrier offert - Enregistré avec succès !"

#### **Scénario 2 : Don fiscal sans contrepartie**
1. Ouvrir le modal de don
2. **Décocher** la checkbox "Je souhaite recevoir le calendrier"
3. **Vérifier** : Card verte "🏆 Don fiscal de 15€"
4. **Vérifier** : "Déduction d'impôt : 9,90€" (66% de 15€)
5. **Vérifier** : "Sans contrepartie - Email obligatoire pour le reçu fiscal"
6. **Vérifier** : Champ email devient obligatoire (rouge)
7. **Vérifier** : Message d'aide "Email obligatoire : Pour un don fiscal..."
8. Saisir email valide
9. Valider → **Vérifier** : Message "Don fiscal de 15€ - Déduction d'impôt : 9,90€ - Enregistré avec succès !"

#### **Scénario 3 : Validation email**
1. Don fiscal sans email → **Vérifier** : Erreur "Email obligatoire pour un don fiscal"
2. Email invalide → **Vérifier** : Erreur "Format email invalide"
3. Montant négatif → **Vérifier** : Erreur "Le montant doit être positif"

### **2. Test TourneeClotureModal**

#### **Scénario 1 : Bilan structuré**
1. Créer plusieurs transactions (mélange dons fiscaux et soutiens)
2. Cliquer sur "Clôturer ma tournée"
3. **Vérifier** : Section "Dons Fiscaux" (verte) avec :
   - Nombre de dons
   - Montant total
   - Déductions générées
4. **Vérifier** : Section "Soutiens" (bleue) avec :
   - Nombre de soutiens
   - Montant total
   - Calendriers distribués
5. **Vérifier** : Section "Totaux Globaux" avec :
   - Total transactions
   - Montant total collecté
   - Répartition par mode de paiement

### **3. Test Base de données**

#### **Vérifier les colonnes calculées :**
```sql
-- Vérifier qu'une transaction soutien a les bons champs calculés
SELECT 
  amount,
  calendar_accepted,
  transaction_type,
  tax_deductible,
  tax_reduction,
  receipt_type
FROM support_transactions 
WHERE calendar_accepted = true;

-- Vérifier qu'une transaction don fiscal a les bons champs calculés
SELECT 
  amount,
  calendar_accepted,
  transaction_type,
  tax_deductible,
  tax_reduction,
  receipt_type
FROM support_transactions 
WHERE calendar_accepted = false;
```

#### **Vérifier la vue tournee_summary :**
```sql
SELECT * FROM tournee_summary WHERE tournee_id = 'votre-tournee-id';
```

### **4. Test Server Actions**

#### **Vérifier la persistance :**
1. Créer une transaction via l'interface
2. **Vérifier** en BDD que les champs calculés sont corrects
3. **Vérifier** que le reçu est généré si email fourni

#### **Vérifier la clôture :**
1. Clôturer une tournée
2. **Vérifier** que le statut passe à 'completed'
3. **Vérifier** que date_fin est renseignée

## ✅ **Validation finale**

### **Logique métier :**
- [ ] Calendrier refusé → don_fiscal → email obligatoire → déduction 66%
- [ ] Calendrier accepté → soutien → email optionnel → pas déduction
- [ ] Calculs automatiques cohérents (tax_reduction, transaction_type)
- [ ] Contraintes BDD respectées

### **UX/UI :**
- [ ] Interface mobile-first préservée
- [ ] Composants shadcn/ui utilisés correctement
- [ ] Animations et transitions maintenues
- [ ] Feedback visuel clair sur les types de transaction
- [ ] Validation en temps réel

### **Technique :**
- [ ] Types TypeScript cohérents end-to-end
- [ ] Pas d'erreurs console
- [ ] RLS policies fonctionnelles
- [ ] Migration BDD sans erreur
- [ ] Performance maintenue

## 🚨 **Edge Cases à tester**

- [ ] Montants négatifs/zéro bloqués
- [ ] Emails invalides rejetés
- [ ] Paiements Stripe échoués gérés
- [ ] Mode offline robuste
- [ ] Génération reçus échouée n'empêche pas la transaction

## 📱 **Usage terrain**

Le système est optimisé pour l'usage mobile des sapeurs-pompiers :
- **Interface simple** : Un seul champ clé (checkbox calendrier)
- **Feedback immédiat** : Cards colorées selon le type
- **Validation claire** : Messages d'erreur explicites
- **Gros boutons** : Faciles à utiliser avec des gants

## 🎯 **Résultat attendu**

Un système qui respecte parfaitement la distinction juridique française entre dons fiscaux et soutiens, tout en conservant une UX fluide pour les sapeurs-pompiers sur le terrain.

Le champ `calendar_accepted` est la clé de voûte : tout le reste en découle automatiquement grâce aux colonnes calculées de la BDD ! 🚀


