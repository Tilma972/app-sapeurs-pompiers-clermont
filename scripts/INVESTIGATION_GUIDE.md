# 📊 Guide d'Investigation du Compte Utilisateur

## 🎯 Objectif

Analyser les incohérences entre les montants affichés dans "Mon Compte" et les données réelles en base de données pour l'utilisateur **c7a9dc2a-ef93-4e9a-b594-de407daa30d8**.

## ⚠️ Problème Identifié

- **Montant affiché "Espèces à déposer"** : 125,50 €
- **Montant attendu** : 197,50 €
- **Écart** : 72,00 € manquants

---

## 🔍 Étapes d'Investigation

### Option 1 : Via l'Éditeur SQL Supabase (RECOMMANDÉ)

1. **Accédez à votre dashboard Supabase**
   - Connectez-vous à https://supabase.com
   - Sélectionnez votre projet

2. **Ouvrez l'éditeur SQL**
   - Cliquez sur "SQL Editor" dans la barre latérale
   - Créez une nouvelle requête

3. **Exécutez le script d'investigation**
   - Ouvrez le fichier `scripts/investigate_user_c7a9dc2a.sql`
   - Copiez tout le contenu
   - Collez-le dans l'éditeur SQL
   - Cliquez sur "Run"

4. **Analysez les résultats**
   - Le script produit 13 sections d'analyse
   - Regardez particulièrement :
     - Section 10 : CALCUL MANUEL SOLDE (écart entre calculé et stocké)
     - Section 11 : DÉTAIL FONDS COLLECTÉS
     - Section 13 : ANALYSE DÉTAILLÉE

---

### Option 2 : Via le Script Node.js (nécessite les credentials)

Si vous avez accès aux variables d'environnement de production :

```bash
# 1. Assurez-vous que les variables sont définies
export NEXT_PUBLIC_SUPABASE_URL="votre_url"
export SUPABASE_SERVICE_ROLE_KEY="votre_clé"

# 2. Exécutez le script
node scripts/analyze-user-compte.js c7a9dc2a-ef93-4e9a-b594-de407daa30d8
```

---

## 🧮 Points Clés à Vérifier

### 1. Transactions Support_Transactions

**Requête clé** :
```sql
SELECT
  COUNT(*) AS nb_transactions,
  SUM(amount) FILTER (WHERE payment_method = 'cash' AND payment_status = 'completed') AS total_cash,
  SUM(amount) FILTER (WHERE payment_method = 'cash' AND deposited_at IS NULL AND payment_status = 'completed') AS cash_non_depose
FROM support_transactions st
JOIN tournees t ON t.id = st.tournee_id
WHERE t.user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8';
```

**Ce qu'on recherche** :
- Total des espèces collectées
- Espèces déjà déposées (avec `deposited_at`)
- Espèces non déposées (sans `deposited_at`)

### 2. Mouvements de Rétribution

**Requête clé** :
```sql
SELECT
  SUM(montant_compte_perso) AS total_retributions
FROM mouvements_retribution
WHERE user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8';
```

**Ce qu'on recherche** :
- Le total des rétributions doit correspondre à ce qui a été calculé lors des clôtures
- Chaque clôture de tournée doit générer un mouvement de rétribution

### 3. Demandes de Versement

**Requête clé** :
```sql
SELECT
  SUM(montant_verse) AS total_verse
FROM demandes_versement
WHERE user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8'
  AND statut IN ('completed', 'validée');
```

**Ce qu'on recherche** :
- Total des versements effectués
- Le solde devrait être : `total_retributions - total_verse`

### 4. Comptes_SP (Table de Stockage)

**Requête clé** :
```sql
SELECT
  solde_disponible,
  total_retributions
FROM comptes_sp
WHERE user_id = 'c7a9dc2a-ef93-4e9a-b594-de407daa30d8';
```

**Ce qu'on recherche** :
- Le `solde_disponible` devrait correspondre au calcul manuel
- Le `total_retributions` devrait correspondre à la somme des mouvements

---

## 🔬 Hypothèses de Causes Possibles

### Hypothèse 1 : Transactions manquantes
- ❓ Des transactions ont été faites mais pas enregistrées dans `support_transactions`
- 🔍 Vérifier : Comparer le nombre de transactions avec les reçus émis
- 🔍 Vérifier : Logs Stripe/HelloAsso pour trouver des transactions non synchronisées

### Hypothèse 2 : Mouvement de rétribution manquant
- ❓ Une clôture de tournée n'a pas créé de mouvement de rétribution
- 🔍 Vérifier : Comparer le nombre de tournées `completed` avec le nombre de mouvements
- 🔍 Vérifier : Section 6 du script (STATS AGRÉGÉES PAR TOURNÉE)

### Hypothèse 3 : Erreur de calcul dans `deposited_at`
- ❓ Des espèces marquées comme déposées qui ne le sont pas (ou inversement)
- 🔍 Vérifier : Section 12 du script (ESPÈCES NON DÉPOSÉES)
- 🔍 Comparer avec les demandes de dépôt de fonds

### Hypothèse 4 : Erreur de calcul dans la fonction `getMontantNonDepose`
- ❓ La fonction qui calcule les espèces non déposées a un bug
- 🔍 Vérifier : Le code dans `lib/supabase/depot-fonds.ts`
- 🔍 Comparer avec le calcul SQL direct

---

## 📋 Checklist d'Investigation

- [ ] Exécuter le script SQL complet
- [ ] Vérifier le nombre total de tournées (section 3)
- [ ] Vérifier le nombre total de transactions (section 5)
- [ ] Comparer `montant_total_transactions` vs `montant_final` des tournées (section 6)
- [ ] Vérifier le total des mouvements de rétribution (section 7)
- [ ] Vérifier le total des versements (section 8)
- [ ] **CALCULER MANUELLEMENT** : total_retributions - total_versements
- [ ] Comparer avec `solde_disponible` dans `comptes_sp` (section 10)
- [ ] Identifier l'écart exact
- [ ] Vérifier les espèces non déposées (section 11 et 12)

---

## 📊 Résultats Attendus

Une fois l'investigation terminée, vous devriez avoir :

1. ✅ Le **montant exact** du solde calculé manuellement
2. ✅ L'**écart** entre le solde calculé et le solde stocké
3. ✅ Le **montant exact** des espèces non déposées
4. ✅ La **cause racine** de l'incohérence :
   - Transaction(s) manquante(s)
   - Mouvement(s) de rétribution manquant(s)
   - Erreur de marquage `deposited_at`
   - Bug dans une fonction de calcul

---

## 🛠️ Prochaines Étapes (après investigation)

1. **Si transactions manquantes** → Recréer les transactions manuellement
2. **Si mouvements manquants** → Relancer la fonction de clôture
3. **Si erreur de calcul** → Corriger la fonction et recalculer
4. **Si erreur de marquage** → Corriger les flags `deposited_at`

---

## 📝 Notes Importantes

- **NE PAS** modifier les données directement sans comprendre la cause
- **TOUJOURS** faire un backup avant toute modification
- **DOCUMENTER** chaque modification effectuée
- **TESTER** les corrections sur un compte de test d'abord si possible

---

## 🆘 Besoin d'Aide ?

Si vous êtes bloqué :
1. Partagez les résultats des sections 10, 11 et 13
2. Indiquez les montants exacts trouvés
3. Je pourrai alors proposer des corrections ciblées

---

**Créé le** : 2025-12-13
**Pour** : User c7a9dc2a-ef93-4e9a-b594-de407daa30d8
**Problème** : Écart de 72€ entre affiché (125.50€) et attendu (197.50€)
