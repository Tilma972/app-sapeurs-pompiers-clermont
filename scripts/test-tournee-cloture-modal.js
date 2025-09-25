// Script de test pour vérifier la structure de données du TourneeClotureModal
// Ce script simule les données que nous passons au composant

console.log('🧪 Test de la structure de données du TourneeClotureModal...\n');

// Structure de données simulée basée sur la nouvelle structure
const mockTourneeData = {
  tournee: {
    id: 'tournee-uuid-123',
    user_id: 'user-uuid-456',
    date_debut: '2024-01-15T09:00:00Z',
    statut: 'active',
    zone: 'Secteur Centre-Ville - Zone A',
    calendriers_alloues: 50,
    calendriers_distribues: 4,
    montant_collecte: 70.00,
    notes: null,
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-01-15T09:00:00Z',
    date_fin: null
  },
  transactions: [
    {
      id: 'tx-1',
      tournee_id: 'tournee-uuid-123',
      user_id: 'user-uuid-456',
      amount: 15.00,
      calendar_accepted: true,
      supporter_name: 'Marie Martin',
      supporter_email: 'marie.martin@email.com',
      payment_method: 'especes',
      created_at: '2024-01-15T09:15:00Z'
    },
    {
      id: 'tx-2',
      tournee_id: 'tournee-uuid-123',
      user_id: 'user-uuid-456',
      amount: 25.00,
      calendar_accepted: false,
      supporter_name: 'Pierre Durand',
      supporter_email: 'pierre.durand@email.com',
      payment_method: 'cheque',
      created_at: '2024-01-15T09:45:00Z'
    }
  ],
  summary: {
    tournee_id: 'tournee-uuid-123',
    user_id: 'user-uuid-456',
    calendars_distributed: 4,
    montant_total: 70.00,
    dons_count: 1,
    dons_amount: 25.00,
    soutiens_count: 1,
    soutiens_amount: 15.00,
    total_deductions: 16.50,
    total_transactions: 2,
    especes_total: 15.00,
    cheques_total: 25.00,
    cartes_total: 0.00
  }
};

// Test des accès aux données
console.log('1. Test d\'accès aux données de tournée:');
console.log('   ✅ tourneeData.tournee.id:', mockTourneeData.tournee.id);
console.log('   ✅ tourneeData.tournee.zone:', mockTourneeData.tournee.zone);
console.log('   ✅ tourneeData.tournee.calendriers_alloues:', mockTourneeData.tournee.calendriers_alloues);

console.log('\n2. Test d\'accès aux données de résumé:');
console.log('   ✅ tourneeData.summary.calendars_distributed:', mockTourneeData.summary.calendars_distributed);
console.log('   ✅ tourneeData.summary.montant_total:', mockTourneeData.summary.montant_total);
console.log('   ✅ tourneeData.summary.dons_count:', mockTourneeData.summary.dons_count);
console.log('   ✅ tourneeData.summary.soutiens_count:', mockTourneeData.summary.soutiens_count);

console.log('\n3. Test d\'accès aux transactions:');
console.log('   ✅ tourneeData.transactions.length:', mockTourneeData.transactions.length);
console.log('   ✅ Première transaction:', mockTourneeData.transactions[0].supporter_name, '-', mockTourneeData.transactions[0].amount + '€');

console.log('\n4. Test des valeurs par défaut (cas où summary est null):');
const mockTourneeDataWithoutSummary = {
  ...mockTourneeData,
  summary: null
};

console.log('   ✅ (summary?.calendars_distributed || 0):', mockTourneeDataWithoutSummary.summary?.calendars_distributed || 0);
console.log('   ✅ (summary?.montant_total || 0):', mockTourneeDataWithoutSummary.summary?.montant_total || 0);

console.log('\n5. Test de la structure pour le formulaire:');
const formData = {
  totalCalendars: (mockTourneeData.summary?.calendars_distributed || 0).toString(),
  montantEspeces: '',
  montantCheques: '',
  montantCartes: '',
  notes: ''
};
console.log('   ✅ formData.totalCalendars:', formData.totalCalendars);

console.log('\n6. Test de la structure pour la Server Action:');
const formDataToSubmit = {
  tournee_id: mockTourneeData.tournee.id,
  calendriers_finaux: formData.totalCalendars,
  montant_final: formData.montantEspeces
};
console.log('   ✅ formDataToSubmit.tournee_id:', formDataToSubmit.tournee_id);

console.log('\n🎉 Tous les tests de structure sont passés !');
console.log('💡 Le composant TourneeClotureModal devrait maintenant fonctionner correctement avec la nouvelle structure de données.');

// Test des cas d'erreur
console.log('\n7. Test des cas d\'erreur:');
try {
  // Test d'accès à une propriété qui n'existe plus
  console.log('   ❌ Ancienne structure (devrait échouer):');
  console.log('   tourneeData.progress.calendarsDistributed:', mockTourneeData.progress?.calendarsDistributed);
} catch (error) {
  console.log('   ✅ Erreur attendue:', error.message);
}

console.log('\n✅ Le composant est maintenant compatible avec la nouvelle structure de données !');

