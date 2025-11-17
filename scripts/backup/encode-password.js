#!/usr/bin/env node

/**
 * Outil pour encoder correctement un mot de passe Supabase
 * et générer l'URL de connexion PostgreSQL
 *
 * Usage:
 *   node encode-password.js
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  console.log('🔐 Générateur d\'URL PostgreSQL Supabase');
  console.log('════════════════════════════════════════\n');

  // 1. Récupérer le projet ref
  console.log('1️⃣  Récupérez votre PROJECT-REF:');
  console.log('   Dashboard → Settings → General → Reference ID');
  console.log('   Exemple: npyfregghvnmqxwgkfea\n');
  const projectRef = await askQuestion('   Entrez votre PROJECT-REF: ');

  if (!projectRef) {
    console.error('\n❌ PROJECT-REF requis');
    process.exit(1);
  }

  // 2. Récupérer la région
  console.log('\n2️⃣  Récupérez votre région:');
  console.log('   Dashboard → Settings → General → Region');
  console.log('   Exemples: eu-west-3, us-east-1, ap-southeast-1\n');
  const region = await askQuestion('   Entrez votre région (ex: eu-west-3): ');

  if (!region) {
    console.error('\n❌ Région requise');
    process.exit(1);
  }

  // 3. Récupérer le mot de passe
  console.log('\n3️⃣  Récupérez votre mot de passe:');
  console.log('   Dashboard → Settings → Database → Database password');
  console.log('   ⚠️  Si vous venez de le générer, copiez-le maintenant!\n');
  const password = await askQuestion('   Entrez votre mot de passe: ');

  if (!password) {
    console.error('\n❌ Mot de passe requis');
    process.exit(1);
  }

  rl.close();

  // 4. Encoder le mot de passe
  const encodedPassword = encodeURIComponent(password);

  // 5. Générer les URLs
  console.log('\n════════════════════════════════════════');
  console.log('✅ URLs générées:\n');

  // Session pooler (recommandé pour GitHub Actions)
  const sessionPoolerUrl = `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-${region}.pooler.supabase.com:5432/postgres`;

  console.log('📍 SESSION POOLER (recommandé pour GitHub Actions - IPv4):');
  console.log('─────────────────────────────────────────────────────────');
  console.log(sessionPoolerUrl);
  console.log('');

  // Direct connection
  const directUrl = `postgresql://postgres:${encodedPassword}@db.${projectRef}.supabase.co:5432/postgres`;

  console.log('📍 DIRECT CONNECTION (si IPv6 disponible):');
  console.log('─────────────────────────────────────────────────────────');
  console.log(directUrl);
  console.log('');

  console.log('════════════════════════════════════════');
  console.log('\n💡 Informations:');
  console.log(`   Mot de passe original: ${password}`);
  console.log(`   Mot de passe encodé: ${encodedPassword}`);
  console.log('');

  if (password !== encodedPassword) {
    console.log('⚠️  ATTENTION: Votre mot de passe contient des caractères spéciaux.');
    console.log('   Il a été automatiquement encodé dans les URLs ci-dessus.');
    console.log('');
    console.log('   Caractères encodés:');
    for (let i = 0; i < password.length; i++) {
      const char = password[i];
      const encoded = encodeURIComponent(char);
      if (char !== encoded) {
        console.log(`   "${char}" → "${encoded}"`);
      }
    }
    console.log('');
  }

  console.log('📋 Prochaines étapes:');
  console.log('   1. Copiez l\'URL SESSION POOLER ci-dessus');
  console.log('   2. GitHub → Settings → Secrets → SUPABASE_DB_URL');
  console.log('   3. Collez l\'URL complète (avec le mot de passe encodé)');
  console.log('   4. Relancez le workflow de backup');
  console.log('');
}

main().catch((error) => {
  console.error('Erreur:', error.message);
  process.exit(1);
});
