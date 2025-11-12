#!/usr/bin/env node

/**
 * Backup Supabase PostgreSQL Database to Minio
 * 
 * Ce script :
 * 1. Se connecte à Supabase via l'URL de connexion PostgreSQL
 * 2. Fait un dump complet de la base de données (structure + données)
 * 3. Compresse le dump en .gz
 * 4. Upload vers Minio S3
 * 5. Nettoie les fichiers temporaires
 * 6. Garde les 30 derniers backups (rotation automatique)
 */

// Charger les variables d'environnement depuis .env
require('dotenv').config();

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const execPromise = promisify(exec);

// Configuration
const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;
const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT; // https://console.s3.dsolution-ia.fr
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY;
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY;
const MINIO_BUCKET = process.env.MINIO_BUCKET || 'supabase-backups';
const RETENTION_DAYS = 30;

// Initialiser le client S3 (Minio est compatible S3)
const s3Client = new S3Client({
  endpoint: MINIO_ENDPOINT,
  region: 'us-east-1', // Minio n'utilise pas vraiment les régions, mais AWS SDK le demande
  credentials: {
    accessKeyId: MINIO_ACCESS_KEY,
    secretAccessKey: MINIO_SECRET_KEY,
  },
  forcePathStyle: true, // Important pour Minio
});

async function checkDependencies() {
  console.log('🔍 Vérification des dépendances...');
  
  const isWindows = process.platform === 'win32';
  
  try {
    await execPromise('pg_dump --version');
    console.log('✅ pg_dump disponible');
  } catch (error) {
    if (isWindows) {
      console.error('❌ pg_dump non trouvé sur Windows');
      console.error('');
      console.error('📥 Installation requise:');
      console.error('   1. Télécharge PostgreSQL: https://www.postgresql.org/download/windows/');
      console.error('   2. Installe les outils client');
      console.error('   3. Ajoute au PATH: C:\\Program Files\\PostgreSQL\\16\\bin');
      console.error('');
      console.error('OU via Chocolatey:');
      console.error('   choco install postgresql');
      console.error('');
      throw new Error('pg_dump non disponible. Installation requise (voir ci-dessus)');
    } else {
      console.error('❌ pg_dump non trouvé. Installation...');
      await execPromise('sudo apt-get update && sudo apt-get install -y postgresql-client');
    }
  }

  try {
    if (isWindows) {
      // Sur Windows, utiliser PowerShell pour compresser (ou 7zip si disponible)
      console.log('✅ Compression disponible (PowerShell)');
    } else {
      await execPromise('gzip --version');
      console.log('✅ gzip disponible');
    }
  } catch (error) {
    if (!isWindows) {
      console.error('❌ gzip non trouvé');
      throw new Error('gzip est requis pour la compression');
    }
  }
}

async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `database_backup_${timestamp}.sql`;
  const gzFilename = `${filename}.gz`;
  
  // Windows compatible: utiliser le répertoire temp de l'OS
  const isWindows = process.platform === 'win32';
  const tmpDir = isWindows ? process.env.TEMP || 'C:\\temp' : '/tmp';
  
  // Créer le répertoire temp s'il n'existe pas
  if (!require('fs').existsSync(tmpDir)) {
    require('fs').mkdirSync(tmpDir, { recursive: true });
  }
  
  const backupPath = path.join(tmpDir, filename);
  const gzPath = path.join(tmpDir, gzFilename);

  console.log(`📦 Création du backup: ${filename}`);

  try {
    // Dump PostgreSQL
    console.log('🗄️  Dump PostgreSQL en cours...');
    const dumpCommand = `pg_dump "${SUPABASE_DB_URL}" --no-owner --no-acl -F p -f "${backupPath}"`;
    await execPromise(dumpCommand);
    console.log('✅ Dump PostgreSQL terminé');

    // Vérifier la taille du dump
    const stats = await fs.stat(backupPath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📊 Taille du dump: ${sizeMB} MB`);

    // Compression
    console.log('🗜️  Compression en cours...');
    if (isWindows) {
      // Sur Windows, utiliser PowerShell pour compresser
      const psCommand = `Compress-Archive -Path "${backupPath}" -DestinationPath "${backupPath}.zip" -CompressionLevel Optimal`;
      await execPromise(`powershell -Command "${psCommand}"`);
      // Renommer .zip en .gz pour uniformité
      await fs.rename(`${backupPath}.zip`, gzPath);
      await fs.unlink(backupPath); // Supprimer le .sql non compressé
    } else {
      await execPromise(`gzip -9 "${backupPath}"`);
    }
    
    const gzStats = await fs.stat(gzPath);
    const gzSizeMB = (gzStats.size / (1024 * 1024)).toFixed(2);
    const compressionRatio = ((1 - gzStats.size / stats.size) * 100).toFixed(1);
    console.log(`✅ Compression terminée: ${gzSizeMB} MB (${compressionRatio}% de compression)`);

    return { gzPath, gzFilename, gzSizeMB };
  } catch (error) {
    console.error('❌ Erreur lors du backup:', error.message);
    
    // Nettoyage en cas d'erreur
    try {
      await fs.unlink(backupPath).catch(() => {});
      await fs.unlink(gzPath).catch(() => {});
    } catch {}
    
    throw error;
  }
}

async function uploadToMinio(filePath, filename) {
  console.log(`☁️  Upload vers Minio: ${filename}`);

  try {
    const fileContent = await fs.readFile(filePath);
    
    const command = new PutObjectCommand({
      Bucket: MINIO_BUCKET,
      Key: `database/${filename}`,
      Body: fileContent,
      ContentType: 'application/gzip',
      Metadata: {
        'backup-date': new Date().toISOString(),
        'backup-type': 'postgresql-full',
        'source': 'github-actions',
      },
    });

    await s3Client.send(command);
    console.log(`✅ Upload réussi: database/${filename}`);
  } catch (error) {
    console.error('❌ Erreur upload Minio:', error.message);
    throw error;
  }
}

async function cleanupOldBackups() {
  console.log(`🧹 Nettoyage des backups > ${RETENTION_DAYS} jours...`);

  try {
    const listCommand = new ListObjectsV2Command({
      Bucket: MINIO_BUCKET,
      Prefix: 'database/',
    });

    const { Contents } = await s3Client.send(listCommand);
    
    if (!Contents || Contents.length === 0) {
      console.log('ℹ️  Aucun backup à nettoyer');
      return;
    }

    const now = new Date();
    const retentionMs = RETENTION_DAYS * 24 * 60 * 60 * 1000;

    let deletedCount = 0;
    for (const object of Contents) {
      const age = now - new Date(object.LastModified);
      if (age > retentionMs) {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: MINIO_BUCKET,
          Key: object.Key,
        });
        await s3Client.send(deleteCommand);
        console.log(`🗑️  Supprimé: ${object.Key} (${Math.floor(age / (24 * 60 * 60 * 1000))} jours)`);
        deletedCount++;
      }
    }

    if (deletedCount === 0) {
      console.log(`✅ Tous les backups sont récents (< ${RETENTION_DAYS} jours)`);
    } else {
      console.log(`✅ ${deletedCount} ancien(s) backup(s) supprimé(s)`);
    }
  } catch (error) {
    console.error('⚠️  Erreur lors du nettoyage:', error.message);
    // Non bloquant, on continue même si le nettoyage échoue
  }
}

async function cleanup(filePath) {
  try {
    await fs.unlink(filePath);
    console.log('🗑️  Fichier temporaire supprimé');
  } catch (error) {
    console.warn('⚠️  Impossible de supprimer le fichier temporaire:', error.message);
  }
}

async function main() {
  console.log('🚀 Démarrage du backup Supabase → Minio');
  console.log(`📅 Date: ${new Date().toISOString()}`);
  console.log(`🎯 Destination: ${MINIO_BUCKET}`);
  console.log('');

  const startTime = Date.now();

  try {
    // Vérifier les variables d'environnement
    if (!SUPABASE_DB_URL) throw new Error('SUPABASE_DB_URL non défini');
    if (!MINIO_ENDPOINT) throw new Error('MINIO_ENDPOINT non défini');
    if (!MINIO_ACCESS_KEY) throw new Error('MINIO_ACCESS_KEY non défini');
    if (!MINIO_SECRET_KEY) throw new Error('MINIO_SECRET_KEY non défini');

    // 1. Vérifier les dépendances
    await checkDependencies();

    // 2. Créer le backup
    const { gzPath, gzFilename, gzSizeMB } = await createBackup();

    // 3. Upload vers Minio
    await uploadToMinio(gzPath, gzFilename);

    // 4. Nettoyage des anciens backups
    await cleanupOldBackups();

    // 5. Suppression du fichier temporaire
    await cleanup(gzPath);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('');
    console.log('✅ BACKUP RÉUSSI');
    console.log(`⏱️  Durée totale: ${duration}s`);
    console.log(`📦 Fichier: ${gzFilename} (${gzSizeMB} MB)`);
    console.log(`🔗 Emplacement: ${MINIO_BUCKET}/database/${gzFilename}`);
    
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ BACKUP ÉCHOUÉ');
    console.error('Erreur:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Exécution
main();
