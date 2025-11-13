#!/usr/bin/env node

/**
 * Restore Supabase Database from Minio Backup
 * 
 * ⚠️ ATTENTION: Ce script va ÉCRASER la base de données actuelle!
 * 
 * Usage:
 *   node restore-database.js                    # Restaure le dernier backup
 *   node restore-database.js 2025-11-12T03-00   # Restaure un backup spécifique
 * 
 * Ce script :
 * 1. Liste les backups disponibles sur Minio
 * 2. Télécharge le backup choisi
 * 3. Décompresse le fichier .gz
 * 4. Restaure vers Supabase avec psql
 * 5. Nettoie les fichiers temporaires
 */

// Charger les variables d'environnement depuis .env
require('dotenv').config();

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const readline = require('readline');

const execPromise = promisify(exec);

// Configuration
const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;
const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT;
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY;
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY;
const MINIO_BUCKET = process.env.MINIO_BUCKET || 'supabase-backups';

// Initialiser le client S3
const s3Client = new S3Client({
  endpoint: MINIO_ENDPOINT,
  region: 'us-east-1',
  credentials: {
    accessKeyId: MINIO_ACCESS_KEY,
    secretAccessKey: MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
});

async function listBackups() {
  console.log('📋 Liste des backups disponibles sur Minio...\n');

  const command = new ListObjectsV2Command({
    Bucket: MINIO_BUCKET,
    Prefix: 'database/',
  });

  const { Contents } = await s3Client.send(command);

  if (!Contents || Contents.length === 0) {
    console.log('❌ Aucun backup trouvé');
    process.exit(1);
  }

  // Trier par date (plus récent en premier)
  const backups = Contents
    .filter((obj) => obj.Key.endsWith('.sql.gz'))
    .sort((a, b) => new Date(b.LastModified) - new Date(a.LastModified))
    .map((obj, index) => {
      const sizeMB = (obj.Size / (1024 * 1024)).toFixed(2);
      const date = new Date(obj.LastModified).toLocaleString('fr-FR');
      const filename = obj.Key.split('/').pop();
      
      return {
        index: index + 1,
        key: obj.Key,
        filename,
        date,
        size: sizeMB,
      };
    });

  console.log('Backups disponibles:');
  console.log('───────────────────────────────────────────────────────────');
  backups.forEach((backup) => {
    console.log(`${backup.index}. ${backup.filename}`);
    console.log(`   📅 Date: ${backup.date}`);
    console.log(`   📦 Taille: ${backup.size} MB`);
    console.log('');
  });

  return backups;
}

async function askConfirmation(message) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${message} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

async function downloadBackup(backupKey) {
  const filename = backupKey.split('/').pop();
  const tmpDir = '/tmp';
  const downloadPath = path.join(tmpDir, filename);

  console.log(`\n📥 Téléchargement du backup: ${filename}`);

  const command = new GetObjectCommand({
    Bucket: MINIO_BUCKET,
    Key: backupKey,
  });

  const { Body } = await s3Client.send(command);
  
  // Convertir le stream en buffer
  const chunks = [];
  for await (const chunk of Body) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);

  await fs.writeFile(downloadPath, buffer);

  const stats = await fs.stat(downloadPath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`✅ Téléchargement terminé: ${sizeMB} MB`);

  return downloadPath;
}

async function decompressBackup(gzPath) {
  const sqlPath = gzPath.replace('.gz', '');
  
  console.log(`\n🗜️  Décompression: ${path.basename(gzPath)}`);
  
  await execPromise(`gunzip -c "${gzPath}" > "${sqlPath}"`);
  
  const stats = await fs.stat(sqlPath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`✅ Décompression terminée: ${sizeMB} MB`);

  return sqlPath;
}

async function restoreDatabase(sqlPath) {
  console.log(`\n🗄️  Restauration de la base de données...`);
  console.log(`⚠️  ATTENTION: Cela va ÉCRASER toutes les données actuelles!`);

  const confirmed = await askConfirmation('\nConfirmez-vous la restauration?');
  
  if (!confirmed) {
    console.log('❌ Restauration annulée par l\'utilisateur');
    process.exit(0);
  }

  try {
    // Restauration avec psql
    const restoreCommand = `psql "${SUPABASE_DB_URL}" -f "${sqlPath}" --quiet`;
    
    console.log('🔄 Restauration en cours (cela peut prendre plusieurs minutes)...');
    await execPromise(restoreCommand);
    
    console.log('✅ Restauration terminée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la restauration:', error.message);
    throw error;
  }
}

async function cleanup(...filePaths) {
  console.log('\n🗑️  Nettoyage des fichiers temporaires...');
  
  for (const filePath of filePaths) {
    try {
      await fs.unlink(filePath);
      console.log(`✅ Supprimé: ${path.basename(filePath)}`);
    } catch (error) {
      console.warn(`⚠️  Impossible de supprimer ${path.basename(filePath)}`);
    }
  }
}

async function main() {
  console.log('🔄 RESTAURATION BASE DE DONNÉES SUPABASE DEPUIS MINIO');
  console.log('═══════════════════════════════════════════════════════\n');

  const startTime = Date.now();

  try {
    // Vérifier les variables d'environnement
    if (!SUPABASE_DB_URL) throw new Error('SUPABASE_DB_URL non défini');
    if (!MINIO_ENDPOINT) throw new Error('MINIO_ENDPOINT non défini');
    if (!MINIO_ACCESS_KEY) throw new Error('MINIO_ACCESS_KEY non défini');
    if (!MINIO_SECRET_KEY) throw new Error('MINIO_SECRET_KEY non défini');

    // 1. Lister les backups disponibles
    const backups = await listBackups();

    // 2. Déterminer quel backup restaurer
    let selectedBackup;
    const arg = process.argv[2];

    if (arg) {
      // Backup spécifié en argument
      selectedBackup = backups.find((b) => b.filename.includes(arg));
      if (!selectedBackup) {
        console.error(`❌ Backup introuvable: ${arg}`);
        process.exit(1);
      }
    } else {
      // Prendre le plus récent par défaut
      selectedBackup = backups[0];
      console.log(`ℹ️  Sélection automatique du backup le plus récent`);
    }

    console.log(`\n✅ Backup sélectionné: ${selectedBackup.filename}`);
    console.log(`   📅 Date: ${selectedBackup.date}`);
    console.log(`   📦 Taille: ${selectedBackup.size} MB\n`);

    // 3. Télécharger le backup
    const gzPath = await downloadBackup(selectedBackup.key);

    // 4. Décompresser
    const sqlPath = await decompressBackup(gzPath);

    // 5. Restaurer (avec confirmation)
    await restoreDatabase(sqlPath);

    // 6. Nettoyer
    await cleanup(gzPath, sqlPath);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ RESTAURATION RÉUSSIE');
    console.log(`⏱️  Durée totale: ${duration}s`);
    console.log(`📂 Backup restauré: ${selectedBackup.filename}`);
    console.log('═══════════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ RESTAURATION ÉCHOUÉE');
    console.error('Erreur:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Exécution
main();
