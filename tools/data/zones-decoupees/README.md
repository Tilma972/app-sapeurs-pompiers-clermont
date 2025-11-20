# Zones Découpées

Ce dossier contient les fichiers GeoJSON des zones de tournée découpées pour chaque secteur.

## Structure des fichiers

Chaque fichier doit suivre ce format :

```
decoupage-{secteur}.geojson
```

Exemples :
- `decoupage-nord-est.geojson` (14 zones)
- `decoupage-sud-est.geojson` (13-14 zones)
- `decoupage-nord.geojson` (9-10 zones)
- `decoupage-sud.geojson` (13-15 zones)
- `decoupage-ouest.geojson` (10-12 zones)

## Format GeoJSON requis

Chaque zone doit avoir les propriétés suivantes :

```json
{
  "type": "Feature",
  "properties": {
    "code_zone": "NE-01",           // Obligatoire : Code unique
    "nom_zone": "Ceyras - Centre",  // Obligatoire : Nom descriptif
    "commune": "Ceyras",            // Obligatoire : Nom de la commune
    "population_estimee": 280       // Obligatoire : Population estimée
  },
  "geometry": {
    "type": "Polygon",
    "coordinates": [...]            // Obligatoire : Coordonnées du polygone
  }
}
```

## Vérification avant import

Avant d'importer vos zones, vérifiez que :

1. ✅ Chaque zone a un `code_zone` unique
2. ✅ Les `code_zone` suivent la convention (NE-01, NO-01, etc.)
3. ✅ Chaque zone a une `population_estimee` > 0
4. ✅ La somme des populations correspond au total du secteur
5. ✅ Les polygones sont fermés (premier point = dernier point)
6. ✅ Le fichier est un GeoJSON valide

## Import dans Supabase

Une fois votre fichier créé, utilisez le script d'import :

```bash
node tools/import-zones-tournees.mjs --secteur nord-est
```

Ou pour importer tous les secteurs :

```bash
node tools/import-zones-tournees.mjs --all
```

## Exemple de fichier

Voir `EXEMPLE_ZONE.geojson` pour un exemple de structure.
