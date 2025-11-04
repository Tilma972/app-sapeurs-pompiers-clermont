/**
 * Fonctions de requête Supabase pour les Offres (Avantages)
 * Module Avantages
 */

import { createClient } from '@/lib/supabase/server';
import {
  PartnerOffer,
  OfferWithPartner,
  OfferWithUsage,
  OfferFilters,
  OfferFormData,
  OfferActionType,
} from '@/lib/types/avantages.types';
import {
  DatabaseError,
  logError,
} from '@/lib/utils/error-handling';

// ============================================
// LECTURE (Public + Admin)
// ============================================

/**
 * Récupère toutes les offres avec filtres optionnels
 */
export async function getOffers(
  filters?: OfferFilters
): Promise<PartnerOffer[]> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('partner_offers')
      .select('*')
      .order('ordre_affichage', { ascending: true })
      .order('titre', { ascending: true });

    // Filtres
    if (filters?.partnerId) {
      query = query.eq('partner_id', filters.partnerId);
    }

    if (filters?.typeAvantage) {
      query = query.eq('type_avantage', filters.typeAvantage);
    }

    if (filters?.actif !== undefined) {
      query = query.eq('actif', filters.actif);
    }

    if (filters?.available) {
      // Offre disponible: date_debut <= now <= date_fin OU dates null
      const now = new Date().toISOString();
      query = query.or(
        `and(date_debut.lte.${now},date_fin.gte.${now}),and(date_debut.is.null,date_fin.is.null)`
      );
    }

    if (filters?.search) {
      query = query.or(
        `titre.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      throw new DatabaseError('Failed to fetch offers', error);
    }

    return data as PartnerOffer[];
  } catch (error) {
    logError(error, { 
      component: 'getOffers', 
      action: 'fetch',
      metadata: filters as Record<string, unknown> || {}
    });
    throw error instanceof DatabaseError
      ? error
      : new DatabaseError('Erreur lors de la récupération des offres');
  }
}

/**
 * Récupère une offre par ID
 */
export async function getOfferById(id: string): Promise<PartnerOffer | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('partner_offers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Pas trouvé
      }
      throw new DatabaseError('Failed to fetch offer by ID', error);
    }

    return data as PartnerOffer;
  } catch (error) {
    logError(error, { 
      component: 'getOfferById', 
      action: 'fetch',
      metadata: { offerId: id }
    });
    throw error instanceof DatabaseError
      ? error
      : new DatabaseError('Erreur lors de la récupération de l\'offre');
  }
}

/**
 * Récupère une offre avec les infos du partenaire
 */
export async function getOfferWithPartner(
  id: string
): Promise<OfferWithPartner | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('partner_offers')
      .select(
        `
        *,
        partner:partners(*)
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new DatabaseError('Failed to fetch offer with partner', error);
    }

    return data as OfferWithPartner;
  } catch (error) {
    logError(error, { 
      component: 'getOfferWithPartner', 
      action: 'fetch',
      metadata: { offerId: id }
    });
    throw error instanceof DatabaseError
      ? error
      : new DatabaseError(
          'Erreur lors de la récupération de l\'offre avec partenaire'
        );
  }
}

/**
 * Récupère toutes les offres d'un partenaire
 */
export async function getOffersByPartner(
  partnerId: string,
  activeOnly = true
): Promise<PartnerOffer[]> {
  const filters: OfferFilters = { 
    partnerId,
    ...(activeOnly && { actif: true })
  };
  return getOffers(filters);
}

/**
 * Récupère les offres disponibles (actives et dans la période)
 */
export async function getAvailableOffers(): Promise<PartnerOffer[]> {
  return getOffers({ actif: true, available: true });
}

// ============================================
// TRACKING USAGE
// ============================================

/**
 * Enregistre une utilisation d'offre (view, QR génération, code copié)
 */
export async function trackOfferUsage(
  offerId: string,
  userId: string,
  actionType: OfferActionType,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('offer_usage')
      .insert({
        offer_id: offerId,
        user_id: userId,
        action_type: actionType,
        metadata,
      });

    if (error) {
      throw new DatabaseError('Failed to track offer usage', error);
    }

    // Incrémenter le compteur nombre_utilisations
    const { error: updateError } = await supabase
      .from('partner_offers')
      .update({
        nombre_utilisations: supabase.rpc('increment', { 
          x: 1 
        }) as unknown as number
      })
      .eq('id', offerId);

    if (updateError) {
      // Log mais ne pas bloquer (compteur non critique)
      logError(updateError, {
        component: 'trackOfferUsage',
        action: 'increment',
        metadata: { offerId }
      });
    }
  } catch (error) {
    logError(error, { 
      component: 'trackOfferUsage', 
      action: 'insert',
      userId,
      metadata: { offerId, actionType }
    });
    throw error instanceof DatabaseError
      ? error
      : new DatabaseError('Erreur lors de l\'enregistrement de l\'utilisation');
  }
}

/**
 * Récupère une offre avec ses stats d'usage
 */
export async function getOfferWithUsage(
  id: string
): Promise<OfferWithUsage | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('partner_offers')
      .select(
        `
        *,
        usage:offer_usage(*)
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new DatabaseError('Failed to fetch offer with usage', error);
    }

    const offer = data as PartnerOffer & { 
      usage: Array<{ action_type: OfferActionType }> 
    };
    
    const usage = Array.isArray(offer.usage) ? offer.usage : [];
    
    const totalViews = usage.filter(u => u.action_type === 'view').length;
    const totalQrGenerations = usage.filter(u => u.action_type === 'qr_generation').length;
    const totalCodeCopies = usage.filter(u => u.action_type === 'code_copy').length;

    return {
      ...offer,
      usage,
      totalViews,
      totalQrGenerations,
      totalCodeCopies,
    } as OfferWithUsage;
  } catch (error) {
    logError(error, { 
      component: 'getOfferWithUsage', 
      action: 'fetch',
      metadata: { offerId: id }
    });
    throw error instanceof DatabaseError
      ? error
      : new DatabaseError(
          'Erreur lors de la récupération de l\'offre avec usage'
        );
  }
}

// ============================================
// CRÉATION/ÉDITION (Admin uniquement)
// ============================================

/**
 * Crée une nouvelle offre
 */
export async function createOffer(
  data: OfferFormData
): Promise<PartnerOffer> {
  try {
    const supabase = await createClient();

    const { data: offer, error } = await supabase
      .from('partner_offers')
      .insert(data)
      .select()
      .single();

    if (error) {
      throw new DatabaseError('Failed to create offer', error);
    }

    return offer as PartnerOffer;
  } catch (error) {
    logError(error, { 
      component: 'createOffer', 
      action: 'insert',
      metadata: { offerTitle: data.titre, partnerId: data.partner_id }
    });
    throw error instanceof DatabaseError
      ? error
      : new DatabaseError('Erreur lors de la création de l\'offre');
  }
}

/**
 * Met à jour une offre
 */
export async function updateOffer(
  id: string,
  data: Partial<OfferFormData>
): Promise<PartnerOffer> {
  try {
    const supabase = await createClient();

    const { data: offer, error } = await supabase
      .from('partner_offers')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new DatabaseError('Failed to update offer', error);
    }

    return offer as PartnerOffer;
  } catch (error) {
    logError(error, { 
      component: 'updateOffer', 
      action: 'update',
      metadata: { offerId: id }
    });
    throw error instanceof DatabaseError
      ? error
      : new DatabaseError('Erreur lors de la mise à jour de l\'offre');
  }
}

/**
 * Supprime une offre (soft delete: actif = false)
 */
export async function deleteOffer(id: string): Promise<void> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('partner_offers')
      .update({ actif: false })
      .eq('id', id);

    if (error) {
      throw new DatabaseError('Failed to delete offer', error);
    }
  } catch (error) {
    logError(error, { 
      component: 'deleteOffer', 
      action: 'update',
      metadata: { offerId: id }
    });
    throw error instanceof DatabaseError
      ? error
      : new DatabaseError('Erreur lors de la suppression de l\'offre');
  }
}

/**
 * Supprime définitivement une offre (hard delete)
 */
export async function hardDeleteOffer(id: string): Promise<void> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('partner_offers')
      .delete()
      .eq('id', id);

    if (error) {
      throw new DatabaseError('Failed to hard delete offer', error);
    }
  } catch (error) {
    logError(error, { 
      component: 'hardDeleteOffer', 
      action: 'delete',
      metadata: { offerId: id }
    });
    throw error instanceof DatabaseError
      ? error
      : new DatabaseError(
          'Erreur lors de la suppression définitive de l\'offre'
        );
  }
}
