/**
 * Types pour le module Avantages (Partenaires)
 * Générés à partir du schéma Supabase
 */

// ============================================
// ENUMS
// ============================================

export type PartnerCategory =
  | 'restaurant'
  | 'commerce'
  | 'service'
  | 'loisir'
  | 'sante'
  | 'autre';

export type OfferType = 'qr_code' | 'code_promo';

export type OfferActionType = 'view' | 'qr_generation' | 'code_copy';

// ============================================
// BASE TYPES (Database tables)
// ============================================

export interface Partner {
  id: string;
  nom: string;
  description: string;
  categorie: PartnerCategory;
  logo_url: string | null;
  adresse: string | null;
  code_postal: string | null;
  ville: string | null;
  telephone: string | null;
  email: string | null;
  site_web: string | null;
  horaires: string | null;
  actif: boolean;
  featured: boolean;
  ordre_affichage: number;
  created_at: string;
  updated_at: string;
}

export interface PartnerOffer {
  id: string;
  partner_id: string;
  titre: string;
  description: string;
  type_avantage: OfferType;
  reduction_pourcentage: number | null;
  reduction_montant: number | null;
  code_promo: string | null;
  qr_code_data: string | null;
  image_url: string | null;
  conditions: string | null;
  date_debut: string | null;
  date_fin: string | null;
  actif: boolean;
  ordre_affichage: number;
  nombre_utilisations: number;
  created_at: string;
  updated_at: string;
}

export interface OfferUsage {
  id: string;
  offer_id: string;
  user_id: string;
  action_type: OfferActionType;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// ============================================
// COMPOSITE TYPES (avec relations)
// ============================================

export interface PartnerWithOffers extends Partner {
  offers: PartnerOffer[];
  activeOffersCount: number;
}

export interface OfferWithPartner extends PartnerOffer {
  partner: Partner;
}

export interface OfferWithUsage extends PartnerOffer {
  usage: OfferUsage[];
  totalViews: number;
  totalQrGenerations: number;
  totalCodeCopies: number;
}

// ============================================
// FILTER & QUERY TYPES
// ============================================

export interface PartnerFilters {
  categorie?: PartnerCategory;
  actif?: boolean;
  featured?: boolean;
  search?: string; // nom ou ville
}

export interface OfferFilters {
  partnerId?: string;
  typeAvantage?: OfferType;
  actif?: boolean;
  available?: boolean; // date_debut <= now <= date_fin
  search?: string; // titre ou description
}

// ============================================
// FORM TYPES (pour création/édition)
// ============================================

export interface PartnerFormData {
  nom: string;
  description: string;
  categorie: PartnerCategory;
  logo_url?: string;
  adresse?: string;
  code_postal?: string;
  ville?: string;
  telephone?: string;
  email?: string;
  site_web?: string;
  horaires?: string;
  actif: boolean;
  featured: boolean;
  ordre_affichage: number;
}

export interface OfferFormData {
  partner_id: string;
  titre: string;
  description: string;
  type_avantage: OfferType;
  reduction_pourcentage?: number;
  reduction_montant?: number;
  code_promo?: string;
  qr_code_data?: string;
  image_url?: string;
  conditions?: string;
  date_debut?: string;
  date_fin?: string;
  actif: boolean;
  ordre_affichage: number;
}

// ============================================
// STATS TYPES
// ============================================

export interface PartnerStats {
  partnerId: string;
  partnerName: string;
  totalOffers: number;
  activeOffers: number;
  totalViews: number;
  totalQrGenerations: number;
  totalCodeCopies: number;
}

export interface GlobalAvantagesStats {
  totalPartners: number;
  activePartners: number;
  totalOffers: number;
  activeOffers: number;
  totalUsage: number;
  mostPopularOffer: {
    id: string;
    titre: string;
    partnerName: string;
    usageCount: number;
  } | null;
}
