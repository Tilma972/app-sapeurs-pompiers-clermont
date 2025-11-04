/**
 * Script de test rapide pour le backend Boîte à Idées
 * Exécuter après avoir appliqué les migrations
 * 
 * Usage: node scripts/test-ideas-backend.ts (ou via tsx)
 */

import { createClient } from '@/lib/supabase/client';

async function testIdeasBackend() {
  console.log('🧪 Test Backend Boîte à Idées\n');

  const supabase = createClient();
  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Vérifier que les tables existent
  console.log('📋 Test 1: Vérification tables...');
  try {
    const { error: ideasError } = await supabase
      .from('ideas')
      .select('id')
      .limit(1);
    
    const { error: votesError } = await supabase
      .from('idea_votes')
      .select('id')
      .limit(1);
    
    const { error: commentsError } = await supabase
      .from('idea_comments')
      .select('id')
      .limit(1);

    if (!ideasError && !votesError && !commentsError) {
      console.log('✅ Toutes les tables existent\n');
      testsPassed++;
    } else {
      console.log('❌ Erreur tables:', ideasError || votesError || commentsError);
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ Erreur:', error);
    testsFailed++;
  }

  // Test 2: Vérifier le bucket Storage
  console.log('📦 Test 2: Vérification bucket Storage...');
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const ideaBucket = buckets?.find(b => b.id === 'idea-audios');
    
    if (ideaBucket) {
      console.log('✅ Bucket idea-audios existe\n');
      testsPassed++;
    } else {
      console.log('❌ Bucket idea-audios introuvable\n');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ Erreur:', error);
    testsFailed++;
  }

  // Test 3: Tester fonction rate limit
  console.log('⏱️  Test 3: Fonction check_vote_rate_limit...');
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data, error } = await supabase.rpc('check_vote_rate_limit', {
        target_user_id: user.id
      });
      
      if (!error) {
        console.log(`✅ Rate limit check OK (résultat: ${data})\n`);
        testsPassed++;
      } else {
        console.log('❌ Erreur rate limit:', error);
        testsFailed++;
      }
    } else {
      console.log('⚠️  Pas d\'utilisateur connecté, test skippé\n');
    }
  } catch (error) {
    console.log('❌ Erreur:', error);
    testsFailed++;
  }

  // Test 4: Compter les idées existantes
  console.log('📊 Test 4: Comptage idées...');
  try {
    const { count, error } = await supabase
      .from('ideas')
      .select('*', { count: 'exact', head: true });
    
    if (!error) {
      console.log(`✅ ${count || 0} idée(s) dans la base\n`);
      testsPassed++;
    } else {
      console.log('❌ Erreur comptage:', error);
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ Erreur:', error);
    testsFailed++;
  }

  // Test 5: Vérifier les indexes
  console.log('🔍 Test 5: Vérification indexes...');
  console.log('⚠️  Test indexes skippé (nécessite fonction custom)\n');

  // Résumé
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Tests réussis: ${testsPassed}`);
  console.log(`❌ Tests échoués: ${testsFailed}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (testsFailed === 0) {
    console.log('🎉 Tous les tests sont passés ! Le backend est prêt.\n');
  } else {
    console.log('⚠️  Certains tests ont échoué. Vérifiez que les migrations sont appliquées.\n');
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  testIdeasBackend()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Erreur fatale:', error);
      process.exit(1);
    });
}

export default testIdeasBackend;
