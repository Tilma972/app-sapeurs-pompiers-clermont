#!/usr/bin/env node
/**
 * Script d'import des zones de tournée dans Supabase
 *
 * Usage:
 *   node tools/import-zones-tournees.mjs --secteur nord-est
 *   node tools/import-zones-tournees.mjs --all
 *   node tools/import-zones-tournees.mjs --secteur nord-est --dry-run
 *
 * Options:
 *   --secteur {nom}  Import un secteur spécifique (nord-est, nord, sud, sud-est, ouest)
 *   --all            Import tous les secteurs disponibles
 *   --dry-run        Mode test sans insertion réelle en base
 *   --force          Force l'écrasement des zones existantes
 */

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const DOSSIER_ZONES = 'tools/data/zones-decoupees';

// Mapping des secteurs vers les équipes
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
  static debug(msg) { console.log(`🔍 ${msg}`); }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    secteur: null,
    all: false,
    dryRun: false,
    force: false
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--secteur':
        options.secteur = args[++i];
        break;
      case '--all':
        options.all = true;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--force':
        options.force = true;
        break;
      case '--help':
      case '-h':
        printUsage();
        process.exit(0);
      default:
        Logger.error(`Option inconnue: ${args[i]}`);
        printUsage();
        process.exit(1);
    }
  }

  return options;
}

function printUsage() {
  console.log(`
Usage: node tools/import-zones-tournees.mjs [options]

Options:
  --secteur {nom}   Import un secteur spécifique
                    Valeurs: nord-est, nord, sud, sud-est, ouest

  --all             Import tous les secteurs disponibles

  --dry-run         Mode test: valide les données sans les insérer

  --force           Force l'écrasement des zones existantes

  --help, -h        Affiche cette aide

Exemples:
  node tools/import-zones-tournees.mjs --secteur nord-est
  node tools/import-zones-tournees.mjs --secteur nord-est --dry-run
  node tools/import-zones-tournees.mjs --all
  node tools/import-zones-tournees.mjs --all --force
  `);
}

// ============================================================================
// VALIDATION
// ============================================================================

function validateEnv() {
  if (!SUPABASE_URL) {
    Logger.error('Variable d\'environnement NEXT_PUBLIC_SUPABASE_URL manquante');
    Logger.info('Créez un fichier .env.local avec vos credentials Supabase');
    process.exit(1);
  }

  if (!SUPABASE_SERVICE_KEY) {
    Logger.error('Variable d\'environnement SUPABASE_SERVICE_ROLE_KEY manquante');
    Logger.info('Cette clé est nécessaire pour contourner les RLS lors de l\'import');
    process.exit(1);
  }
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

  if (zone.geometry && zone.geometry.type !== 'Polygon') {
    errors.push(`Type de géométrie invalide: ${zone.geometry.type} (attendu: Polygon)`);
  }

  if (errors.length > 0) {
    Logger.error(`Zone ${index + 1} invalide: ${errors.join(', ')}`);
    return false;
  }

  return true;
}

// ============================================================================
// IMPORT
// ============================================================================

async function getEquipeId(supabase, secteurNom) {
  const { data, error } = await supabase
    .from('equipes')
    .select('id, nom, secteur')
    .eq('secteur', secteurNom)
    .single();

  if (error) {
    Logger.error(`Erreur lors de la récupération de l'équipe pour "${secteurNom}": ${error.message}`);
    return null;
  }

  if (!data) {
    Logger.error(`Aucune équipe trouvée pour le secteur "${secteurNom}"`);
    return null;
  }

  Logger.debug(`Équipe trouvée: ${data.nom} (${data.secteur})`);
  return data.id;
}

async function importZonesFromFile(supabase, fichier, secteurKey, options) {
  Logger.info(`\n📂 Import du fichier: ${fichier}`);

  // Lire le fichier GeoJSON
  const filePath = path.join(DOSSIER_ZONES, fichier);
  let geojson;

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    geojson = JSON.parse(content);
  } catch (error) {
    Logger.error(`Impossible de lire le fichier: ${error.message}`);
    return { success: 0, errors: 1 };
  }

  if (!geojson.features || !Array.isArray(geojson.features)) {
    Logger.error('Format GeoJSON invalide: "features" manquant ou invalide');
    return { success: 0, errors: 1 };
  }

  Logger.info(`${geojson.features.length} zone(s) trouvée(s)`);

  // Récupérer l'ID de l'équipe correspondante
  const secteurNom = SECTEUR_TO_EQUIPE[secteurKey];
  const equipeId = await getEquipeId(supabase, secteurNom);

  if (!equipeId) {
    Logger.error('Impossible de continuer sans équipe');
    return { success: 0, errors: geojson.features.length };
  }

  // Valider toutes les zones
  let validZones = [];
  let invalidCount = 0;

  for (let i = 0; i < geojson.features.length; i++) {
    const zone = geojson.features[i];
    if (validateZone(zone, i)) {
      validZones.push(zone);
    } else {
      invalidCount++;
    }
  }

  if (invalidCount > 0) {
    Logger.warn(`${invalidCount} zone(s) invalide(s) ignorée(s)`);
  }

  Logger.info(`${validZones.length} zone(s) valide(s) à importer`);

  // Statistiques
  let totalPopulation = 0;
  validZones.forEach(z => {
    totalPopulation += z.properties.population_estimee || 0;
  });

  Logger.info(`Population totale: ${totalPopulation} habitants`);
  Logger.info(`Moyenne par zone: ${Math.round(totalPopulation / validZones.length)} habitants`);

  if (options.dryRun) {
    Logger.warn('Mode DRY-RUN activé: aucune insertion en base');
    Logger.info('\nZones qui seraient importées:');
    validZones.forEach((z, i) => {
      console.log(`  ${i + 1}. ${z.properties.code_zone} - ${z.properties.nom_zone} (${z.properties.population_estimee} hab)`);
    });
    return { success: validZones.length, errors: invalidCount };
  }

  // Import en base de données
  let successCount = 0;
  let errorCount = invalidCount;

  for (const zone of validZones) {
    const zoneData = {
      equipe_id: equipeId,
      code_zone: zone.properties.code_zone,
      nom_zone: zone.properties.nom_zone,
      description: zone.properties.description || `Zone ${zone.properties.commune}`,
      geom: zone,
      population_estimee: zone.properties.population_estimee,
      annee: new Date().getFullYear(),
      statut: 'À faire'
    };

    // Vérifier si la zone existe déjà
    const { data: existing } = await supabase
      .from('zones_tournees')
      .select('id, code_zone')
      .eq('code_zone', zoneData.code_zone)
      .maybeSingle();

    if (existing && !options.force) {
      Logger.warn(`Zone ${zoneData.code_zone} existe déjà (utilisez --force pour écraser)`);
      errorCount++;
      continue;
    }

    // Insert ou update
    let result;
    if (existing && options.force) {
      // Update
      result = await supabase
        .from('zones_tournees')
        .update(zoneData)
        .eq('id', existing.id);

      if (result.error) {
        Logger.error(`Erreur mise à jour ${zoneData.code_zone}: ${result.error.message}`);
        errorCount++;
      } else {
        Logger.success(`✓ Mise à jour: ${zoneData.code_zone} - ${zoneData.nom_zone}`);
        successCount++;
      }
    } else {
      // Insert
      result = await supabase
        .from('zones_tournees')
        .insert(zoneData);

      if (result.error) {
        Logger.error(`Erreur insertion ${zoneData.code_zone}: ${result.error.message}`);
        errorCount++;
      } else {
        Logger.success(`✓ Importé: ${zoneData.code_zone} - ${zoneData.nom_zone} (${zoneData.population_estimee} hab)`);
        successCount++;
      }
    }
  }

  return { success: successCount, errors: errorCount };
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('\n🔥 Import des zones de tournée dans Supabase\n');

  const options = parseArgs();

  // Validation
  if (!options.all && !options.secteur) {
    Logger.error('Vous devez spécifier --secteur {nom} ou --all');
    printUsage();
    process.exit(1);
  }

  if (options.secteur && !SECTEUR_TO_EQUIPE[options.secteur]) {
    Logger.error(`Secteur invalide: ${options.secteur}`);
    Logger.info(`Secteurs disponibles: ${Object.keys(SECTEUR_TO_EQUIPE).join(', ')}`);
    process.exit(1);
  }

  validateEnv();

  // Connexion Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  Logger.success('Connecté à Supabase');

  // Lister les fichiers disponibles
  let fichiers = [];

  if (options.all) {
    // Tous les fichiers
    try {
      const allFiles = fs.readdirSync(DOSSIER_ZONES);
      fichiers = allFiles
        .filter(f => f.startsWith('decoupage-') && f.endsWith('.geojson'))
        .map(f => ({
          nom: f,
          secteur: f.replace('decoupage-', '').replace('.geojson', '')
        }));
    } catch (error) {
      Logger.error(`Impossible de lire le dossier ${DOSSIER_ZONES}: ${error.message}`);
      process.exit(1);
    }
  } else {
    // Un seul secteur
    const nom = `decoupage-${options.secteur}.geojson`;
    fichiers = [{ nom, secteur: options.secteur }];
  }

  if (fichiers.length === 0) {
    Logger.warn('Aucun fichier de découpage trouvé');
    Logger.info(`Créez vos fichiers dans: ${DOSSIER_ZONES}/decoupage-{secteur}.geojson`);
    process.exit(0);
  }

  Logger.info(`${fichiers.length} fichier(s) à traiter`);

  // Import
  let totalSuccess = 0;
  let totalErrors = 0;

  for (const fichier of fichiers) {
    const result = await importZonesFromFile(supabase, fichier.nom, fichier.secteur, options);
    totalSuccess += result.success;
    totalErrors += result.errors;
  }

  // Résumé final
  console.log('\n' + '='.repeat(60));
  Logger.info('Résumé de l\'import:');
  Logger.success(`${totalSuccess} zone(s) importée(s) avec succès`);
  if (totalErrors > 0) {
    Logger.error(`${totalErrors} erreur(s)`);
  }
  console.log('='.repeat(60) + '\n');

  if (options.dryRun) {
    Logger.warn('Mode DRY-RUN: aucune modification en base de données');
    Logger.info('Relancez sans --dry-run pour importer réellement');
  }

  process.exit(totalErrors > 0 ? 1 : 0);
}

// ============================================================================
// EXECUTION
// ============================================================================

main().catch(error => {
  Logger.error(`Erreur fatale: ${error.message}`);
  console.error(error);
  process.exit(1);
});
