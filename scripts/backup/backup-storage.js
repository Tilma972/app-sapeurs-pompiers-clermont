#!/usr/bin/env node

/**
 * Backup Supabase Storage Buckets to Minio
 * 
 * Ce script :
 * 1. Liste tous les fichiers des buckets Supabase (avatars, landing_page)
 * 2. Télécharge chaque fichier
 * 3. Upload vers Minio avec la même structure de dossiers
 * 4. Affiche un rapport de synchronisation
 */

// Charger les variables d'environnement depuis .env
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const https = require('https');
const http = require('http');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT;
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY;
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY;
const MINIO_BUCKET = process.env.MINIO_BUCKET || 'supabase-backups';

const BUCKETS_TO_BACKUP = ['avatars', 'landing_page'];

// Initialiser Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Initialiser Minio S3
const s3Client = new S3Client({
  endpoint: MINIO_ENDPOINT,
  region: 'us-east-1',
  credentials: {
    accessKeyId: MINIO_ACCESS_KEY,
    secretAccessKey: MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
});

async function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

async function fileExistsInMinio(key) {
  try {
    await s3Client.send(new HeadObjectCommand({
      Bucket: MINIO_BUCKET,
      Key: key,
    }));
    return true;
  } catch (error) {
    if (error.name === 'NotFound') return false;
    throw error;
  }
}

async function backupBucket(bucketName) {
  console.log(`\n📁 Backup du bucket: ${bucketName}`);
  
  try {
    // Lister tous les fichiers du bucket
    const { data: files, error } = await supabase.storage
      .from(bucketName)
      .list('', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      console.error(`❌ Erreur listage ${bucketName}:`, error.message);
      return { uploaded: 0, skipped: 0, errors: 0 };
    }

    if (!files || files.length === 0) {
      console.log(`ℹ️  Aucun fichier dans ${bucketName}`);
      return { uploaded: 0, skipped: 0, errors: 0 };
    }

    console.log(`📊 ${files.length} fichier(s) trouvé(s)`);

    let uploaded = 0;
    let skipped = 0;
    let errors = 0;

    // Liste récursive si nécessaire (pour les sous-dossiers)
    async function processFiles(prefix = '') {
      const { data: items } = await supabase.storage
        .from(bucketName)
        .list(prefix, { limit: 1000 });

      if (!items) return;

      for (const item of items) {
        const fullPath = prefix ? `${prefix}/${item.name}` : item.name;

        // Si c'est un dossier, récursion
        if (!item.id && item.name) {
          await processFiles(fullPath);
          continue;
        }

        try {
          // Clé Minio
          const minioKey = `storage/${bucketName}/${fullPath}`;

          // Vérifier si déjà présent dans Minio
          const exists = await fileExistsInMinio(minioKey);
          if (exists) {
            skipped++;
            continue;
          }

          // Obtenir l'URL publique signée
          const { data: { signedUrl } } = await supabase.storage
            .from(bucketName)
            .createSignedUrl(fullPath, 60);

          if (!signedUrl) {
            console.warn(`⚠️  Impossible de générer URL signée: ${fullPath}`);
            errors++;
            continue;
          }

          // Télécharger le fichier
          const fileBuffer = await downloadFile(signedUrl);

          // Upload vers Minio
          await s3Client.send(new PutObjectCommand({
            Bucket: MINIO_BUCKET,
            Key: minioKey,
            Body: fileBuffer,
            ContentType: item.metadata?.mimetype || 'application/octet-stream',
            Metadata: {
              'original-bucket': bucketName,
              'original-path': fullPath,
              'backup-date': new Date().toISOString(),
            },
          }));

          uploaded++;
          if (uploaded % 10 === 0) {
            console.log(`⏳ ${uploaded} fichiers uploadés...`);
          }
        } catch (error) {
          console.error(`❌ Erreur backup ${fullPath}:`, error.message);
          errors++;
        }
      }
    }

    await processFiles();

    console.log(`✅ Bucket ${bucketName} terminé:`);
    console.log(`   📤 Uploadés: ${uploaded}`);
    console.log(`   ⏭️  Ignorés (déjà présents): ${skipped}`);
    if (errors > 0) console.log(`   ❌ Erreurs: ${errors}`);

    return { uploaded, skipped, errors };
  } catch (error) {
    console.error(`❌ Erreur fatale bucket ${bucketName}:`, error.message);
    return { uploaded: 0, skipped: 0, errors: 1 };
  }
}

async function main() {
  console.log('🚀 Démarrage du backup Storage Supabase → Minio');
  console.log(`📅 Date: ${new Date().toISOString()}`);
  console.log(`🎯 Buckets: ${BUCKETS_TO_BACKUP.join(', ')}`);
  console.log('');

  const startTime = Date.now();

  try {
    // Vérifier les variables d'environnement
    if (!SUPABASE_URL) throw new Error('SUPABASE_URL non défini');
    if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY non défini');
    if (!MINIO_ENDPOINT) throw new Error('MINIO_ENDPOINT non défini');
    if (!MINIO_ACCESS_KEY) throw new Error('MINIO_ACCESS_KEY non défini');
    if (!MINIO_SECRET_KEY) throw new Error('MINIO_SECRET_KEY non défini');

    const totalStats = {
      uploaded: 0,
      skipped: 0,
      errors: 0,
    };

    // Backup chaque bucket
    for (const bucketName of BUCKETS_TO_BACKUP) {
      const stats = await backupBucket(bucketName);
      totalStats.uploaded += stats.uploaded;
      totalStats.skipped += stats.skipped;
      totalStats.errors += stats.errors;
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('');
    console.log('✅ BACKUP STORAGE RÉUSSI');
    console.log(`⏱️  Durée totale: ${duration}s`);
    console.log(`📤 Total uploadés: ${totalStats.uploaded}`);
    console.log(`⏭️  Total ignorés: ${totalStats.skipped}`);
    if (totalStats.errors > 0) {
      console.log(`❌ Total erreurs: ${totalStats.errors}`);
    }
    console.log(`🔗 Destination: ${MINIO_BUCKET}/storage/`);

    process.exit(totalStats.errors > 0 ? 1 : 0);
  } catch (error) {
    console.error('');
    console.error('❌ BACKUP STORAGE ÉCHOUÉ');
    console.error('Erreur:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Exécution
main();
