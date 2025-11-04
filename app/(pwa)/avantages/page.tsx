/**
 * Page Liste des Avantages (Partenaires)
 * Affiche featured carousel, filtres, et grille d'offres
 */

'use client';

import { useState, useMemo } from 'react';
import { FeaturedCarousel } from '@/components/avantages/featured-carousel';
import { OfferFilters } from '@/components/avantages/offer-filters';
import { OfferCard } from '@/components/avantages/offer-card';
import { PartnerCategory, OfferType, OfferWithPartner, PartnerWithOffers } from '@/lib/types/avantages.types';
import { Gift, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Mock data - sera remplacé par les vraies queries Supabase
const MOCK_FEATURED_PARTNERS: PartnerWithOffers[] = [
  {
    id: '1',
    nom: 'Restaurant La Forge',
    description: 'Restaurant traditionnel au cœur de Clermont-l\'Hérault. Cuisine du terroir avec produits locaux.',
    categorie: 'restaurant' as PartnerCategory,
    logo_url: null,
    adresse: '12 Place de la République',
    code_postal: '34800',
    ville: 'Clermont-l\'Hérault',
    telephone: '04 67 96 00 00',
    email: 'contact@laforge.fr',
    site_web: 'https://laforge.fr',
    horaires: 'Mar-Dim 12h-14h, 19h-22h',
    actif: true,
    featured: true,
    ordre_affichage: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    offers: [],
    activeOffersCount: 1,
  },
];

const MOCK_OFFERS: OfferWithPartner[] = [
  {
    id: '1',
    partner_id: '1',
    titre: '20% de réduction sur l\'addition',
    description: 'Profitez de 20% de réduction sur votre addition (hors boissons). Valable du lundi au jeudi.',
    type_avantage: 'qr_code' as OfferType,
    reduction_pourcentage: 20,
    reduction_montant: null,
    code_promo: null,
    qr_code_data: 'LAFORGE-20',
    image_url: null,
    conditions: 'Non cumulable avec d\'autres offres. Réservation recommandée.',
    date_debut: null,
    date_fin: null,
    actif: true,
    ordre_affichage: 1,
    nombre_utilisations: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    partner: MOCK_FEATURED_PARTNERS[0],
  },
];

export default function AvantagesPage() {
  const [featuredPartners] = useState<PartnerWithOffers[]>(MOCK_FEATURED_PARTNERS);
  const [allOffers] = useState<OfferWithPartner[]>(MOCK_OFFERS);
  const [filters, setFilters] = useState<{
    category?: PartnerCategory;
    type?: OfferType;
    search?: string;
  }>({});

  // Filtrage client-side (OK pour MVP avec peu d'offres)
  const filteredOffers = useMemo(() => {
    return allOffers.filter((offer) => {
      // Filtre catégorie
      if (filters.category && offer.partner.categorie !== filters.category) {
        return false;
      }

      // Filtre type
      if (filters.type && offer.type_avantage !== filters.type) {
        return false;
      }

      // Filtre recherche
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const titleMatch = offer.titre.toLowerCase().includes(searchLower);
        const descMatch = offer.description?.toLowerCase().includes(searchLower);
        const partnerMatch = offer.partner.nom.toLowerCase().includes(searchLower);
        
        if (!titleMatch && !descMatch && !partnerMatch) {
          return false;
        }
      }

      return true;
    });
  }, [allOffers, filters]);

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Gift className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Avantages Partenaires</h1>
        </div>
        <p className="text-muted-foreground">
          Profitez d&apos;offres exclusives chez nos partenaires locaux
        </p>
      </div>

      {/* Featured Carousel */}
      {featuredPartners.length > 0 && (
        <FeaturedCarousel partners={featuredPartners} />
      )}

      {/* Filters */}
      <OfferFilters onFilterChange={setFilters} />

      {/* Results count */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          {filteredOffers.length} {filteredOffers.length > 1 ? 'offres disponibles' : 'offre disponible'}
        </p>
      </div>

      {/* Offers Grid */}
      {filteredOffers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOffers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Aucune offre ne correspond à vos critères de recherche.
            Essayez de modifier les filtres.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
