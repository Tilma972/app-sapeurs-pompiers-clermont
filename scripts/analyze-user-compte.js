/**
 * Script d'analyse du compte utilisateur
 * Investigate les incohérences entre les montants affichés et les données réelles
 *
 * Usage: node scripts/analyze-user-compte.js <user_id>
 * Example: node scripts/analyze-user-compte.js c7a9dc2a-ef93-4e9a-b594-de407daa30d8
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv/config');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Erreur: Variables d\'environnement manquantes');
  console.error('   Vérifiez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function analyzeUserCompte(userId) {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 ANALYSE DU COMPTE UTILISATEUR');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`🔍 User ID: ${userId}`);
  console.log('');

  try {
    // 1. Profil utilisateur
    console.log('1️⃣  PROFIL UTILISATEUR');
    console.log('─────────────────────────────────────────────────────────');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, team_id, role, created_at')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('❌ Erreur profil:', profileError.message);
    } else {
      console.log(`   Nom: ${profile.full_name}`);
      console.log(`   Équipe: ${profile.team_id || 'Aucune'}`);
      console.log(`   Rôle: ${profile.role}`);
    }
    console.log('');

    // 2. Compte personnel
    console.log('2️⃣  COMPTE PERSONNEL (comptes_sp)');
    console.log('─────────────────────────────────────────────────────────');
    const { data: compte, error: compteError } = await supabase
      .from('comptes_sp')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (compteError) {
      console.error('❌ Erreur compte:', compteError.message);
    } else if (!compte) {
      console.log('⚠️  Aucun compte trouvé (utilisateur sans clôture de tournée)');
    } else {
      console.log(`   💰 Solde disponible: ${compte.solde_disponible?.toFixed(2) ?? 'null'} €`);
      console.log(`   📊 Total rétributions: ${compte.total_retributions?.toFixed(2) ?? 'null'} €`);
      console.log(`   🎯 Pourcentage pot équipe: ${compte.pourcentage_pot_equipe_defaut ?? 'null'} %`);
    }
    console.log('');

    // 3. Tournées
    console.log('3️⃣  TOURNÉES');
    console.log('─────────────────────────────────────────────────────────');
    const { data: tournees, error: tourneesError } = await supabase
      .from('tournees')
      .select('*')
      .eq('user_id', userId)
      .order('date_debut', { ascending: false });

    if (tourneesError) {
      console.error('❌ Erreur tournées:', tourneesError.message);
    } else {
      console.log(`   Nombre de tournées: ${tournees?.length || 0}`);
      if (tournees && tournees.length > 0) {
        tournees.forEach((t, idx) => {
          console.log(`   ${idx + 1}. ${t.statut.toUpperCase()} - ${t.zone}`);
          console.log(`      ID: ${t.id}`);
          console.log(`      Date: ${new Date(t.date_debut).toLocaleDateString('fr-FR')}`);
          console.log(`      Calendriers: ${t.calendriers_distribues ?? 'N/A'} / ${t.calendriers_alloues ?? 'N/A'}`);
          console.log(`      Montant: ${t.montant_collecte?.toFixed(2) ?? 'N/A'} €`);
        });
      }
    }
    console.log('');

    // 4. Transactions support_transactions
    console.log('4️⃣  TRANSACTIONS (support_transactions)');
    console.log('─────────────────────────────────────────────────────────');
    if (!tournees || tournees.length === 0) {
      console.log('   Aucune tournée, donc aucune transaction');
    } else {
      const tourneeIds = tournees.map(t => t.id);
      const { data: transactions, error: transError } = await supabase
        .from('support_transactions')
        .select('*')
        .in('tournee_id', tourneeIds)
        .order('created_at', { ascending: false });

      if (transError) {
        console.error('❌ Erreur transactions:', transError.message);
      } else {
        console.log(`   Nombre de transactions: ${transactions?.length || 0}`);

        const totalCollecte = transactions?.reduce((sum, t) =>
          t.payment_status === 'completed' ? sum + (t.amount || 0) : sum, 0) || 0;
        const totalCB = transactions?.reduce((sum, t) =>
          t.payment_method === 'card' && t.payment_status === 'completed' ? sum + (t.amount || 0) : sum, 0) || 0;
        const totalCash = transactions?.reduce((sum, t) =>
          t.payment_method === 'cash' && t.payment_status === 'completed' ? sum + (t.amount || 0) : sum, 0) || 0;
        const cashDepose = transactions?.reduce((sum, t) =>
          t.payment_method === 'cash' && t.deposited_at ? sum + (t.amount || 0) : sum, 0) || 0;
        const cashNonDepose = transactions?.reduce((sum, t) =>
          t.payment_method === 'cash' && !t.deposited_at && t.payment_status === 'completed' ? sum + (t.amount || 0) : sum, 0) || 0;

        console.log(`   💵 Total collecté: ${totalCollecte.toFixed(2)} €`);
        console.log(`   💳 CB: ${totalCB.toFixed(2)} €`);
        console.log(`   💶 Espèces: ${totalCash.toFixed(2)} €`);
        console.log(`   ✅ Espèces déposées: ${cashDepose.toFixed(2)} €`);
        console.log(`   ⏳ Espèces NON déposées: ${cashNonDepose.toFixed(2)} €`);

        // Détail par tournée
        console.log('');
        console.log('   Détail par tournée:');
        tournees.forEach(tournee => {
          const transTournee = transactions?.filter(t => t.tournee_id === tournee.id) || [];
          if (transTournee.length > 0) {
            const total = transTournee.reduce((sum, t) =>
              t.payment_status === 'completed' ? sum + (t.amount || 0) : sum, 0);
            console.log(`   - ${tournee.zone} (${tournee.statut}): ${transTournee.length} trans, ${total.toFixed(2)} €`);
          }
        });
      }
    }
    console.log('');

    // 5. Mouvements de rétribution
    console.log('5️⃣  MOUVEMENTS DE RÉTRIBUTION');
    console.log('─────────────────────────────────────────────────────────');
    const { data: mouvements, error: mouvError } = await supabase
      .from('mouvements_retribution')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (mouvError) {
      console.error('❌ Erreur mouvements:', mouvError.message);
    } else {
      console.log(`   Nombre de mouvements: ${mouvements?.length || 0}`);

      const totalRetrib = mouvements?.reduce((sum, m) => sum + (m.montant_compte_perso || 0), 0) || 0;
      const totalPot = mouvements?.reduce((sum, m) => sum + (m.montant_pot_equipe || 0), 0) || 0;

      console.log(`   💰 Total compte perso: ${totalRetrib.toFixed(2)} €`);
      console.log(`   🏆 Total pot équipe: ${totalPot.toFixed(2)} €`);

      if (mouvements && mouvements.length > 0) {
        console.log('');
        console.log('   Détail:');
        mouvements.forEach((m, idx) => {
          console.log(`   ${idx + 1}. ${new Date(m.created_at).toLocaleDateString('fr-FR')}`);
          console.log(`      Collecté: ${m.montant_total_collecte?.toFixed(2)} €`);
          console.log(`      Pour moi: ${m.montant_compte_perso?.toFixed(2)} €`);
          console.log(`      Pot équipe: ${m.montant_pot_equipe?.toFixed(2)} € (${m.pourcentage_pot_applique}%)`);
        });
      }
    }
    console.log('');

    // 6. Demandes de versement
    console.log('6️⃣  DEMANDES DE VERSEMENT');
    console.log('─────────────────────────────────────────────────────────');
    const { data: versements, error: versError } = await supabase
      .from('demandes_versement')
      .select('*')
      .eq('user_id', userId)
      .order('date_demande', { ascending: false });

    if (versError) {
      console.error('❌ Erreur versements:', versError.message);
    } else {
      console.log(`   Nombre de demandes: ${versements?.length || 0}`);

      const totalVerse = versements?.reduce((sum, v) =>
        (v.statut === 'completed' || v.statut === 'validée') ? sum + (v.montant_verse || 0) : sum, 0) || 0;

      console.log(`   💸 Total versé: ${totalVerse.toFixed(2)} €`);

      if (versements && versements.length > 0) {
        console.log('');
        console.log('   Détail:');
        versements.forEach((v, idx) => {
          console.log(`   ${idx + 1}. ${v.statut.toUpperCase()} - ${v.methode_versement || 'N/A'}`);
          console.log(`      Demandé: ${v.montant_demande?.toFixed(2)} €`);
          console.log(`      Versé: ${v.montant_verse?.toFixed(2) ?? 'N/A'} €`);
          console.log(`      Date: ${new Date(v.date_demande).toLocaleDateString('fr-FR')}`);
        });
      }
    }
    console.log('');

    // 7. ANALYSE ET CALCULS
    console.log('7️⃣  ANALYSE ET CALCULS');
    console.log('─────────────────────────────────────────────────────────');

    const totalRetribCalcule = mouvements?.reduce((sum, m) => sum + (m.montant_compte_perso || 0), 0) || 0;
    const totalVerseCalcule = versements?.reduce((sum, v) =>
      (v.statut === 'completed' || v.statut === 'validée') ? sum + (v.montant_verse || 0) : sum, 0) || 0;
    const soldeCalcule = totalRetribCalcule - totalVerseCalcule;
    const soldeStocke = compte?.solde_disponible || 0;
    const ecart = soldeCalcule - soldeStocke;

    console.log(`   📊 Total rétributions (calculé): ${totalRetribCalcule.toFixed(2)} €`);
    console.log(`   💸 Total versé (calculé): ${totalVerseCalcule.toFixed(2)} €`);
    console.log(`   ➖ Solde calculé: ${soldeCalcule.toFixed(2)} €`);
    console.log(`   💾 Solde stocké (comptes_sp): ${soldeStocke.toFixed(2)} €`);
    console.log(`   ${ecart === 0 ? '✅' : '⚠️ '} Écart: ${ecart.toFixed(2)} €`);

    if (Math.abs(ecart) > 0.01) {
      console.log('');
      console.log('   ⚠️  INCOHÉRENCE DÉTECTÉE !');
      console.log('   Le solde stocké ne correspond pas au solde calculé');
      console.log(`   Différence: ${Math.abs(ecart).toFixed(2)} €`);
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ ANALYSE TERMINÉE');
    console.log('═══════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
    process.exit(1);
  }
}

// Main
const userId = process.argv[2];

if (!userId) {
  console.error('❌ Usage: node scripts/analyze-user-compte.js <user_id>');
  console.error('   Example: node scripts/analyze-user-compte.js c7a9dc2a-ef93-4e9a-b594-de407daa30d8');
  process.exit(1);
}

analyzeUserCompte(userId);
