#!/usr/bin/env node
/**
 * Script de conversion GeoJSON → Migration SQL
 *
 * Convertit un fichier GeoJSON de zones découpées en migration SQL
 * prête à être exécutée dans Supabase.
 *
 * Usage:
 *   node tools/geojson-to-sql.mjs decoupage-nord-est.geojson
 *   node tools/geojson-to-sql.mjs decoupage-nord-est.geojson --output custom-name.sql
 *
 * Options:
 *   --output, -o    Nom du fichier SQL de sortie (optionnel)
 *   --help, -h      Affiche l'aide
 */

import fs from 'node:fs';
import path from 'node:path';

// ============================================================================
// CONFIGURATION
// ============================================================================

const DOSSIER_ENTREE = 'tools/data/zones-decoupees';
const DOSSIER_SORTIE = 'supabase/migrations';

// Mapping secteur → équipe (doit correspondre à la colonne 'secteur' de la table equipes)
const SECTEUR_TO_EQUIPE = {
  'nord-est': 'Secteur Nord-Est',
  'nord': 'Secteur Nord',
  'sud': 'Secteur Sud',
  'sud-est': 'Secteur Sud-Est',
  'ouest': 'Secteur Ouest'
};

// ============================================================================
// UTILITAIRES
// ============================================================================

class Logger {
  static info(msg) { console.log(`ℹ️  ${msg}`); }
  static success(msg) { console.log(`✅ ${msg}`); }
  static error(msg) { console.error(`❌ ${msg}`); }
  static warn(msg) { console.warn(`⚠️  ${msg}`); }
}

function printUsage() {
  console.log(`
Usage: node tools/geojson-to-sql.mjs <fichier.geojson> [options]

Arguments:
  <fichier.geojson>   Fichier GeoJSON à convertir (avec ou sans chemin)

Options:
  --output, -o <nom>  Nom du fichier SQL de sortie (optionnel)
                      Par défaut: généré automatiquement

  --help, -h          Affiche cette aide

Exemples:
  # Convertir avec nom auto-généré
  node tools/geojson-to-sql.mjs decoupage-nord-est.geojson

  # Convertir avec nom personnalisé
  node tools/geojson-to-sql.mjs decoupage-nord-est.geojson -o import_ne.sql

  # Avec chemin complet
  node tools/geojson-to-sql.mjs tools/data/zones-decoupees/decoupage-nord-est.geojson

Le fichier SQL sera créé dans: supabase/migrations/
  `);
}

function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  const options = {
    fichierEntree: null,
    fichierSortie: null
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg === '--output' || arg === '-o') {
      options.fichierSortie = args[++i];
    } else if (!arg.startsWith('--')) {
      options.fichierEntree = arg;
    } else {
      Logger.error(`Option inconnue: ${arg}`);
      printUsage();
      process.exit(1);
    }
    i++;
  }

  if (!options.fichierEntree) {
    Logger.error('Fichier GeoJSON requis');
    printUsage();
    process.exit(1);
  }

  return options;
}

function detectSecteur(nomFichier) {
  const match = nomFichier.match(/decoupage-(.+)\.geojson$/);
  if (match) {
    return match[1];
  }
  return null;
}

function generateOutputFilename(secteur) {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const secteurSlug = secteur.replace(/[^a-z0-9]/g, '_');
  return `${date}_import_zones_${secteurSlug}.sql`;
}

function validateZone(zone, index) {
  const errors = [];

  if (!zone.properties) {
    errors.push('Propriétés manquantes');
  } else {
    if (!zone.properties.code_zone) {
      errors.push('code_zone manquant');
    }
    if (!zone.properties.nom_zone) {
      errors.push('nom_zone manquant');
    }
    if (!zone.properties.commune) {
      errors.push('commune manquante');
    }
    if (!zone.properties.population_estimee || zone.properties.population_estimee <= 0) {
      errors.push('population_estimee manquante ou invalide');
    }
  }

  if (!zone.geometry || !zone.geometry.coordinates) {
    errors.push('Géométrie invalide');
  }

  if (zone.geometry && zone.geometry.type !== 'Polygon' && zone.geometry.type !== 'MultiPolygon') {
    errors.push(`Type de géométrie invalide: ${zone.geometry.type}`);
  }

  return errors;
}

function escapeString(str) {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

// ============================================================================
// GÉNÉRATION SQL
// ============================================================================

function generateSQL(geojson, secteur, secteurNom) {
  const annee = new Date().getFullYear();
  const date = new Date().toISOString().split('T')[0];

  let sql = `-- Migration: Import des zones de tournée - ${secteurNom}
-- Date: ${date}
-- Description: Import automatique des ${geojson.features.length} zones de tournée du secteur ${secteurNom}

-- ============================================================================
-- IMPORT DES ZONES DE TOURNÉE - ${secteurNom.toUpperCase()}
-- ============================================================================

-- Récupération de l'ID de l'équipe
DO $$
DECLARE
  v_equipe_id UUID;
  v_zone_count INTEGER := 0;
BEGIN
  -- Récupérer l'ID de l'équipe pour le secteur "${secteurNom}"
  SELECT id INTO v_equipe_id
  FROM public.equipes
  WHERE secteur = '${secteurNom}';

  IF v_equipe_id IS NULL THEN
    RAISE EXCEPTION 'Équipe non trouvée pour le secteur "${secteurNom}". Vérifiez que l''équipe existe dans la table equipes.';
  END IF;

  RAISE NOTICE 'Équipe trouvée: % (secteur: ${secteurNom})', v_equipe_id;

  -- Import des zones
`;

  // Générer les INSERT pour chaque zone
  geojson.features.forEach((zone, index) => {
    const props = zone.properties;
    const codeZone = escapeString(props.code_zone);
    const nomZone = escapeString(props.nom_zone);
    const commune = escapeString(props.commune);
    const description = escapeString(props.description || `Zone ${commune}`);
    const population = props.population_estimee || 0;

    // Convertir la zone en GeoJSON string (échapper les quotes)
    const geomJson = JSON.stringify(zone).replace(/'/g, "''");

    sql += `
  -- Zone ${index + 1}/${geojson.features.length}: ${props.code_zone} - ${props.nom_zone}
  INSERT INTO public.zones_tournees (
    equipe_id,
    code_zone,
    nom_zone,
    description,
    geom,
    population_estimee,
    annee,
    statut
  ) VALUES (
    v_equipe_id,
    '${codeZone}',
    '${nomZone}',
    '${description}',
    '${geomJson}'::jsonb,
    ${population},
    ${annee},
    'À faire'
  )
  ON CONFLICT (code_zone) DO UPDATE SET
    nom_zone = EXCLUDED.nom_zone,
    description = EXCLUDED.description,
    geom = EXCLUDED.geom,
    population_estimee = EXCLUDED.population_estimee,
    updated_at = NOW();

  v_zone_count := v_zone_count + 1;
`;
  });

  // Statistiques finales
  const totalPopulation = geojson.features.reduce((sum, z) => sum + (z.properties.population_estimee || 0), 0);
  const moyennePopulation = Math.round(totalPopulation / geojson.features.length);
  const totalCalendriers = Math.round(totalPopulation / 6.5);

  sql += `
  RAISE NOTICE '✅ Import terminé: % zones importées', v_zone_count;
  RAISE NOTICE '📊 Population totale: ${totalPopulation} habitants';
  RAISE NOTICE '📊 Moyenne par zone: ${moyennePopulation} habitants';
  RAISE NOTICE '📊 Calendriers estimés: ${totalCalendriers} calendriers (~40 par zone)';

END $$;

-- ============================================================================
-- VÉRIFICATION POST-IMPORT
-- ============================================================================

-- Affichage des zones importées
SELECT
  code_zone,
  nom_zone,
  population_estimee,
  nb_foyers_estimes,
  nb_calendriers_alloues,
  statut
FROM public.zones_tournees
WHERE equipe_id = (SELECT id FROM public.equipes WHERE secteur = '${secteurNom}')
ORDER BY code_zone;

-- Statistiques du secteur
SELECT * FROM public.get_equipe_zones_stats(
  (SELECT id FROM public.equipes WHERE secteur = '${secteurNom}'),
  ${annee}
);

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
`;

  return sql;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('\n🔥 Conversion GeoJSON → Migration SQL\n');

  const options = parseArgs();

  // Résoudre le chemin du fichier d'entrée
  let cheminEntree = options.fichierEntree;
  if (!path.isAbsolute(cheminEntree)) {
    // Essayer d'abord dans le dossier zones-decoupees
    const cheminDansZones = path.join(DOSSIER_ENTREE, path.basename(cheminEntree));
    if (fs.existsSync(cheminDansZones)) {
      cheminEntree = cheminDansZones;
    } else if (!fs.existsSync(cheminEntree)) {
      Logger.error(`Fichier introuvable: ${cheminEntree}`);
      Logger.info(`Vérifiez que le fichier existe dans ${DOSSIER_ENTREE}/ ou donnez le chemin complet`);
      process.exit(1);
    }
  }

  Logger.info(`Lecture du fichier: ${cheminEntree}`);

  // Lire et parser le GeoJSON
  let geojson;
  try {
    const content = fs.readFileSync(cheminEntree, 'utf-8');
    geojson = JSON.parse(content);
  } catch (error) {
    Logger.error(`Impossible de lire le fichier: ${error.message}`);
    process.exit(1);
  }

  // Valider le format GeoJSON
  if (!geojson.features || !Array.isArray(geojson.features)) {
    Logger.error('Format GeoJSON invalide: "features" manquant ou invalide');
    process.exit(1);
  }

  Logger.success(`${geojson.features.length} zone(s) trouvée(s)`);

  // Détecter le secteur
  const nomFichier = path.basename(cheminEntree);
  const secteur = detectSecteur(nomFichier);

  if (!secteur) {
    Logger.error(`Impossible de détecter le secteur depuis le nom de fichier: ${nomFichier}`);
    Logger.info('Le fichier doit être nommé: decoupage-{secteur}.geojson');
    Logger.info('Exemples: decoupage-nord-est.geojson, decoupage-sud.geojson');
    process.exit(1);
  }

  const secteurNom = SECTEUR_TO_EQUIPE[secteur];
  if (!secteurNom) {
    Logger.error(`Secteur inconnu: ${secteur}`);
    Logger.info(`Secteurs supportés: ${Object.keys(SECTEUR_TO_EQUIPE).join(', ')}`);
    process.exit(1);
  }

  Logger.success(`Secteur détecté: ${secteurNom}`);

  // Valider toutes les zones
  Logger.info('Validation des zones...');
  let validCount = 0;
  let invalidCount = 0;
  const codesZones = new Set();

  geojson.features.forEach((zone, index) => {
    const errors = validateZone(zone, index);

    if (errors.length > 0) {
      Logger.error(`Zone ${index + 1} invalide: ${errors.join(', ')}`);
      if (zone.properties?.code_zone) {
        Logger.error(`  Code: ${zone.properties.code_zone}`);
      }
      invalidCount++;
    } else {
      validCount++;

      // Vérifier les doublons de code_zone
      if (codesZones.has(zone.properties.code_zone)) {
        Logger.warn(`Code zone dupliqué: ${zone.properties.code_zone}`);
      }
      codesZones.add(zone.properties.code_zone);
    }
  });

  if (invalidCount > 0) {
    Logger.error(`${invalidCount} zone(s) invalide(s) trouvée(s)`);
    Logger.info('Corrigez les erreurs avant de continuer');
    process.exit(1);
  }

  Logger.success(`${validCount} zone(s) valide(s)`);

  // Statistiques
  const totalPopulation = geojson.features.reduce((sum, z) => sum + (z.properties.population_estimee || 0), 0);
  const moyennePopulation = Math.round(totalPopulation / geojson.features.length);

  console.log('\n📊 Statistiques:');
  console.log(`   Population totale: ${totalPopulation} habitants`);
  console.log(`   Moyenne par zone: ${moyennePopulation} habitants`);
  console.log(`   Calendriers estimés: ${Math.round(totalPopulation / 6.5)} (~40 par zone)`);

  // Générer le SQL
  Logger.info('\nGénération du SQL...');
  const sql = generateSQL(geojson, secteur, secteurNom);

  // Générer le nom du fichier de sortie
  let nomFichierSortie = options.fichierSortie;
  if (!nomFichierSortie) {
    nomFichierSortie = generateOutputFilename(secteur);
  }

  const cheminSortie = path.join(DOSSIER_SORTIE, nomFichierSortie);

  // Vérifier si le fichier existe déjà
  if (fs.existsSync(cheminSortie)) {
    Logger.warn(`Le fichier existe déjà: ${cheminSortie}`);
    Logger.warn('Il sera écrasé...');
  }

  // Écrire le fichier SQL
  try {
    fs.writeFileSync(cheminSortie, sql, 'utf-8');
    Logger.success(`Fichier SQL créé: ${cheminSortie}`);
  } catch (error) {
    Logger.error(`Impossible d'écrire le fichier: ${error.message}`);
    process.exit(1);
  }

  // Instructions finales
  console.log('\n' + '='.repeat(60));
  Logger.success('Conversion terminée avec succès !');
  console.log('='.repeat(60));
  console.log('\n📋 Prochaines étapes:\n');
  console.log('1. Ouvrez Supabase SQL Editor');
  console.log('2. Copiez le contenu de:', cheminSortie);
  console.log('3. Collez et exécutez le SQL');
  console.log('4. Vérifiez que les zones sont importées\n');

  console.log('🔍 Pour vérifier l\'import:');
  console.log(`   SELECT * FROM zones_tournees_enrichies`);
  console.log(`   WHERE equipe_secteur = '${secteurNom}'`);
  console.log(`   ORDER BY code_zone;\n`);

  process.exit(0);
}

// ============================================================================
// EXECUTION
// ============================================================================

main().catch(error => {
  Logger.error(`Erreur fatale: ${error.message}`);
  console.error(error);
  process.exit(1);
});
