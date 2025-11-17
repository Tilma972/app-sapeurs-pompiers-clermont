#!/usr/bin/env node

/**
 * Script de diagnostic pour vérifier l'URL de connexion Supabase
 * Aide à identifier les problèmes de configuration
 */

require('dotenv').config();
const { exec } = require('child_process');
const { promisify } = require('util');

const execPromise = promisify(exec);

const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;

async function analyzeUrl() {
  console.log('🔍 DIAGNOSTIC DE L\'URL DE CONNEXION SUPABASE');
  console.log('════════════════════════════════════════════════\n');

  if (!SUPABASE_DB_URL) {
    console.error('❌ SUPABASE_DB_URL n\'est pas défini');
    console.error('   Créez un fichier .env avec SUPABASE_DB_URL=...');
    process.exit(1);
  }

  // Analyse de l'URL
  console.log('📋 Analyse de l\'URL fournie:\n');

  // Vérifier les espaces
  if (SUPABASE_DB_URL.trim() !== SUPABASE_DB_URL) {
    console.warn('⚠️  L\'URL contient des espaces au début ou à la fin');
    console.warn('   URL avec espaces visibles: [' + SUPABASE_DB_URL + ']');
    console.warn('   URL nettoyée: [' + SUPABASE_DB_URL.trim() + ']');
    console.warn('');
  }

  const url = SUPABASE_DB_URL.trim();

  // Afficher l'URL (en masquant le mot de passe)
  const urlMasked = url.replace(/:([^:@]+)@/, ':***MASKED***@');
  console.log('   URL: ' + urlMasked);
  console.log('   Longueur: ' + url.length + ' caractères');
  console.log('');

  // Parser l'URL
  try {
    const regex = /^postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/;
    const match = url.match(regex);

    if (!match) {
      console.error('❌ Format d\'URL invalide');
      console.error('');
      console.error('Format attendu:');
      console.error('postgresql://USER:PASSWORD@HOST:PORT/DATABASE');
      console.error('');
      console.error('Exemples valides:');
      console.error('Session pooler:');
      console.error('  postgresql://postgres.abc123:password@aws-0-eu-west-3.pooler.supabase.com:5432/postgres');
      console.error('');
      console.error('Direct connection:');
      console.error('  postgresql://postgres:password@db.abc123.supabase.co:5432/postgres');
      console.error('');
      process.exit(1);
    }

    const [, user, password, host, port, database] = match;

    console.log('✅ Format d\'URL valide\n');
    console.log('Composants détectés:');
    console.log('   Utilisateur: ' + user);
    console.log('   Mot de passe: ' + password.substring(0, 3) + '***' + password.substring(password.length - 3));
    console.log('   Longueur mot de passe: ' + password.length + ' caractères');
    console.log('   Hôte: ' + host);
    console.log('   Port: ' + port);
    console.log('   Base de données: ' + database);
    console.log('');

    // Vérifications
    let warnings = 0;
    let errors = 0;

    // Vérifier le port
    if (port === '6543') {
      console.error('❌ Port 6543 détecté (Transaction pooler)');
      console.error('   Ce mode ne fonctionne PAS avec pg_dump');
      console.error('   Utilisez le port 5432 (Session pooler ou Direct connection)');
      console.error('');
      errors++;
    } else if (port === '5432') {
      console.log('✅ Port 5432 correct (Session pooler ou Direct connection)');
      console.log('');
    } else {
      console.warn('⚠️  Port inhabituel: ' + port);
      console.warn('   Le port standard est 5432');
      console.warn('');
      warnings++;
    }

    // Vérifier le type de connexion
    if (host.includes('pooler.supabase.com')) {
      console.log('✅ Session pooler détecté (recommandé pour GitHub Actions - IPv4)');
      console.log('');
    } else if (host.startsWith('db.') && host.endsWith('.supabase.co')) {
      console.log('✅ Direct connection détectée (IPv6)');
      console.warn('⚠️  La Direct connection nécessite IPv6');
      console.warn('   GitHub Actions utilise IPv4, privilégiez le Session pooler');
      console.log('');
      warnings++;
    } else {
      console.warn('⚠️  Format d\'hôte inhabituel: ' + host);
      console.warn('   Formats attendus:');
      console.warn('   - aws-X-region.pooler.supabase.com (Session pooler)');
      console.warn('   - db.PROJECT-REF.supabase.co (Direct connection)');
      console.warn('');
      warnings++;
    }

    // Vérifier le mot de passe
    const hasSpecialChars = /[^a-zA-Z0-9]/.test(password);
    if (hasSpecialChars) {
      console.warn('⚠️  Le mot de passe contient des caractères spéciaux');
      const specialChars = password.match(/[^a-zA-Z0-9]/g) || [];
      console.warn('   Caractères spéciaux détectés: ' + [...new Set(specialChars)].join(', '));
      console.warn('   Assurez-vous qu\'ils sont correctement encodés en URL');
      console.warn('');

      // Vérifier si le mot de passe semble encodé
      if (password.includes('%')) {
        console.log('✅ Le mot de passe semble être encodé en URL (contient "%")');
        console.log('');
      } else {
        console.error('❌ Le mot de passe contient des caractères spéciaux NON encodés');
        console.error('   Utilisez l\'outil: npm run encode-password');
        console.error('');
        errors++;
      }
    } else {
      console.log('✅ Mot de passe simple (pas de caractères spéciaux)');
      console.log('');
    }

    // Vérifier le user
    if (user.startsWith('postgres.')) {
      const projectRef = user.substring(9);
      console.log('✅ Utilisateur Session pooler: postgres.' + projectRef);
      console.log('   PROJECT-REF: ' + projectRef);
      console.log('');
    } else if (user === 'postgres') {
      console.log('✅ Utilisateur Direct connection: postgres');
      console.log('');
    } else {
      console.warn('⚠️  Utilisateur inhabituel: ' + user);
      console.warn('   Attendu: "postgres" ou "postgres.PROJECT-REF"');
      console.warn('');
      warnings++;
    }

    // Résumé
    console.log('════════════════════════════════════════════════');
    if (errors > 0) {
      console.error(`\n❌ ${errors} erreur(s) critique(s) détectée(s)`);
      console.error('   Corrigez ces erreurs avant de continuer');
    } else if (warnings > 0) {
      console.warn(`\n⚠️  ${warnings} avertissement(s)`);
      console.log('   L\'URL devrait fonctionner mais vérifiez les points ci-dessus');
    } else {
      console.log('\n✅ Aucun problème détecté dans l\'URL');
    }
    console.log('');

    // Test de connexion si pas d'erreurs
    if (errors === 0) {
      console.log('🔌 Test de connexion à PostgreSQL...\n');

      try {
        const testCommand = `psql "${url}" -c "SELECT version();" -t`;
        const { stdout } = await execPromise(testCommand);

        console.log('✅ CONNEXION RÉUSSIE !');
        console.log('');
        console.log('PostgreSQL version:');
        console.log('   ' + stdout.trim());
        console.log('');
        console.log('════════════════════════════════════════════════');
        console.log('✅ Votre URL de connexion est correcte et fonctionnelle');
        console.log('   Vous pouvez l\'utiliser dans GitHub Actions');
        console.log('════════════════════════════════════════════════');

      } catch (error) {
        console.error('❌ ÉCHEC DE CONNEXION');
        console.error('');
        console.error('Erreur: ' + error.message);
        console.error('');

        if (error.message.includes('Tenant or user not found')) {
          console.error('💡 Causes possibles:');
          console.error('   1. Le PROJECT-REF est incorrect');
          console.error('   2. Le port devrait être 5432 au lieu de 6543');
          console.error('   3. L\'utilisateur est mal formaté');
        } else if (error.message.includes('password authentication failed')) {
          console.error('💡 Causes possibles:');
          console.error('   1. Le mot de passe est incorrect');
          console.error('   2. Le mot de passe a expiré ou a été réinitialisé');
          console.error('   3. Le mot de passe contient des caractères spéciaux mal encodés');
          console.error('');
          console.error('Vérifiez le mot de passe dans:');
          console.error('   Dashboard Supabase → Settings → Database');
          console.error('   Si vous venez de le générer, utilisez celui fourni à ce moment');
        } else if (error.message.includes('could not translate host name')) {
          console.error('💡 Causes possibles:');
          console.error('   1. L\'hôte est mal formaté');
          console.error('   2. Le PROJECT-REF est incorrect');
          console.error('   3. La région est incorrecte');
        }

        console.error('');
        console.error('════════════════════════════════════════════════');
        console.error('❌ L\'URL est invalide ou les credentials sont incorrects');
        console.error('════════════════════════════════════════════════');
        process.exit(1);
      }
    } else {
      console.error('════════════════════════════════════════════════');
      console.error('❌ Corrigez les erreurs ci-dessus avant de tester la connexion');
      console.error('════════════════════════════════════════════════');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error.message);
    process.exit(1);
  }
}

analyzeUrl().catch(error => {
  console.error('Erreur fatale:', error);
  process.exit(1);
});
