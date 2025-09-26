// Script de test pour vérifier la connectivité avec les données de tournée
// Ce script simule l'appel à la fonction getActiveTourneeWithTransactions

const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase (utilisez vos vraies valeurs)
const supabaseUrl = 'https://npyfregghvnmqxwgkfea.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTourneeData() {
  console.log('🧪 Test de connectivité avec les données de tournée...\n');

  try {
    // 1. Test de connexion à Supabase
    console.log('1. Test de connexion à Supabase...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('❌ Erreur d\'authentification:', authError.message);
      console.log('💡 Assurez-vous d\'être connecté à Supabase');
      return;
    }
    
    if (!user) {
      console.log('❌ Aucun utilisateur connecté');
      console.log('💡 Connectez-vous d\'abord à l\'application');
      return;
    }
    
    console.log('✅ Utilisateur connecté:', user.email);
    console.log('   ID utilisateur:', user.id);

    // 2. Test de récupération des tournées
    console.log('\n2. Test de récupération des tournées...');
    const { data: tournees, error: tourneesError } = await supabase
      .from('tournees')
      .select('*')
      .eq('user_id', user.id)
      .order('date_debut', { ascending: false });

    if (tourneesError) {
      console.log('❌ Erreur lors de la récupération des tournées:', tourneesError.message);
      return;
    }

    console.log(`✅ ${tournees.length} tournée(s) trouvée(s)`);
    
    if (tournees.length > 0) {
      const activeTournees = tournees.filter(t => t.statut === 'active');
      console.log(`   - ${activeTournees.length} tournée(s) active(s)`);
      
      if (activeTournees.length > 0) {
        const activeTournee = activeTournees[0];
        console.log('   - Tournée active:', {
          id: activeTournee.id,
          zone: activeTournee.zone,
          date_debut: activeTournee.date_debut,
          calendriers_alloues: activeTournee.calendriers_alloues,
          calendriers_distribues: activeTournee.calendriers_distribues,
          montant_collecte: activeTournee.montant_collecte
        });

        // 3. Test de récupération des transactions
        console.log('\n3. Test de récupération des transactions...');
        const { data: transactions, error: transactionsError } = await supabase
          .from('support_transactions')
          .select('*')
          .eq('tournee_id', activeTournee.id)
          .order('created_at', { ascending: false });

        if (transactionsError) {
          console.log('❌ Erreur lors de la récupération des transactions:', transactionsError.message);
          return;
        }

        console.log(`✅ ${transactions.length} transaction(s) trouvée(s)`);
        
        if (transactions.length > 0) {
          console.log('   - Dernières transactions:');
          transactions.slice(0, 3).forEach((tx, index) => {
            console.log(`     ${index + 1}. ${tx.supporter_name || 'Anonyme'} - ${tx.amount}€ (${tx.calendar_accepted ? 'Soutien' : 'Don fiscal'})`);
          });
        }

        // 4. Test de récupération du résumé
        console.log('\n4. Test de récupération du résumé...');
        const { data: summary, error: summaryError } = await supabase
          .from('tournee_summary')
          .select('*')
          .eq('tournee_id', activeTournee.id)
          .single();

        if (summaryError && summaryError.code !== 'PGRST116') {
          console.log('❌ Erreur lors de la récupération du résumé:', summaryError.message);
        } else if (summary) {
          console.log('✅ Résumé récupéré:', {
            calendars_distributed: summary.calendars_distributed,
            montant_total: summary.montant_total,
            dons_count: summary.dons_count,
            soutiens_count: summary.soutiens_count
          });
        } else {
          console.log('ℹ️  Aucun résumé disponible (normal si pas de transactions)');
        }

      } else {
        console.log('ℹ️  Aucune tournée active trouvée');
        console.log('💡 Créez une tournée active avec le script de données de test');
      }
    } else {
      console.log('ℹ️  Aucune tournée trouvée');
      console.log('💡 Créez des données de test avec le script SQL');
    }

    console.log('\n🎉 Test terminé avec succès !');
    console.log('💡 Votre application Next.js devrait maintenant fonctionner avec les vraies données');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.log('💡 Vérifiez votre configuration Supabase');
  }
}

// Exécuter le test
testTourneeData();


