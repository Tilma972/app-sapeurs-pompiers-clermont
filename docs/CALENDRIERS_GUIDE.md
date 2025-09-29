# 🗓️ Guide du système "Tournées & Calendriers"

## 🎯 **Fonctionnalités implémentées**

### **1. Page principale des calendriers** (`/dashboard/calendriers`)
- **Statistiques globales** : Calendriers distribués, montant collecté, équipes actives
- **Progression des équipes** : Classement avec barres de progression colorées
- **Statut personnel** : Calendriers restants, montant collecté, position dans l'équipe
- **Actions rapides** : Démarrer une tournée, voir l'historique
- **Historique des tournées** : Dernières tournées avec détails

### **2. Page de tournée active** (`/dashboard/ma-tournee`)
- **Header avec durée** : Temps écoulé depuis le début de la tournée
- **Progression en temps réel** : Calendriers distribués/restants
- **Bouton principal** : "Enregistrer un don" (ouvre le modal)
- **Liste des transactions** : Historique de la tournée en cours
- **Actions de fin** : Terminer la tournée

### **3. Modal "Enregistrer un don"**
- **Montants rapides** : Boutons 5€, 10€, 15€, 20€
- **Saisie libre** : Montant personnalisé
- **Nombre de calendriers** : Sélection 1-5
- **Mode de paiement** : Espèces, chèque, carte avec icônes
- **Informations donateur** : Nom, email (optionnel)
- **Notes** : Commentaires libres
- **Résumé en temps réel** : Calcul automatique

## 🚀 **Comment tester**

### **Étape 1 : Accéder aux pages**
1. Se connecter à l'application
2. Aller sur `/dashboard/calendriers`
3. Cliquer sur "Démarrer une tournée" pour aller à `/dashboard/ma-tournee`

### **Étape 2 : Tester le modal de don**
1. Sur la page de tournée, cliquer sur "Enregistrer un don"
2. Tester les boutons de montants rapides
3. Saisir un montant personnalisé
4. Sélectionner le nombre de calendriers
5. Choisir un mode de paiement
6. Remplir les informations du donateur (optionnel)
7. Ajouter des notes (optionnel)
8. Vérifier le résumé
9. Cliquer sur "Enregistrer le don"

### **Étape 3 : Vérifier les données mock**
- **Statistiques globales** : 387/1000 calendriers, 3870€/5000€
- **Progression équipes** : 6 équipes avec pourcentages différents
- **Statut personnel** : 23/50 calendriers distribués, 230€ collectés
- **Transactions** : 4 transactions d'exemple dans la tournée

## 📊 **Données mock disponibles**

### **Statistiques globales**
- Total calendriers : 1000
- Distribués : 387 (38.7%)
- Montant collecté : 3870€ (77.4% de l'objectif 5000€)
- Équipes actives : 8
- Tournées actives : 12

### **Progression des équipes**
1. **Équipe Alpha** : 45/60 (75%) - 450€
2. **Équipe Bravo** : 38/50 (76%) - 380€
3. **Équipe Charlie** : 42/55 (76%) - 420€
4. **Équipe Delta** : 35/45 (78%) - 350€
5. **Équipe Echo** : 28/40 (70%) - 280€
6. **Équipe Foxtrot** : 31/50 (62%) - 310€

### **Statut personnel**
- Calendriers alloués : 50
- Distribués : 23
- Restants : 27
- Montant collecté : 230€
- Position dans l'équipe : #2 sur 6

### **Transactions d'exemple**
1. **Mme Dupont** : 10€, 1 calendrier, espèces
2. **M. Martin** : 20€, 2 calendriers, chèque
3. **Anonyme** : 15€, 1 calendrier, espèces
4. **Famille Bernard** : 35€, 4 calendriers, carte

## 🎨 **Design et UX**

### **Interface moderne**
- **Glassmorphism** : Effets de verre et transparence
- **Gradients** : Couleurs dégradées pour les accents
- **Animations** : Transitions fluides et effets hover
- **Responsive** : Adapté mobile, tablette et desktop

### **Couleurs par équipe**
- **Bleu** : Équipe Alpha
- **Vert** : Équipe Bravo  
- **Violet** : Équipe Charlie
- **Orange** : Équipe Delta
- **Rose** : Équipe Echo
- **Indigo** : Équipe Foxtrot

### **Icônes et badges**
- **Calendriers** : 📅 Calendar
- **Argent** : 💰 Euro
- **Équipes** : 👥 Users
- **Progression** : 📈 TrendingUp
- **Tournée** : 🗺️ MapPin
- **Don** : ➕ Plus

## 🔧 **Prochaines étapes**

### **Base de données**
- Créer les tables : `tournees`, `transactions`, `equipes`
- Ajouter les relations et contraintes
- Implémenter les API endpoints

### **Fonctionnalités avancées**
- Géolocalisation des tournées
- Photos des calendriers distribués
- Rapports PDF
- Notifications push
- Mode hors-ligne

### **Administration**
- Gestion des équipes
- Attribution des calendriers
- Suivi en temps réel
- Statistiques avancées

## 🐛 **Résolution de problèmes**

### **Erreur de module Progress**
Si vous voyez une erreur sur le composant Progress :
1. Redémarrer le serveur de développement
2. Vérifier que `components/ui/progress.tsx` existe
3. Nettoyer le cache : `rm -rf .next`

### **Modal ne s'ouvre pas**
1. Vérifier que le composant Dialog est correctement importé
2. S'assurer que le trigger est bien un bouton cliquable
3. Vérifier la console pour les erreurs JavaScript

### **Données ne s'affichent pas**
1. Vérifier que les données mock sont bien définies
2. S'assurer que les calculs de pourcentages sont corrects
3. Vérifier les types TypeScript



