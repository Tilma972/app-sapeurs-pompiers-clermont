/**
 * Script de test pour valider les fonctions Avantages Day 2
 * À exécuter manuellement pour vérifier les seed data
 */

import { getPartners, getPartnerById, getFeaturedPartners } from '@/lib/supabase/partners';
import { getOffers, getOffersByPartner, getAvailableOffers } from '@/lib/supabase/offers';

/**
 * Test complet des fonctions Day 2
 */
export async function testAvantagesModule() {
  console.log('🧪 Test Module Avantages - Day 2\n');

  // Test 1: Récupérer tous les partenaires
  console.log('📋 Test 1: getPartners()');
  try {
    const partners = await getPartners();
    console.log(`✅ ${partners.length} partenaires trouvés`);
    console.log('   Noms:', partners.map(p => p.nom).join(', '));
  } catch (error) {
    console.error('❌ Erreur getPartners:', error);
  }

  // Test 2: Partenaire featured
  console.log('\n⭐ Test 2: getFeaturedPartners()');
  try {
    const featured = await getFeaturedPartners();
    console.log(`✅ ${featured.length} partenaire(s) featured`);
    if (featured.length > 0) {
      console.log('   Featured:', featured[0].nom);
    }
  } catch (error) {
    console.error('❌ Erreur getFeaturedPartners:', error);
  }

  // Test 3: Partenaire par ID (Restaurant La Forge)
  console.log('\n🔍 Test 3: getPartnerById()');
  try {
    const partners = await getPartners();
    if (partners.length > 0) {
      const partner = await getPartnerById(partners[0].id);
      if (partner) {
        console.log(`✅ Partenaire trouvé: ${partner.nom}`);
        console.log(`   Catégorie: ${partner.categorie}`);
        console.log(`   Ville: ${partner.ville}`);
      }
    }
  } catch (error) {
    console.error('❌ Erreur getPartnerById:', error);
  }

  // Test 4: Toutes les offres
  console.log('\n🎁 Test 4: getOffers()');
  try {
    const offers = await getOffers();
    console.log(`✅ ${offers.length} offres trouvées`);
    console.log('   Titres:', offers.map(o => o.titre).join(', '));
  } catch (error) {
    console.error('❌ Erreur getOffers:', error);
  }

  // Test 5: Offres disponibles
  console.log('\n✅ Test 5: getAvailableOffers()');
  try {
    const available = await getAvailableOffers();
    console.log(`✅ ${available.length} offres disponibles`);
  } catch (error) {
    console.error('❌ Erreur getAvailableOffers:', error);
  }

  // Test 6: Offres par partenaire
  console.log('\n🏪 Test 6: getOffersByPartner()');
  try {
    const partners = await getPartners();
    if (partners.length > 0) {
      const offers = await getOffersByPartner(partners[0].id);
      console.log(`✅ ${offers.length} offre(s) pour ${partners[0].nom}`);
      if (offers.length > 0) {
        console.log(`   Type: ${offers[0].type_avantage}`);
        if (offers[0].reduction_pourcentage) {
          console.log(`   Réduction: ${offers[0].reduction_pourcentage}%`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Erreur getOffersByPartner:', error);
  }

  // Test 7: Filtres par catégorie
  console.log('\n🍽️ Test 7: getPartners({ categorie: "restaurant" })');
  try {
    const restaurants = await getPartners({ categorie: 'restaurant' });
    console.log(`✅ ${restaurants.length} restaurant(s) trouvé(s)`);
  } catch (error) {
    console.error('❌ Erreur filtres:', error);
  }

  // Test 8: Filtres par type d'avantage
  console.log('\n📱 Test 8: getOffers({ typeAvantage: "qr_code" })');
  try {
    const qrOffers = await getOffers({ typeAvantage: 'qr_code' });
    console.log(`✅ ${qrOffers.length} offre(s) QR Code`);
  } catch (error) {
    console.error('❌ Erreur filtres offres:', error);
  }

  console.log('\n✨ Tests Day 2 terminés !\n');
}

/**
 * Résumé rapide des seed data
 */
export async function summarySeedData() {
  console.log('📊 Résumé Seed Data\n');

  try {
    const partners = await getPartners();
    const offers = await getOffers();
    const featured = await getFeaturedPartners();

    console.log(`✅ Partenaires: ${partners.length}`);
    console.log(`✅ Offres: ${offers.length}`);
    console.log(`✅ Featured: ${featured.length}`);
    console.log('\n📋 Liste des partenaires:');
    partners.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.nom} (${p.categorie}) - ${p.ville}`);
    });

    console.log('\n🎁 Liste des offres:');
    offers.forEach((o, i) => {
      console.log(`   ${i + 1}. ${o.titre} (${o.type_avantage})`);
      if (o.reduction_pourcentage) {
        console.log(`      → ${o.reduction_pourcentage}% de réduction`);
      }
    });
  } catch (error) {
    console.error('❌ Erreur résumé:', error);
  }
}

// Export pour utilisation dans une API route ou Server Action
export { testAvantagesModule as default };
