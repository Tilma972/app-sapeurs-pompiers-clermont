# Interface Admin - Gestion des Zones de Tournée

## 🎯 Accès

**URL** : `/dashboard/admin/zones-tournees`

**Permissions** : Administrateurs uniquement

---

## 📊 Vue d'ensemble

L'interface de gestion des zones de tournée permet de :
- ✅ Visualiser toutes les zones sur une carte interactive
- ✅ Voir les statistiques par équipe
- ✅ Assigner des pompiers aux zones
- ✅ Suivre la progression de distribution
- ✅ Mettre à jour les statuts et calendriers distribués
- ✅ Filtrer et rechercher les zones

---

## 🗺️ Fonctionnalités principales

### 1. Dashboard global

**Statistiques affichées** :
- **Total zones** : Nombre total de zones créées + population totale
- **Terminées** : Zones avec distribution terminée + % de progression
- **En cours** : Zones actuellement en distribution
- **À faire** : Zones non assignées ou non démarrées

### 2. Statistiques par équipe

Cartes individuelles pour chaque équipe avec :
- **Progression** : Barre de progression visuelle
- **Nombre de zones** : Total pour l'équipe
- **Population** : Habitants couverts
- **Calendriers** : Distribués / Alloués
- **Statuts** : Répartition (✓ Terminé, ⏳ En cours, ○ À faire)

### 3. Carte interactive

**Fonctionnalités** :
- **Visualisation** : Toutes les zones colorées par équipe
- **Opacité dynamique** : Varie selon le statut
  - 70% : Terminé
  - 50% : En cours
  - 20% : À faire
- **Hover** : Bordure mise en avant au survol
- **Popups** : Clic sur une zone affiche :
  - Code et nom de la zone
  - Équipe assignée
  - Pompier assigné (ou "Non assigné")
  - Population estimée
  - Calendriers distribués/alloués
  - Statut actuel

**Contrôles** :
- Zoom/Dézoom
- Déplacement par glisser-déposer
- Auto-fit : Centre automatiquement sur toutes les zones

### 4. Liste des zones

**Tableau complet avec colonnes** :
- Code (ex: NE-01)
- Nom de la zone
- Secteur (avec pastille de couleur)
- Pompier assigné
- Population
- Calendriers (distribués/alloués + %)
- Statut (badge coloré)
- Actions (Assigner, Modifier)

**Filtres disponibles** :
- 🔍 **Recherche** : Par code, nom ou équipe
- 🗺️ **Secteur** : Filtrer par secteur spécifique
- 📊 **Statut** : À faire, En cours, Terminé, Annulé
- 👤 **Pompier** : Par pompier assigné ou "Non assignés"

**Tri** :
- Par défaut : Code zone (ordre alphabétique)

---

## 🛠️ Actions disponibles

### Assigner un pompier (icône 👤)

**Comment faire** :
1. Cliquez sur l'icône **UserPlus** dans la colonne Actions
2. Sélectionnez un pompier dans la liste déroulante
3. Cliquez sur **Assigner**

**Options** :
- Choisir "Non assigné" pour retirer l'assignation
- La liste montre tous les pompiers avec leur email

**Effet** :
- Le pompier est immédiatement assigné à la zone
- La zone apparaît dans ses tâches
- Le tableau se rafraîchit automatiquement

### Modifier une zone (icône ✏️)

**Comment faire** :
1. Cliquez sur l'icône **Edit** dans la colonne Actions
2. Modifiez les champs souhaités :
   - **Statut** : À faire, En cours, Terminé, Annulé
   - **Calendriers distribués** : Nombre (0 à population estimée)
   - **Notes de terrain** : Observations, difficultés
3. Cliquez sur **Enregistrer**

**Automatisations** :
- **Statut "En cours"** : Date de début enregistrée automatiquement
- **Statut "Terminé"** : Date de fin enregistrée automatiquement
- **Calculs** : Progression calculée automatiquement

**Notes** :
- Les notes sont visibles uniquement par les admins
- Utiles pour documenter difficultés, horaires, particularités

---

## 📈 Workflow recommandé

### Phase 1 : Assignation initiale

1. **Filtrer** : Sélectionnez "Non assignés" dans le filtre Pompier
2. **Assigner** : Pour chaque zone, cliquez sur 👤 et assignez un pompier
3. **Vérifier** : Assurez-vous que chaque pompier a un nombre équilibré de zones

### Phase 2 : Suivi de la distribution

1. **Voir la carte** : Visualisez les zones en cours (opacité 50%)
2. **Filtrer** : "En cours" pour voir uniquement les zones actives
3. **Mettre à jour** : Cliquez sur ✏️ pour mettre à jour les calendriers distribués

### Phase 3 : Clôture

1. **Filtrer** : "En cours" pour voir les zones à terminer
2. **Modifier** : Changez le statut en "Terminé" quand distribution finie
3. **Dashboard** : Suivez la progression globale dans les statistiques

---

## 🎨 Code couleur des statuts

| Statut | Badge | Couleur | Signification |
|--------|-------|---------|---------------|
| **À faire** | ○ À faire | Gris | Zone non démarrée |
| **En cours** | ⏳ En cours | Orange | Distribution en cours |
| **Terminé** | ✓ Terminé | Vert | Distribution terminée |
| **Annulé** | ✕ Annulé | Rouge | Zone annulée |

---

## 🗂️ Données affichées

### Source des données

Toutes les données proviennent de la vue `zones_tournees_enrichies` qui joint :
- `zones_tournees` : Données des zones
- `equipes` : Informations des équipes
- `profiles` : Données des pompiers
- `auth.users` : Emails des utilisateurs

### Calculs automatiques

Les champs suivants sont calculés automatiquement :
- **nb_foyers_estimes** : `population_estimee / 2.2`
- **nb_calendriers_alloues** : `population_estimee / 6.5`
- **progression_pct** : `(calendriers_distribues / calendriers_alloues) * 100`
- **nb_calendriers_restants** : `alloués - distribués`

---

## 🔍 Cas d'usage

### Exemple 1 : Voir la progression du secteur Nord-Est

1. Ouvrez `/dashboard/admin/zones-tournees`
2. Consultez la carte des statistiques "Secteur Nord-Est"
3. Vérifiez la progression globale
4. Filtrez par "Secteur Nord-Est" dans la liste
5. Triez par statut pour voir les zones à terminer

### Exemple 2 : Assigner toutes les zones d'un secteur

1. Filtrez par "Secteur Nord-Est"
2. Filtrez par "Non assignés"
3. Pour chaque zone :
   - Cliquez sur 👤
   - Assignez un pompier disponible
4. Vérifiez l'équilibre des charges

### Exemple 3 : Suivre un pompier spécifique

1. Filtrez par le nom du pompier dans "Tous les pompiers"
2. Voyez toutes ses zones assignées
3. Vérifiez les statuts et progressions
4. Mettez à jour si nécessaire

### Exemple 4 : Clôturer une zone terminée

1. Recherchez le code de la zone (ex: "NE-05")
2. Cliquez sur ✏️ (Edit)
3. Changez le statut en "Terminé"
4. Vérifiez le nombre de calendriers distribués
5. Ajoutez des notes si besoin
6. Enregistrez

---

## 🚨 Bonnes pratiques

### Assignation

✅ **Bon** :
- Équilibrer le nombre de zones par pompier
- Assigner des zones géographiquement proches au même pompier
- Tenir compte des disponibilités

❌ **À éviter** :
- Assigner trop de zones à un seul pompier
- Assigner des zones éloignées au même pompier
- Oublier de rafraîchir après assignation

### Mise à jour des statuts

✅ **Bon** :
- Passer en "En cours" dès le début de la tournée
- Mettre à jour régulièrement les calendriers distribués
- Passer en "Terminé" seulement quand vraiment fini
- Ajouter des notes pour les particularités

❌ **À éviter** :
- Marquer "Terminé" sans vérifier
- Oublier de mettre à jour les calendriers
- Ne pas documenter les difficultés

### Utilisation des filtres

✅ **Bon** :
- Combiner plusieurs filtres pour affiner
- Utiliser "Non assignés" pour identifier les zones à assigner
- Filtrer par statut pour prioriser les actions

❌ **À éviter** :
- Filtrer sans vérifier le nombre de résultats
- Oublier de retirer les filtres entre les recherches

---

## 🎯 Statistiques clés à suivre

### Par équipe
- **Progression %** : Objectif 100%
- **Calendriers restants** : À distribuer
- **Zones à faire** : Non démarrées

### Global
- **Taux de complétion** : (Terminées / Total) * 100
- **Moyenne calendriers/zone** : ~40 calendriers
- **Population couverte** : Total habitants

---

## 🔄 Rafraîchissement des données

**Automatique** :
- Après chaque assignation de pompier
- Après chaque mise à jour de zone
- Au retour sur la page

**Manuel** :
- Rechargez la page (F5) si nécessaire
- Les données sont toujours à jour depuis Supabase

---

## 📱 Responsive

L'interface s'adapte à tous les écrans :
- **Desktop** : Vue complète avec tous les éléments
- **Tablet** : Cartes empilées, filtres en colonne
- **Mobile** : Vue simplifiée, cartes empilées verticalement

---

## 🐛 Dépannage

### La carte ne s'affiche pas

**Cause** : Leaflet n'est pas chargé
**Solution** : Rechargez la page (F5)

### Les zones ne s'affichent pas

**Cause** : Données GeoJSON invalides
**Solution** : Vérifiez les données dans Supabase

### L'assignation ne fonctionne pas

**Cause** : Permissions RLS
**Solution** : Vérifiez que vous êtes admin

### Les statistiques sont à 0

**Cause** : Aucune zone importée
**Solution** : Importez les zones avec le script de conversion

---

## 🎓 Pour aller plus loin

### Prochains secteurs

Après avoir testé avec le Nord-Est (14 zones) :
1. Importez Sud-Est (13-14 zones)
2. Importez Ouest (5-6 zones)
3. Importez Nord (5 zones)
4. Importez Sud (13-14 zones)
5. Importez Clermont (35-36 zones)

### Améliorations futures possibles

- Export Excel de la liste
- Impression de la carte par secteur
- Envoi de notifications aux pompiers
- Historique des modifications
- Statistiques avancées (temps moyen, taux de réussite)

---

**Bon courage pour la gestion de vos zones de tournée ! 🚒🔥**
