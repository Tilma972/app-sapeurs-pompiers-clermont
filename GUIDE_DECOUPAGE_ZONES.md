# Guide de Découpage des Zones de Tournée

Ce guide vous accompagne pas à pas pour découper votre secteur en zones de tournée d'environ 260 habitants assignables individuellement aux pompiers.

---

## 📊 Vue d'ensemble - Secteur Nord-Est

**Population totale** : 3 747 habitants
**Objectif** : 14 zones de ~268 habitants
**Calendriers** : ~40 calendriers par zone

### Répartition par commune

| Commune | Population | Zones à créer | Habitants/zone |
|---------|-----------|---------------|----------------|
| **Ceyras** | 1 389 | 5 zones | ~278 |
| **Saint-Félix-de-Lodez** | 1 149 | 4 zones | ~287 |
| **Jonquières** | 559 | 2 zones | ~280 |
| **Saint-Saturnin-de-Lucian** | 276 | 1 zone | 276 |
| **Saint-Guiraud** | 267 | 1 zone | 267 |
| **Arboras** | 107 | 1 zone | 107 |
| **TOTAL** | **3 747** | **14 zones** | **~268** |

---

## 🛠️ Outils nécessaires

### Option 1 : geojson.io (Recommandé pour débuter)
- **Site** : https://geojson.io
- **Avantages** : Simple, rapide, gratuit, en ligne
- **Inconvénients** : Moins précis, découpage manuel

### Option 2 : QGIS (Pour utilisateurs avancés)
- **Site** : https://qgis.org
- **Avantages** : Professionnel, découpage assisté par données
- **Inconvénients** : Courbe d'apprentissage

**Pour ce guide, nous utiliserons geojson.io** ✅

---

## 📋 Convention de nommage

### Codes de zones
```
Format : {SECTEUR}-{NUMERO}

Nord-Est     → NE-01, NE-02, NE-03...
Nord         → NO-01, NO-02, NO-03...
Sud          → SU-01, SU-02, SU-03...
Sud-Est      → SE-01, SE-02, SE-03...
Ouest        → OU-01, OU-02, OU-03...
```

### Noms de zones
```
Format : {Commune} - {Quartier/Description}

Exemples :
- "Ceyras - Centre Ville"
- "Ceyras - Lotissement Les Pins"
- "Saint-Félix - Village Haut"
- "Saint-Saturnin - Commune Entière"
```

---

## 🗺️ Guide pas-à-pas : Découper le Nord-Est

### Étape 1 : Préparer le fichier source

1. **Localisez le fichier** :
   ```
   public/sectors/nord-est.geojson
   ```

2. **Ouvrez-le dans geojson.io** :
   - Allez sur https://geojson.io
   - Menu : **Open** → **File**
   - Sélectionnez `nord-est.geojson`

3. **Vous devriez voir** :
   - Le polygone global du secteur Nord-Est
   - Les 6 communes : Arboras, Ceyras, Jonquières, Saint-Félix, Saint-Guiraud, Saint-Saturnin

### Étape 2 : Découper Ceyras (5 zones)

Ceyras est la commune la plus peuplée (1 389 habitants), elle nécessite 5 zones.

#### Zone NE-01 : Ceyras - Centre Ville (~280 hab)

1. **Sélectionnez l'outil polygone** (🔷 en haut à droite)
2. **Dessinez** le centre du village en cliquant pour créer les points
3. **Fermez le polygone** en cliquant sur le premier point
4. **Dans la colonne de droite**, ajoutez les propriétés JSON :

```json
{
  "code_zone": "NE-01",
  "nom_zone": "Ceyras - Centre Ville",
  "commune": "Ceyras",
  "population_estimee": 280
}
```

#### Zones NE-02 à NE-05 : Autres quartiers de Ceyras

Répétez le processus pour 4 autres zones :

```json
// Zone NE-02
{
  "code_zone": "NE-02",
  "nom_zone": "Ceyras - Quartier Nord",
  "commune": "Ceyras",
  "population_estimee": 278
}

// Zone NE-03
{
  "code_zone": "NE-03",
  "nom_zone": "Ceyras - Quartier Est",
  "commune": "Ceyras",
  "population_estimee": 277
}

// Zone NE-04
{
  "code_zone": "NE-04",
  "nom_zone": "Ceyras - Quartier Sud",
  "commune": "Ceyras",
  "population_estimee": 277
}

// Zone NE-05
{
  "code_zone": "NE-05",
  "nom_zone": "Ceyras - Quartier Ouest",
  "commune": "Ceyras",
  "population_estimee": 277
}
```

**💡 Astuce** : Utilisez Google Maps en satellite pour identifier les quartiers, lotissements, et regroupements de maisons.

### Étape 3 : Découper Saint-Félix-de-Lodez (4 zones)

Saint-Félix : 1 149 habitants → 4 zones de ~287 habitants

```json
// Zone NE-06
{
  "code_zone": "NE-06",
  "nom_zone": "Saint-Félix - Centre",
  "commune": "Saint-Félix-de-Lodez",
  "population_estimee": 287
}

// Zone NE-07
{
  "code_zone": "NE-07",
  "nom_zone": "Saint-Félix - Nord",
  "commune": "Saint-Félix-de-Lodez",
  "population_estimee": 288
}

// Zone NE-08
{
  "code_zone": "NE-08",
  "nom_zone": "Saint-Félix - Sud",
  "commune": "Saint-Félix-de-Lodez",
  "population_estimee": 287
}

// Zone NE-09
{
  "code_zone": "NE-09",
  "nom_zone": "Saint-Félix - Est",
  "commune": "Saint-Félix-de-Lodez",
  "population_estimee": 287
}
```

### Étape 4 : Découper Jonquières (2 zones)

Jonquières : 559 habitants → 2 zones de ~280 habitants

```json
// Zone NE-10
{
  "code_zone": "NE-10",
  "nom_zone": "Jonquières - Centre-Ouest",
  "commune": "Jonquières",
  "population_estimee": 280
}

// Zone NE-11
{
  "code_zone": "NE-11",
  "nom_zone": "Jonquières - Nord-Est",
  "commune": "Jonquières",
  "population_estimee": 279
}
```

### Étape 5 : Petites communes (1 zone chacune)

Pour les petites communes (<300 habitants), une seule zone suffit.

```json
// Zone NE-12
{
  "code_zone": "NE-12",
  "nom_zone": "Saint-Saturnin - Commune Entière",
  "commune": "Saint-Saturnin-de-Lucian",
  "population_estimee": 276
}

// Zone NE-13
{
  "code_zone": "NE-13",
  "nom_zone": "Saint-Guiraud - Commune Entière",
  "commune": "Saint-Guiraud",
  "population_estimee": 267
}

// Zone NE-14
{
  "code_zone": "NE-14",
  "nom_zone": "Arboras - Commune Entière",
  "commune": "Arboras",
  "population_estimee": 107
}
```

### Étape 6 : Nettoyer et sauvegarder

1. **Supprimez** les anciens polygones des communes entières (pour ne garder que vos nouvelles zones)
2. **Vérifiez** que chaque zone a bien ses propriétés JSON
3. **Sauvegardez** : Menu **Save** → **GeoJSON**
4. **Nommez le fichier** : `decoupage-nord-est.geojson`

---

## ✅ Validation du découpage

### Checklist avant de continuer

- [ ] 14 zones créées au total
- [ ] Chaque zone a un `code_zone` unique (NE-01 à NE-14)
- [ ] Chaque zone a un `nom_zone` descriptif
- [ ] Chaque zone a une `population_estimee`
- [ ] La somme des populations ≈ 3 747 habitants
- [ ] Les polygones ne se chevauchent pas
- [ ] Tous les polygones sont fermés (pas d'ouverture)
- [ ] Le fichier est sauvegardé en `.geojson`

### Vérification de la population totale

```javascript
// Ouvrez la console JavaScript de geojson.io (F12)
// Collez ce code pour vérifier :

let total = 0;
let zones = 0;
data.features.forEach(f => {
  if (f.properties.population_estimee) {
    total += f.properties.population_estimee;
    zones++;
  }
});
console.log(`${zones} zones, Total population : ${total} habitants`);
// Résultat attendu : "14 zones, Total population : 3747 habitants"
```

---

## 🎯 Conseils pratiques

### Comment estimer la répartition de population ?

1. **Utilisez Google Maps en mode satellite**
   - Comptez approximativement les maisons
   - Moyenne : ~2.2 habitants par maison en France rurale

2. **Regardez la densité du bâti**
   - Zone dense (lotissement) = plus d'habitants
   - Zone dispersée (fermes) = moins d'habitants

3. **Consultez les cartes IGN**
   - https://www.geoportail.gouv.fr
   - Activez la couche "Bâtiments"

4. **Soyez approximatif, pas précis**
   - L'objectif est ~260 habitants ± 20%
   - Acceptable : 210 à 310 habitants
   - La précision viendra avec l'expérience terrain

### Découpage intelligent

**✅ Bonnes pratiques** :
- Suivre les routes principales comme limites
- Regrouper les lotissements entiers
- Éviter de couper un hameau en deux
- Créer des zones compactes (pas trop étirées)
- Penser au parcours logique du pompier

**❌ À éviter** :
- Zones trop étirées géographiquement
- Découpage au milieu d'une rue
- Zones inaccessibles (séparées par une rivière)
- Zones trop petites (<150 hab) ou trop grandes (>350 hab)

---

## 📁 Structure des fichiers après découpage

```
app-sapeurs-pompiers-clermont/
├── public/sectors/
│   ├── nord-est.geojson           (ancien fichier global)
│   ├── nord.geojson
│   ├── sud.geojson
│   ├── sud-est.geojson
│   └── ouest.geojson
│
└── tools/data/                     (nouveau dossier à créer)
    └── zones-decoupees/
        ├── decoupage-nord-est.geojson  ← Votre fichier créé
        ├── decoupage-nord.geojson      (à faire ensuite)
        ├── decoupage-sud.geojson       (à faire ensuite)
        ├── decoupage-sud-est.geojson   (à faire ensuite)
        └── decoupage-ouest.geojson     (à faire ensuite)
```

---

## 🚀 Prochaine étape

Une fois votre fichier `decoupage-nord-est.geojson` créé et validé :

1. **Placez-le** dans `tools/data/zones-decoupees/decoupage-nord-est.geojson`
2. **Lancez le script d'import** (sera créé à l'étape suivante) :
   ```bash
   node tools/import-zones-tournees.mjs
   ```
3. **Vérifiez** dans Supabase que les 14 zones sont bien importées

---

## ❓ Questions fréquentes

### Puis-je modifier les zones après import ?

Oui ! Vous pourrez :
- Modifier les polygones
- Ajuster les populations
- Re-importer les zones modifiées

Le script d'import gérera les mises à jour.

### Comment gérer Clermont-l'Hérault (9 269 hab) ?

Clermont nécessitera ~35 zones. C'est plus complexe :
1. Commencez par les communes rurales (Nord-Est, Sud-Est, etc.)
2. Une fois l'expérience acquise, attaquez Clermont
3. Utilisez les quartiers administratifs comme base
4. Consultez le plan de la ville

### Que faire si une zone fait 350 habitants ?

Ce n'est pas grave ! L'objectif de 260 habitants est indicatif :
- **Acceptable** : 200-320 habitants (±20%)
- **À éviter** : <150 ou >400 habitants
- Le pompier aura simplement 50-55 calendriers au lieu de 40

### Puis-je utiliser des outils automatiques ?

Oui, pour les utilisateurs QGIS avancés :
1. Importez la couche de bâtiments (BD TOPO IGN)
2. Utilisez l'algorithme de clustering k-means
3. Ajustez manuellement les frontières

Mais pour débuter, le découpage manuel sur geojson.io est plus simple.

---

## 📞 Besoin d'aide ?

Si vous rencontrez des difficultés :
1. Vérifiez que vos polygones sont bien fermés
2. Assurez-vous que les propriétés JSON sont bien formatées
3. Testez avec une ou deux zones d'abord
4. Demandez de l'aide si nécessaire !

---

**Bon courage pour le découpage ! 🗺️🔥**
