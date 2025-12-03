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

/**
 * Valide et corrige l'URL de connexion Supabase pour pg_dump
 * 
 * Supabase supporte 3 types de connexion:
 * - Direct connection (db.xxx.supabase.co:5432) - IPv6 only
 * - Session pooler (aws-x-region.pooler.supabase.com:5432) - IPv4 ✅ Compatible pg_dump
 * - Transaction pooler (aws-x-region.pooler.supabase.com:6543) - IPv4 ❌ NON compatible
 * 
 * Format attendu (Session Pooler):
 * postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-eu-north-1.pooler.supabase.com:5432/postgres
 */
function fixSupabaseUrl(url) {
  if (!url) return url;

  console.log('🔍 Vérification de l\'URL de connexion PostgreSQL...');

  // Vérifier si on utilise le pooler en mode Transaction (port 6543)
  if (url.includes(':6543')) {
    console.log('⚠️  Détection du Transaction Pooler Supabase (port 6543)');
    console.log('   Ce mode ne fonctionne pas avec pg_dump');

    // Remplacer par le port Session Pooler
    const fixedUrl = url.replace(':6543', ':5432');
    console.log('✅ Conversion automatique vers Session Pooler (port 5432)');
    console.log('');

    return fixedUrl;
  }

  // Vérifier le format du username (postgres.PROJECT_REF vs postgres:PASSWORD)
  const urlMatch = url.match(/postgresql:\/\/([^:@]+)/);
  if (urlMatch) {
    const username = urlMatch[1];
    
    if (username === 'postgres' && url.includes('pooler.supabase.com')) {
      console.log('⚠️  Format ancien détecté (postgres:PASSWORD)');
      console.log('   Le nouveau format Supabase utilise postgres.[PROJECT-REF]');
      console.log('');
      console.log('💡 SOLUTION:');
      console.log('   1. Va sur Supabase Dashboard → Clique "Connect"');
      console.log('   2. Sélectionne "Session pooler" (port 5432)');
      console.log('   3. Copie l\'URL complète');
      console.log('');
    } else if (username.startsWith('postgres.')) {
      console.log('✅ Format Session Pooler correct (postgres.[PROJECT-REF])');
    }
  }

  // Vérifier si on utilise bien le port 5432
  if (url.includes(':5432')) {
    console.log('✅ Utilisation du port 5432 (Session Pooler compatible)');
    console.log('');
  } else {
    console.log('ℹ️  Port de connexion non standard détecté');
    console.log('');
  }

  return url;
}

/**
 * Teste la connexion PostgreSQL avant le backup
 */
async function testConnection(dbUrl) {
  console.log('🔌 Test de connexion à PostgreSQL...');

  try {
    // Test simple avec psql
    const testCommand = `psql "${dbUrl}" -c "SELECT version();" -t`;
    const { stdout } = await execPromise(testCommand);

    console.log('✅ Connexion réussie');
    console.log(`   PostgreSQL: ${stdout.trim().substring(0, 80)}...`);
    console.log('');
    return true;
  } catch (error) {
    console.error('❌ Échec de connexion à PostgreSQL');
    console.error('');

    // Messages d'erreur détaillés selon le type d'erreur
    if (error.message.includes('Tenant or user not found')) {
      console.error('💡 SOLUTION:');
      console.error('   1. Vérifiez que vous utilisez la bonne URL de connexion');
      console.error('   2. Dans Supabase Dashboard → Settings → Database');
      console.error('   3. Utilisez "Direct connection" (port 5432) ou "Session mode"');
      console.error('   4. PAS le "Transaction mode" (port 6543)');
      console.error('');
      console.error('   Format attendu:');
      console.error('   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-eu-west-3.pooler.supabase.com:5432/postgres');
      console.error('');
    } else if (error.message.includes('password authentication failed')) {
      console.error('💡 SOLUTION:');
      console.error('   Le mot de passe est incorrect. Vérifiez votre SUPABASE_DB_URL');
      console.error('');
    } else if (error.message.includes('could not translate host name')) {
      console.error('💡 SOLUTION:');
      console.error('   L\'URL est mal formée. Vérifiez le format de SUPABASE_DB_URL');
      console.error('');
    } else {
      console.error(`   Erreur: ${error.message}`);
      console.error('');
    }

    throw new Error('Connexion PostgreSQL impossible. Vérifiez SUPABASE_DB_URL');
  }
}

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
      console.error('❌ Outils PostgreSQL non trouvés. Installation...');
      await execPromise('apt-get update && apt-get install -y postgresql-client');
      console.log('✅ PostgreSQL client installé');
    }
  }

  try {
    await execPromise('psql --version');
    console.log('✅ psql disponible');
  } catch (error) {
    // psql est normalement installé avec pg_dump via postgresql-client
    console.error('❌ psql non trouvé');
    throw new Error('psql est requis pour tester la connexion');
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

async function createBackup(dbUrl) {
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
    const dumpCommand = `pg_dump "${dbUrl}" --no-owner --no-acl -F p -f "${backupPath}"`;
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

    // 1. Corriger l'URL Supabase si nécessaire (port 6543 → 5432)
    const fixedDbUrl = fixSupabaseUrl(SUPABASE_DB_URL);

    // 2. Vérifier les dépendances
    await checkDependencies();

    // 3. Tester la connexion PostgreSQL
    await testConnection(fixedDbUrl);

    // 4. Créer le backup
    const { gzPath, gzFilename, gzSizeMB } = await createBackup(fixedDbUrl);

    // 5. Upload vers Minio
    await uploadToMinio(gzPath, gzFilename);

    // 6. Nettoyage des anciens backups
    await cleanupOldBackups();

    // 7. Suppression du fichier temporaire
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
