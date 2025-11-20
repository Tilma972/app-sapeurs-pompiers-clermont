# Guide d'utilisation : Conversion GeoJSON → SQL

Ce script convertit vos fichiers GeoJSON de zones découpées en migrations SQL prêtes à exécuter dans Supabase.

---

## 🚀 Utilisation rapide

```bash
# Convertir votre fichier découpé
node tools/geojson-to-sql.mjs decoupage-nord-est.geojson
```

Le script va :
1. ✅ Valider toutes les zones
2. ✅ Générer le fichier SQL dans `supabase/migrations/`
3. ✅ Afficher les statistiques (population, nombre de zones, etc.)

---

## 📋 Workflow complet

### Étape 1 : Découper votre secteur sur geojson.io

Suivez le guide `GUIDE_DECOUPAGE_ZONES.md` pour créer vos zones.

**Important** : Nommez votre fichier selon la convention :
```
decoupage-{secteur}.geojson
```

Exemples :
- `decoupage-nord-est.geojson`
- `decoupage-sud.geojson`
- `decoupage-ouest.geojson`

Secteurs supportés : `nord-est`, `nord`, `sud`, `sud-est`, `ouest`

### Étape 2 : Placer le fichier

Placez votre fichier dans :
```
tools/data/zones-decoupees/decoupage-nord-est.geojson
```

Ou gardez-le ailleurs, le script accepte les chemins complets.

### Étape 3 : Convertir en SQL

```bash
node tools/geojson-to-sql.mjs decoupage-nord-est.geojson
```

**Sortie** :
```
🔥 Conversion GeoJSON → Migration SQL

ℹ️  Lecture du fichier: tools/data/zones-decoupees/decoupage-nord-est.geojson
✅ 14 zone(s) trouvée(s)
✅ Secteur détecté: Secteur Nord-Est
ℹ️  Validation des zones...
✅ 14 zone(s) valide(s)

📊 Statistiques:
   Population totale: 3747 habitants
   Moyenne par zone: 268 habitants
   Calendriers estimés: 577 (~40 par zone)

ℹ️  Génération du SQL...
✅ Fichier SQL créé: supabase/migrations/20251120_import_zones_nord_est.sql

============================================================
✅ Conversion terminée avec succès !
============================================================
```

### Étape 4 : Exécuter dans Supabase

1. Ouvrez **Supabase SQL Editor**
2. Ouvrez le fichier généré : `supabase/migrations/20251120_import_zones_nord_est.sql`
3. Copiez tout le contenu
4. Collez dans SQL Editor
5. Cliquez sur **RUN**

### Étape 5 : Vérifier l'import

Dans Supabase SQL Editor :

```sql
-- Voir toutes les zones du secteur
SELECT * FROM zones_tournees_enrichies
WHERE equipe_secteur = 'Secteur Nord-Est'
ORDER BY code_zone;

-- Statistiques du secteur
SELECT * FROM get_equipe_zones_stats(
  (SELECT id FROM equipes WHERE secteur = 'Secteur Nord-Est'),
  2025
);
```

---

## 🎛️ Options avancées

### Nom de fichier personnalisé

```bash
node tools/geojson-to-sql.mjs decoupage-nord-est.geojson --output mon-import.sql
```

### Avec chemin complet

```bash
node tools/geojson-to-sql.mjs /chemin/complet/vers/fichier.geojson
```

### Aide

```bash
node tools/geojson-to-sql.mjs --help
```

---

## ✅ Validations automatiques

Le script vérifie automatiquement :

### Propriétés requises
- ✅ `code_zone` présent et unique
- ✅ `nom_zone` présent
- ✅ `commune` présente
- ✅ `population_estimee` > 0

### Géométrie
- ✅ Type `Polygon` ou `MultiPolygon`
- ✅ Coordonnées valides

### Erreurs détectées
- ❌ Zone sans code
- ❌ Population manquante ou négative
- ❌ Géométrie invalide
- ⚠️  Codes zones dupliqués

---

## 📊 Que fait le SQL généré ?

### 1. Récupération de l'équipe

```sql
SELECT id INTO v_equipe_id
FROM public.equipes
WHERE secteur = 'Secteur Nord-Est';
```

Si l'équipe n'existe pas, le script s'arrête avec une erreur claire.

### 2. Import des zones

Pour chaque zone :

```sql
INSERT INTO public.zones_tournees (
  equipe_id,
  code_zone,
  nom_zone,
  description,
  geom,
  population_estimee,
  annee,
  statut
) VALUES (...)
ON CONFLICT (code_zone) DO UPDATE SET ...
```

**`ON CONFLICT`** : Si une zone avec le même `code_zone` existe déjà, elle sera mise à jour automatiquement.

### 3. Calculs automatiques (via trigger SQL)

Le trigger `calculate_zones_tournees_fields_trigger` calcule automatiquement :
- `nb_foyers_estimes` = `population_estimee / 2.2`
- `nb_calendriers_alloues` = `population_estimee / 6.5`

### 4. Statistiques finales

Affiche un résumé avec :
- Nombre de zones importées
- Population totale
- Moyenne par zone
- Calendriers estimés

---

## 🐛 Dépannage

### Erreur : "Fichier introuvable"

**Vérifiez que** :
1. Le fichier existe dans `tools/data/zones-decoupees/`
2. Le nom du fichier est correct
3. Ou donnez le chemin complet

### Erreur : "Impossible de détecter le secteur"

**Le fichier doit être nommé** : `decoupage-{secteur}.geojson`

Exemples valides :
- ✅ `decoupage-nord-est.geojson`
- ✅ `decoupage-sud.geojson`
- ❌ `zones-nord-est.geojson` (mauvais préfixe)
- ❌ `decoupage_nord_est.geojson` (underscore au lieu de tiret)

### Erreur : "Secteur inconnu"

Secteurs supportés :
- `nord-est` → Secteur Nord-Est
- `nord` → Secteur Nord
- `sud` → Secteur Sud
- `sud-est` → Secteur Sud-Est
- `ouest` → Secteur Ouest

### Erreur : "Zone X invalide"

Le script indique exactement ce qui manque :
- "code_zone manquant" → Ajoutez la propriété dans geojson.io
- "population_estimee invalide" → Doit être un nombre > 0
- "Géométrie invalide" → Vérifiez que le polygone est fermé

### Erreur SQL : "Équipe non trouvée"

**Dans Supabase**, vérifiez que la table `equipes` contient bien :

```sql
SELECT id, nom, secteur FROM equipes;
```

La colonne `secteur` doit contenir exactement :
- "Secteur Nord-Est"
- "Secteur Nord"
- "Secteur Sud"
- "Secteur Sud-Est"
- "Secteur Ouest"

### Codes zones dupliqués

Le script détecte les doublons de `code_zone`.

**Solution** : Chaque zone doit avoir un code unique (NE-01, NE-02, etc.)

---

## 📝 Format du fichier GeoJSON

Exemple de zone valide :

```json
{
  "type": "Feature",
  "properties": {
    "code_zone": "NE-01",
    "nom_zone": "Ceyras - Centre Ville",
    "commune": "Ceyras",
    "population_estimee": 280,
    "description": "Zone centre ville"
  },
  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [
        [3.4369, 43.6733],
        [3.4388, 43.6728],
        [3.4395, 43.6715],
        [3.4380, 43.6702],
        [3.4362, 43.6708],
        [3.4358, 43.6720],
        [3.4369, 43.6733]
      ]
    ]
  }
}
```

**Propriétés obligatoires** : `code_zone`, `nom_zone`, `commune`, `population_estimee`

**Propriétés optionnelles** : `description` (sera généré automatiquement si absent)

---

## 🔄 Mise à jour de zones existantes

Si vous modifiez une zone sur geojson.io et la reconvertissez :

```bash
node tools/geojson-to-sql.mjs decoupage-nord-est.geojson
```

Le SQL généré utilisera `ON CONFLICT (code_zone) DO UPDATE`, donc :
- Les zones avec le même `code_zone` seront **mises à jour**
- Les nouvelles zones seront **insérées**
- Les zones supprimées resteront en base (supprimez-les manuellement si besoin)

---

## 🎯 Exemple complet : Nord-Est

### 1. Créer le fichier sur geojson.io

14 zones avec les codes NE-01 à NE-14

### 2. Sauvegarder

`tools/data/zones-decoupees/decoupage-nord-est.geojson`

### 3. Convertir

```bash
node tools/geojson-to-sql.mjs decoupage-nord-est.geojson
```

**Résultat** :
```
✅ Fichier SQL créé: supabase/migrations/20251120_import_zones_nord_est.sql
```

### 4. Exécuter dans Supabase

Copier-coller le SQL dans Supabase SQL Editor et exécuter.

### 5. Vérifier

```sql
SELECT code_zone, nom_zone, population_estimee, nb_calendriers_alloues
FROM zones_tournees
WHERE equipe_id = (SELECT id FROM equipes WHERE secteur = 'Secteur Nord-Est')
ORDER BY code_zone;
```

**Résultat attendu** : 14 lignes avec NE-01 à NE-14

---

## 🚀 Prochaines étapes

Après avoir importé le Nord-Est, répétez le processus pour :

1. **Sud-Est** (13-14 zones)
2. **Ouest** (5-6 zones)
3. **Nord** (5 zones)
4. **Sud** (13-14 zones)
5. **Clermont-l'Hérault** (35-36 zones)

**Total final : ~85 zones pour 22 393 habitants** 🚒🔥

---

**Bon courage pour la conversion ! 🗺️➡️💾**
