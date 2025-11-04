/**
 * Fonctions de requête Supabase pour les Partenaires
 * Module Avantages
 */

import { createClient } from '@/lib/supabase/server';
import {
  Partner,
  PartnerWithOffers,
  PartnerFilters,
  PartnerFormData,
  PartnerStats,
} from '@/lib/types/avantages.types';
import {
  DatabaseError,
  logError,
} from '@/lib/utils/error-handling';

// ============================================
// LECTURE (Public + Admin)
// ============================================

/**
 * Récupère tous les partenaires avec filtres optionnels
 */
export async function getPartners(
  filters?: PartnerFilters
): Promise<Partner[]> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('partners')
      .select('*')
      .order('ordre_affichage', { ascending: true })
      .order('nom', { ascending: true });

    // Filtres
    if (filters?.categorie) {
      query = query.eq('categorie', filters.categorie);
    }

    if (filters?.actif !== undefined) {
      query = query.eq('actif', filters.actif);
    }

    if (filters?.featured !== undefined) {
      query = query.eq('featured', filters.featured);
    }

    if (filters?.search) {
      query = query.or(
        `nom.ilike.%${filters.search}%,ville.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      throw new DatabaseError('Failed to fetch partners', error);
    }

    return data as Partner[];
  } catch (error) {
    logError(error, { 
      component: 'getPartners', 
      action: 'fetch',
      metadata: filters as Record<string, unknown>
    });
    throw error instanceof DatabaseError
      ? error
      : new DatabaseError('Erreur lors de la récupération des partenaires');
  }
}

/**
 * Récupère un partenaire par ID
 */
export async function getPartnerById(id: string): Promise<Partner | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Pas trouvé
      }
      throw new DatabaseError('Failed to fetch partner by ID', error);
    }

    return data as Partner;
  } catch (error) {
    logError(error, { 
      component: 'getPartnerById', 
      action: 'fetch',
      metadata: { partnerId: id }
    });
    throw error instanceof DatabaseError
      ? error
      : new DatabaseError('Erreur lors de la récupération du partenaire');
  }
}

/**
 * Récupère un partenaire avec ses offres
 */
export async function getPartnerWithOffers(
  id: string
): Promise<PartnerWithOffers | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('partners')
      .select(
        `
        *,
        offers:partner_offers(*)
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new DatabaseError('Failed to fetch partner with offers', error);
    }

    const partner = data as Partner & { offers: Array<{ actif?: boolean }> };
    const offers = Array.isArray(partner.offers) ? partner.offers : [];
    const activeOffersCount = offers.filter(
      (o) => o.actif === true
    ).length;

    return {
      ...partner,
      offers,
      activeOffersCount,
    } as PartnerWithOffers;
  } catch (error) {
    logError(error, { 
      component: 'getPartnerWithOffers', 
      action: 'fetch',
      metadata: { partnerId: id }
    });
    throw error instanceof DatabaseError
      ? error
      : new DatabaseError(
          'Erreur lors de la récupération du partenaire avec offres'
        );
  }
}

/**
 * Récupère les partenaires mis en avant (featured)
 */
export async function getFeaturedPartners(): Promise<Partner[]> {
  return getPartners({ featured: true, actif: true });
}

/**
 * Récupère les partenaires par catégorie
 */
export async function getPartnersByCategory(
  categorie: Partner['categorie']
): Promise<Partner[]> {
  return getPartners({ categorie, actif: true });
}

// ============================================
// STATS (Admin)
// ============================================

/**
 * Récupère les stats d'un partenaire
 */
export async function getPartnerStats(
  partnerId: string
): Promise<PartnerStats | null> {
  try {
    const supabase = await createClient();

    // Récupérer le partenaire avec ses offres et usages
    const { data, error } = await supabase
      .from('partners')
      .select(
        `
        id,
        nom,
        offers:partner_offers(
          id,
          actif,
          usage:offer_usage(action_type)
        )
      `
      )
      .eq('id', partnerId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new DatabaseError('Failed to fetch partner stats', error);
    }

    const partner = data as {
      id: string;
      nom: string;
      offers: Array<{
        id: string;
        actif: boolean;
        usage: Array<{ action_type: string }>;
      }>;
    };

    const totalOffers = partner.offers.length;
    const activeOffers = partner.offers.filter((o) => o.actif).length;

    let totalViews = 0;
    let totalQrGenerations = 0;
    let totalCodeCopies = 0;

    partner.offers.forEach((offer) => {
      offer.usage.forEach((u) => {
        if (u.action_type === 'view') totalViews++;
        if (u.action_type === 'qr_generation') totalQrGenerations++;
        if (u.action_type === 'code_copy') totalCodeCopies++;
      });
    });

    return {
      partnerId: partner.id,
      partnerName: partner.nom,
      totalOffers,
      activeOffers,
      totalViews,
      totalQrGenerations,
      totalCodeCopies,
    };
  } catch (error) {
    logError(error, { 
      component: 'getPartnerStats', 
      action: 'fetch',
      metadata: { partnerId }
    });
    throw error instanceof DatabaseError
      ? error
      : new DatabaseError('Erreur lors de la récupération des stats partenaire');
  }
}

// ============================================
// CRÉATION/ÉDITION (Admin uniquement)
// ============================================

/**
 * Crée un nouveau partenaire
 */
export async function createPartner(
  data: PartnerFormData
): Promise<Partner> {
  try {
    const supabase = await createClient();

    const { data: partner, error } = await supabase
      .from('partners')
      .insert(data)
      .select()
      .single();

    if (error) {
      throw new DatabaseError('Failed to create partner', error);
    }

    return partner as Partner;
  } catch (error) {
    logError(error, { 
      component: 'createPartner', 
      action: 'insert',
      metadata: { partnerName: data.nom }
    });
    throw error instanceof DatabaseError
      ? error
      : new DatabaseError('Erreur lors de la création du partenaire');
  }
}

/**
 * Met à jour un partenaire
 */
export async function updatePartner(
  id: string,
  data: Partial<PartnerFormData>
): Promise<Partner> {
  try {
    const supabase = await createClient();

    const { data: partner, error } = await supabase
      .from('partners')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new DatabaseError('Failed to update partner', error);
    }

    return partner as Partner;
  } catch (error) {
    logError(error, { 
      component: 'updatePartner', 
      action: 'update',
      metadata: { partnerId: id }
    });
    throw error instanceof DatabaseError
      ? error
      : new DatabaseError('Erreur lors de la mise à jour du partenaire');
  }
}

/**
 * Supprime un partenaire (soft delete: actif = false)
 */
export async function deletePartner(id: string): Promise<void> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('partners')
      .update({ actif: false })
      .eq('id', id);

    if (error) {
      throw new DatabaseError('Failed to delete partner', error);
    }
  } catch (error) {
    logError(error, { 
      component: 'deletePartner', 
      action: 'update',
      metadata: { partnerId: id }
    });
    throw error instanceof DatabaseError
      ? error
      : new DatabaseError('Erreur lors de la suppression du partenaire');
  }
}

/**
 * Supprime définitivement un partenaire (hard delete)
 */
export async function hardDeletePartner(id: string): Promise<void> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('partners')
      .delete()
      .eq('id', id);

    if (error) {
      throw new DatabaseError('Failed to hard delete partner', error);
    }
  } catch (error) {
    logError(error, { 
      component: 'hardDeletePartner', 
      action: 'delete',
      metadata: { partnerId: id }
    });
    throw error instanceof DatabaseError
      ? error
      : new DatabaseError(
          'Erreur lors de la suppression définitive du partenaire'
        );
  }
}
