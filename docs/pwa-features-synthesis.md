# 📋 Synthèse des Features Validées - PWA Calendriers

## 🎯 Vue d'ensemble du projet

**Application PWA** pour la gestion des tournées de collecte de calendriers par les sapeurs-pompiers de Clermont-l'Hérault et du Cœur d'Hérault.

**Contexte terrain :**
- 5 équipes pour 5 secteurs couvrant 21 communes
- Modes de travail variés : solo, binôme, demi-équipe, équipe complète
- Besoin de simplicité pour les utilisateurs réfractaires aux outils numériques

---

## ✅ Features validées et leur logique

### 🗺️ **1. Géolocalisation des transactions (reçus générés)**

#### **Objectif**
Savoir où l'équipe a travaillé en capturant la position GPS au moment de la génération de chaque reçu fiscal ou de soutien.

#### **Logique métier**
- **Quand** : Lors de la génération d'un reçu (don fiscal ou soutien)
- **Quoi** : Capture latitude, longitude, timestamp
- **Pourquoi** : Visualiser la couverture réelle du secteur (pas un simple tracking GPS)

#### **Technique**
- Colonnes ajoutées à `support_transactions` : `latitude`, `longitude`, `geolocation_timestamp`
- Capture côté client (formulaire) via `navigator.geolocation.getCurrentPosition()`
- **Non bloquant** : Si GPS échoue, la transaction s'enregistre quand même (lat/lon = null)
- Timeout court (3-5s) pour éviter les blocages

#### **Utilité pour le pompier**
- Voir où j'ai travaillé aujourd'hui
- Vérifier que je couvre bien tout mon secteur
- Partager avec l'équipe les zones déjà visitées

---

### 🗺️ **2. Carte du secteur attribué à mon équipe**

#### **Objectif**
Permettre au pompier de visualiser le secteur géographique affecté à son équipe et de générer un itinéraire pour s'y rendre.

#### **Logique métier**
- Chaque équipe a un secteur géographique fixe avec liste de communes
- Le pompier doit pouvoir retrouver facilement "où je dois aller"
- Génération d'itinéraire via Google Maps pour se rendre au centre du secteur

#### **Technique**
- Colonnes ajoutées à `equipes` : 
  - `secteur_centre_lat`, `secteur_centre_lon` : Centre géographique du secteur
  - `communes` : Array des communes du secteur (ex: `['CLERMONT-L'HÉRAULT', 'CANET', 'NEBIAN']`)
  - Optionnel : `secteur_geojson` pour polygone complet (phase 2)
- Page dédiée `/dashboard/mon-secteur`
- Carte Leaflet simple avec marker au centre + bouton "Itinéraire"

#### **Utilité pour le pompier**
- "Je ne me souviens plus de mon secteur" → Carte accessible en 2 clics
- "Comment j'y vais ?" → Bouton itinéraire direct vers Google Maps
- Repérage facile avant de partir en tournée

---

### 🗺️ **3. Carte de couverture d'équipe (reçus géolocalisés)**

#### **Objectif**
Visualiser où l'équipe entière a généré des reçus pour voir la couverture collective du secteur.

#### **Logique métier**
- Tous les membres de l'équipe voient les mêmes données
- Permet de voir les "trous" dans la couverture
- Évite de repasser deux fois au même endroit

#### **Technique**
- Requête jointure : `support_transactions` ← `profiles` ← `equipes`
- Filtrage par `team_id` de l'utilisateur connecté
- Affichage sur carte avec markers colorés par équipe
- Collapsible pour ne pas encombrer l'interface

#### **Utilité pour le pompier**
- "Est-ce que mon équipe a déjà fait cette rue ?"
- "Où sont les zones encore à couvrir ?"
- Coordination informelle entre membres

---

### 💰 **4. Système de rétribution (30% pompier + répartition libre)**

#### **Objectif**
Calculer et distribuer automatiquement la rétribution des pompiers à la clôture de tournée.

#### **Règles officielles du bureau**
1. **70% du montant collecté** → Amicale (fonctionnement)
2. **30% du montant collecté** → Pompier qui fait la tournée
3. Le pompier **choisit librement** comment répartir ses 30% :
   - X% → Pot commun de l'équipe (activités communes)
   - (100-X)% → Son compte personnel (Compte SP)

#### **Logique métier**
```
Exemple : 450€ collectés

├─ 70% Amicale = 315€ (automatique)
└─ 30% Pompier = 135€ (à répartir)
    ├─ 50% → Pot équipe = 67,50€
    └─ 50% → Compte perso = 67,50€
```

#### **Technique**
- Tables : `comptes_sp` (compte individuel), `pots_equipe` (cagnotte commune), `mouvements_retribution` (historique)
- Fonction SQL : `cloturer_tournee_avec_retribution(tournee_id, pourcentage_pot_equipe)`
- Modal de clôture : Slider 0-100% avec aperçu en temps réel

#### **Utilité pour le pompier**
- Transparence totale sur sa rétribution
- Liberté de choix (solidarité équipe vs gain perso)
- Motivation via visualisation du "Compte SP" qui grandit

---

### 🤝 **5. Système hybride de gouvernance (minimum + recommandation)**

#### **Objectif**
Éviter les tensions d'équipe dues à des contributions inégales au pot commun, tout en préservant la liberté individuelle.

#### **Problème identifié**
- Si certains mettent 10% et d'autres 90%, tensions lors des activités communes
- Risque de "passagers clandestins" qui profitent sans contribuer
- Spirale vers le bas : tout le monde baisse sa contribution par mimétisme

#### **Solution hybride validée**

**Niveau 1 : Minimum obligatoire**
- Défini par équipe (ex: 20% minimum au pot)
- Appliqué automatiquement dans le slider de clôture
- Évite les contributions à 0%

**Niveau 2 : Recommandation d'équipe**
- Défini collectivement (ex: 50% recommandé)
- Bouton "Appliquer recommandation" dans le modal
- Message si en dessous de la recommandation

**Niveau 3 : Transparence (optionnelle)**
- Mode "privé" : Seul le membre voit sa contribution
- Mode "équipe" : Tous voient les contributions de chacun
- Mode "anonyme" : Seulement la moyenne d'équipe affichée

#### **Technique**
- Colonnes ajoutées à `equipes` :
  - `pourcentage_minimum_pot` : Ex: 20% (contrainte dure)
  - `pourcentage_recommande` : Ex: 50% (suggestion)
  - `mode_transparence` : 'prive' | 'equipe' | 'anonyme'
  - `charte_votee` : Boolean (validation collective)
- Trigger SQL pour vérifier le minimum avant insertion
- Interface de vote pour le chef d'équipe

#### **Utilité pour l'équipe**
- Évite les tensions et frustrations
- Préserve la liberté tout en guidant vers l'équité
- S'adapte à la culture de chaque équipe

---

### 📊 **6. Interface "Ma Tournée" - UX usage réel terrain**

#### **Objectif**
Interface ultra-simple pour les 3 SEULS moments où le pompier sort son téléphone pendant une tournée.

#### **INSIGHT CRITIQUE : Téléphone dans la poche 95% du temps**

**Usage réel validé :**
- Pompier fait sa tournée → Téléphone éteint/en poche
- Compte mentalement ou sur papier
- Sort le téléphone UNIQUEMENT dans 3 cas précis

#### **Les 3 moments où le téléphone est sorti**

**1. DÉBUT de tournée (optionnel)**
- Si besoin : indiquer le nombre de calendriers emportés
- Sinon : on skip, pas obligatoire

**2. PENDANT la tournée (rare, ~5-10% des cas)**
- 💳 Paiement carte → QR code Stripe
- 📄 Reçu fiscal demandé → Formulaire avec email

**3. FIN de tournée (obligatoire)**
- 🏁 Clôture → Bilan global avec saisie manuelle

#### **Structure interface optimisée**

```
┌─────────────────────────────────────────┐
│ 👤 Bonjour Marc · Équipe 2             │
│ 📍 Secteur Nord · [Voir carte]         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 📊 TOURNÉE EN COURS                     │
│                                         │
│ 🎯 Calendriers emportés : 50           │
│ 📄 Reçus générés : 3                   │
│ 💳 Paiements carte : 2                 │
│ ⏱️ Début : 14h30                        │
└─────────────────────────────────────────┘

┌──────────────────┬──────────────────────┐
│ 💳 Paiement      │ 📄 Don avec         │
│    carte         │    reçu             │
│ (QR code)        │ (Email requis)      │
└──────────────────┴──────────────────────┘

┌─────────────────────────────────────────┐
│ 🗺️ Couverture équipe (▼ Afficher)     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 📜 Historique (3 transactions)          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│     🏁 CLÔTURER MA TOURNÉE             │
│                                         │
│  Saisir le bilan de ma collecte        │
└─────────────────────────────────────────┘
```

#### **Modal de clôture (le plus important)**

```
┌─────────────────────────────────────────┐
│ 🏁 Clôture de tournée                  │
├─────────────────────────────────────────┤
│                                         │
│ BILAN GLOBAL DE MA COLLECTE             │
│                                         │
│ Nombre de calendriers vendus :         │
│ [    23    ] calendriers               │
│                                         │
│ Montant espèces collecté :             │
│ [   230,00   ] €                       │
│                                         │
│ Nombre de chèques reçus :              │
│ [     2    ] chèques                   │
│                                         │
│ Montant chèques :                      │
│ [    40,00   ] €                       │
│                                         │
│ ──────────────────────────────          │
│ TOTAL : 270,00€                        │
│                                         │
│ 🎁 Votre rétribution (30%) : 81€      │
│ └─ Répartir entre vous et pot équipe   │
│                                         │
│         [Annuler]  [Valider]           │
└─────────────────────────────────────────┘
```

#### **Simplification : Début de tournée**

**Option A (simple) :** Pas de saisie au début
- Tournée démarre automatiquement avec statut "active"
- Pas besoin de dire combien de calendriers emportés

**Option B (optionnel) :** Saisie ultra-rapide
- 1 seul champ : "Calendriers emportés : [50]"
- Pas obligatoire, juste informatif

**Recommandation :** Option A pour éviter toute friction

#### **Flux utilisateur type (réalité terrain)**

**14h00 - Départ tournée**
- Ouvre l'app → Tournée démarre automatiquement
- Téléphone dans la poche → Sort faire du porte-à-porte

**14h00-16h30 - Tournée active**
- Téléphone éteint dans la poche
- Compte mentalement : "23 calendriers vendus"
- Note sur papier si besoin : "230€ espèces, 2 chèques 40€"

**15h15 - Cas exceptionnel : reçu demandé**
- Sort le téléphone
- Bouton "Don avec reçu"
- Saisit email du donateur
- Remet téléphone en poche

**16h45 - Retour à la maison**
- Sort le téléphone
- Bouton "Clôturer ma tournée"
- Saisit : 23 calendriers, 230€ espèces, 2 chèques 40€
- Choisit répartition rétribution (50% pot équipe)
- Valide → Tournée terminée

#### **Technique**
- Pas de compteur en temps réel (inutile, téléphone éteint)
- Pas de tracking GPS permanent (batterie)
- Seulement géolocalisation lors génération reçu
- Modal clôture = 1 formulaire simple avec 4 champs

#### **Utilité pour le pompier**
✅ **Zéro friction** : téléphone sort 3 fois maximum  
✅ **Pas de batterie gaspillée** : app fermée 95% du temps  
✅ **Comptage libre** : mental, papier, ou rien  
✅ **Clôture rapide** : 4 champs, 30 secondes  
✅ **Calcul auto** : rétribution affichée instantanément  

#### **Communication claire**
> "Faites votre tournée normalement. Sortez votre téléphone uniquement si on vous demande un reçu ou un paiement carte. En fin de tournée, saisissez simplement votre bilan : nombre de calendriers vendus et montants collectés."

---

### 🏗️ **7. Gestion des équipes (structure déjà en place)**

#### **État actuel**
- Table `equipes` avec 5 équipes pré-configurées
- `profiles.team_id` pour lier utilisateurs → équipes
- Système de `chef_equipe_id` pour délégation

#### **À venir (phase 2, si demandé sur le terrain)**
- Table `affectations_journee` pour découpage dynamique
- Le chef peut créer des "missions" (binômes, zones)
- Flexibilité totale : solo, binôme, demi-équipe, équipe complète

---

## 🎯 Priorités d'implémentation

### **Phase 1 : Fondations (maintenant)**
1. ✅ Géolocalisation des transactions
2. ✅ Données secteurs dans table `equipes`
3. ✅ Page "Mon secteur" avec carte
4. ✅ Système de rétribution (30% + répartition)
5. ✅ Tables `comptes_sp`, `pots_equipe`, `mouvements_retribution`

### **Phase 2 : Gouvernance & UX (cette semaine)**
6. Système hybride (minimum + recommandation)
7. Optimisation interface "Ma Tournée"
8. Page "Mon Compte & Pot d'Équipe"
9. Carte de couverture équipe (collapsible)

### **Phase 3 : Avancé (si besoin terrain confirmé)**
10. Polygones de secteurs (si besoin précision)
11. Découpage en missions (binômes flexibles)
12. Heatmaps au lieu de markers
13. Notifications pour le chef d'équipe

---

## 🚨 Principes directeurs pour la suite

### **Simplicité UX**
- ❌ Pas de features cachées dans 3 niveaux de menus
- ✅ Actions principales accessibles en 1-2 clics
- ✅ Interface qui "respire" (pas surchargée)

### **Résilience technique**
- ❌ Pas de blocage si GPS échoue
- ✅ Fallbacks systématiques (données null = OK)
- ✅ Messages d'erreur clairs et bienveillants

### **Adaptation au terrain**
- ❌ Pas de sur-ingénierie pour des cas rares
- ✅ Écouter les retours des pompiers réfractaires
- ✅ Itérations rapides basées sur feedback réel

### **Transparence & confiance**
- ❌ Pas de calculs opaques
- ✅ Afficher les règles clairement
- ✅ Historique consultable à tout moment

---

## 📝 Notes pour futures conversations

### **Questions en suspens**
- Faut-il un système de notifications pour le chef d'équipe ?
- Mode hors-ligne : jusqu'où pousser la PWA ?
- Export CSV des données pour analyse externe ?
- Intégration avec Baserow : à garder ou migrer 100% sur Supabase ?

### **Décisions à valider avec le bureau**
- Pourcentage minimum obligatoire : 0%, 10%, 20% ?
- Pourcentage recommandé par défaut : 50% ?
- Mode de transparence : privé, équipe, ou anonyme ?
- Rôle du chef d'équipe : peut-il forcer une règle ?

### **Features "nice to have" (backlog)**
- Gamification : badges, classements, défis
- Statistiques avancées : évolution dans le temps, prédictions
- Mode sombre pour utilisation nocturne
- Raccourcis clavier pour les power users
- Synchronisation calendrier Google (tournées planifiées)

---

## 🎉 Résumé en une phrase

**Une PWA simple et robuste qui permet aux pompiers de gérer leurs tournées, visualiser leur secteur, voir la couverture de leur équipe, et gérer leur rétribution de manière transparente, tout en préservant la cohésion d'équipe via un système hybride de contribution au pot commun.**