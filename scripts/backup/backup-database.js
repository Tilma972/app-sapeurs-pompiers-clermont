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
 * Masque le mot de passe dans une URL pour les logs
 */
function maskPassword(url) {
  return url.replace(/:[^:@]+@/, ':****@');
}

/**
 * Extrait les informations de l'URL de connexion pour debug
 */
function parseDbUrl(url) {
  try {
    const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (match) {
      return {
        user: match[1],
        host: match[3],
        port: match[4],
        database: match[5],
      };
    }
  } catch {}
  return null;
}

/**
 * Teste la connexion PostgreSQL avant le backup
 */
async function testConnection(dbUrl) {
  console.log('🔌 Test de connexion à PostgreSQL...');
  
  // Afficher les infos de connexion (sans mot de passe)
  const urlInfo = parseDbUrl(dbUrl);
  if (urlInfo) {
    console.log(`   User: ${urlInfo.user}`);
    console.log(`   Host: ${urlInfo.host}`);
    console.log(`   Port: ${urlInfo.port}`);
    console.log(`   Database: ${urlInfo.database}`);
  }
  console.log('');

  try {
    // Test simple avec psql
    const testCommand = `psql "${dbUrl}" -c "SELECT version();" -t`;
    const { stdout, stderr } = await execPromise(testCommand);

    console.log('✅ Connexion réussie');
    console.log(`   PostgreSQL: ${stdout.trim().substring(0, 80)}...`);
    console.log('');
    return true;
  } catch (error) {
    console.error('❌ Échec de connexion à PostgreSQL');
    console.error('');
    
    // Afficher l'erreur complète (stderr contient souvent plus d'infos)
    const errorMsg = error.stderr || error.message || String(error);
    console.error('📋 Détails de l\'erreur:');
    console.error(`   ${errorMsg.replace(/\n/g, '\n   ')}`);
    console.error('');

    // Messages d'erreur détaillés selon le type d'erreur
    if (errorMsg.includes('Tenant or user not found') || errorMsg.includes('No such user')) {
      console.error('💡 PROBLÈME: Project ID incorrect ou format d\'URL invalide');
      console.error('');
      console.error('   SOLUTION:');
      console.error('   1. Va sur Supabase Dashboard → Clique "Connect"');
      console.error('   2. Sélectionne "Session pooler" (port 5432)');
      console.error('   3. Copie l\'URL EXACTE fournie par Supabase');
      console.error('');
    } else if (errorMsg.includes('password authentication failed')) {
      console.error('💡 PROBLÈME: Mot de passe incorrect');
      console.error('');
      console.error('   SOLUTION:');
      console.error('   1. Va sur Supabase Dashboard → Settings → Database');
      console.error('   2. Clique "Reset database password"');
      console.error('   3. Met à jour le secret SUPABASE_DB_URL avec le nouveau mot de passe');
      console.error('');
    } else if (errorMsg.includes('could not translate host name') || errorMsg.includes('Name or service not known')) {
      console.error('💡 PROBLÈME: Hostname invalide');
      console.error('');
      console.error('   SOLUTION:');
      console.error('   Vérifiez la région dans l\'URL (eu-north-1, eu-west-3, etc.)');
      console.error(`   URL actuelle: ${maskPassword(dbUrl)}`);
      console.error('');
    } else if (errorMsg.includes('timeout') || errorMsg.includes('could not connect')) {
      console.error('💡 PROBLÈME: Connexion timeout ou bloquée');
      console.error('');
      console.error('   SOLUTION:');
      console.error('   1. Vérifiez que le projet Supabase est actif');
      console.error('   2. Vérifiez les restrictions IP si activées');
      console.error('');
    } else {
      console.error('💡 Erreur non reconnue. Vérifiez l\'URL de connexion:');
      console.error(`   ${maskPassword(dbUrl)}`);
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
