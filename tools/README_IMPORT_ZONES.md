# Guide d'utilisation du script d'import des zones

## Prérequis

### 1. Fichiers de découpage créés

Vos fichiers découpés doivent être dans :
```
tools/data/zones-decoupees/decoupage-{secteur}.geojson
```

Exemple :
```
tools/data/zones-decoupees/decoupage-nord-est.geojson
```

### 2. Variables d'environnement

Créez un fichier `.env.local` à la racine du projet avec :

```bash
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key
```

> **⚠️ Important** : La `SERVICE_ROLE_KEY` permet de contourner les RLS. Ne la commitez JAMAIS !

### 3. Dépendances

Le script utilise `@supabase/supabase-js`. Si pas encore installé :

```bash
npm install @supabase/supabase-js
```

---

## Utilisation

### Mode test (dry-run)

Validez vos données sans les insérer :

```bash
node tools/import-zones-tournees.mjs --secteur nord-est --dry-run
```

Le script affichera :
- ✅ Zones valides
- ❌ Zones invalides (et pourquoi)
- 📊 Statistiques (population totale, moyenne)
- 📋 Liste des zones qui seraient importées

### Import d'un secteur

```bash
node tools/import-zones-tournees.mjs --secteur nord-est
```

Secteurs disponibles :
- `nord-est`
- `nord`
- `sud`
- `sud-est`
- `ouest`

### Import de tous les secteurs

```bash
node tools/import-zones-tournees.mjs --all
```

### Écraser les zones existantes

Par défaut, le script refuse d'écraser une zone existante. Pour forcer :

```bash
node tools/import-zones-tournees.mjs --secteur nord-est --force
```

---

## Format des fichiers GeoJSON

Chaque zone dans votre fichier doit avoir cette structure :

```json
{
  "type": "Feature",
  "properties": {
    "code_zone": "NE-01",              // OBLIGATOIRE
    "nom_zone": "Ceyras - Centre",     // OBLIGATOIRE
    "commune": "Ceyras",               // OBLIGATOIRE
    "population_estimee": 280,         // OBLIGATOIRE
    "description": "Zone centre ville" // OPTIONNEL
  },
  "geometry": {
    "type": "Polygon",                 // OBLIGATOIRE
    "coordinates": [...]               // OBLIGATOIRE
  }
}
```

### Validations automatiques

Le script vérifie automatiquement :
- ✅ Présence de `code_zone`, `nom_zone`, `commune`
- ✅ `population_estimee` > 0
- ✅ Géométrie valide (type Polygon avec coordonnées)
- ✅ Format GeoJSON correct

---

## Exemples d'utilisation

### Workflow complet pour le Nord-Est

1. **Créer le découpage sur geojson.io**
   - Suivre le guide `GUIDE_DECOUPAGE_ZONES.md`
   - Sauvegarder dans `tools/data/zones-decoupees/decoupage-nord-est.geojson`

2. **Tester en mode dry-run**
   ```bash
   node tools/import-zones-tournees.mjs --secteur nord-est --dry-run
   ```

3. **Corriger les erreurs** si nécessaire

4. **Importer réellement**
   ```bash
   node tools/import-zones-tournees.mjs --secteur nord-est
   ```

5. **Vérifier dans Supabase**
   - Allez dans Table Editor → `zones_tournees`
   - Vérifiez que les 14 zones sont présentes
   - Vérifiez la vue `zones_tournees_enrichies`

### Mise à jour d'une zone modifiée

Si vous modifiez une zone sur geojson.io :

```bash
node tools/import-zones-tournees.mjs --secteur nord-est --force
```

Seules les zones avec le même `code_zone` seront mises à jour.

---

## Dépannage

### Erreur : "Variable d'environnement manquante"

**Problème** : Le fichier `.env.local` n'est pas lu

**Solution** :
```bash
# Chargez manuellement les variables :
export NEXT_PUBLIC_SUPABASE_URL="https://votre-projet.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="votre-key"

# Puis relancez le script
node tools/import-zones-tournees.mjs --secteur nord-est
```

### Erreur : "Aucune équipe trouvée pour le secteur"

**Problème** : Le nom du secteur dans la table `equipes` ne correspond pas

**Solution** : Vérifiez dans Supabase que la colonne `secteur` de la table `equipes` contient :
- "Secteur Nord-Est"
- "Secteur Nord"
- "Secteur Sud"
- "Secteur Sud-Est"
- "Secteur Ouest"

### Erreur : "Zone existe déjà"

**Problème** : Le `code_zone` existe déjà en base

**Solutions** :
1. Utilisez `--force` pour écraser
2. Changez le `code_zone` dans votre fichier GeoJSON
3. Supprimez manuellement la zone dans Supabase

### Zones invalides ignorées

Le script affiche pourquoi chaque zone est invalide :
- "code_zone manquant" → Ajoutez la propriété `code_zone`
- "population_estimee invalide" → Doit être un nombre > 0
- "Géométrie invalide" → Vérifiez que le polygone est fermé

---

## Calculs automatiques

Le script ne calcule PAS automatiquement les champs suivants (fait par le trigger SQL) :
- `nb_foyers_estimes` = `population_estimee / 2.2`
- `nb_calendriers_alloues` = `population_estimee / 6.5`

Ces calculs sont effectués automatiquement par le trigger SQL lors de l'insertion.

---

## Vérification post-import

Après import, vérifiez dans Supabase :

```sql
-- Vue d'ensemble
SELECT * FROM zones_tournees_enrichies
WHERE equipe_secteur = 'Secteur Nord-Est'
ORDER BY code_zone;

-- Statistiques du secteur
SELECT * FROM get_equipe_zones_stats(
  (SELECT id FROM equipes WHERE secteur = 'Secteur Nord-Est'),
  2025
);

-- Total population
SELECT
  COUNT(*) as nb_zones,
  SUM(population_estimee) as population_totale,
  ROUND(AVG(population_estimee)) as moyenne_par_zone
FROM zones_tournees
WHERE equipe_id = (SELECT id FROM equipes WHERE secteur = 'Secteur Nord-Est');
```

Résultat attendu pour Nord-Est :
- 14 zones
- ~3 747 habitants
- ~268 habitants/zone en moyenne

---

## Aide

Pour afficher l'aide du script :

```bash
node tools/import-zones-tournees.mjs --help
```

---

**Bon import ! 🔥**
