/**
 * Helpers Supabase pour la gestion des demandes de versement
 * Centralise toutes les requêtes liées aux versements
 */

import { SupabaseClient } from "@supabase/supabase-js";
import {
  DemandeVersement,
  DemandeVersementAvecUtilisateur,
  DemandeVersementDetaillee,
  DemandeVersementFilters,
  DemandeVersementSortOptions,
  StatistiquesDemandes,
  StatutDemandeType,
} from "@/lib/types";
import { DatabaseError, logError } from "@/lib/utils/error-handling";

// =====================================================
// RÉCUPÉRATION DES DEMANDES
// =====================================================

/**
 * Récupère toutes les demandes de versement d'un utilisateur
 */
export async function getUserDemandes(
  supabase: SupabaseClient,
  userId: string,
  limit: number = 10
): Promise<DemandeVersement[]> {
  try {
    const { data, error } = await supabase
      .from('demandes_versement')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new DatabaseError('Failed to fetch user demandes', error);
    }

    return data as DemandeVersement[];
  } catch (error) {
    logError(error, {
      component: 'getUserDemandes',
      action: 'fetch',
      userId,
    });
    return [];
  }
}

/**
 * Récupère une demande spécifique avec tous les détails
 */
export async function getDemandeById(
  supabase: SupabaseClient,
  demandeId: string
): Promise<DemandeVersementDetaillee | null> {
  try {
    const { data, error } = await supabase
      .from('demandes_versement')
      .select(`
        *,
        user:user_id (
          id,
          full_name,
          display_name,
          email,
          phone
        ),
        equipe:equipe_id (
          id,
          nom,
          numero
        ),
        validated_by_user:validated_by (
          id,
          full_name
        ),
        paid_by_user:paid_by (
          id,
          full_name
        ),
        rejected_by_user:rejected_by (
          id,
          full_name
        )
      `)
      .eq('id', demandeId)
      .single();

    if (error) {
      throw new DatabaseError('Failed to fetch demande details', error);
    }

    return data as unknown as DemandeVersementDetaillee;
  } catch (error) {
    logError(error, {
      component: 'getDemandeById',
      action: 'fetch',
      demandeId,
    });
    return null;
  }
}

/**
 * Récupère toutes les demandes avec filtres (pour trésorier)
 */
export async function getAllDemandes(
  supabase: SupabaseClient,
  filters?: DemandeVersementFilters,
  sort?: DemandeVersementSortOptions,
  limit: number = 50,
  offset: number = 0
): Promise<DemandeVersementAvecUtilisateur[]> {
  try {
    let query = supabase
      .from('demandes_versement')
      .select(`
        *,
        user:user_id (
          id,
          full_name,
          display_name,
          email
        ),
        equipe:equipe_id (
          id,
          nom,
          numero
        )
      `);

    // Appliquer les filtres
    if (filters?.statut) {
      if (Array.isArray(filters.statut)) {
        query = query.in('statut', filters.statut);
      } else {
        query = query.eq('statut', filters.statut);
      }
    }

    if (filters?.type_versement) {
      query = query.eq('type_versement', filters.type_versement);
    }

    if (filters?.equipe_id) {
      query = query.eq('equipe_id', filters.equipe_id);
    }

    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    if (filters?.date_debut) {
      query = query.gte('created_at', filters.date_debut);
    }

    if (filters?.date_fin) {
      query = query.lte('created_at', filters.date_fin);
    }

    if (filters?.montant_min) {
      query = query.gte('montant', filters.montant_min);
    }

    if (filters?.montant_max) {
      query = query.lte('montant', filters.montant_max);
    }

    // Appliquer le tri
    const sortField = sort?.field || 'created_at';
    const sortDirection = sort?.direction || 'desc';
    query = query.order(sortField, { ascending: sortDirection === 'asc' });

    // Appliquer pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      throw new DatabaseError('Failed to fetch all demandes', error);
    }

    return data as unknown as DemandeVersementAvecUtilisateur[];
  } catch (error) {
    logError(error, {
      component: 'getAllDemandes',
      action: 'fetch',
      filters,
    });
    return [];
  }
}

/**
 * Compte le nombre total de demandes avec filtres (pour pagination)
 */
export async function countDemandes(
  supabase: SupabaseClient,
  filters?: DemandeVersementFilters
): Promise<number> {
  try {
    let query = supabase
      .from('demandes_versement')
      .select('*', { count: 'exact', head: true });

    // Appliquer les mêmes filtres que getAllDemandes
    if (filters?.statut) {
      if (Array.isArray(filters.statut)) {
        query = query.in('statut', filters.statut);
      } else {
        query = query.eq('statut', filters.statut);
      }
    }

    if (filters?.type_versement) {
      query = query.eq('type_versement', filters.type_versement);
    }

    if (filters?.equipe_id) {
      query = query.eq('equipe_id', filters.equipe_id);
    }

    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    if (filters?.date_debut) {
      query = query.gte('created_at', filters.date_debut);
    }

    if (filters?.date_fin) {
      query = query.lte('created_at', filters.date_fin);
    }

    if (filters?.montant_min) {
      query = query.gte('montant', filters.montant_min);
    }

    if (filters?.montant_max) {
      query = query.lte('montant', filters.montant_max);
    }

    const { count, error } = await query;

    if (error) {
      throw new DatabaseError('Failed to count demandes', error);
    }

    return count || 0;
  } catch (error) {
    logError(error, {
      component: 'countDemandes',
      action: 'count',
      filters,
    });
    return 0;
  }
}

// =====================================================
// STATISTIQUES
// =====================================================

/**
 * Récupère les statistiques des demandes (pour dashboard trésorier)
 */
export async function getStatistiquesDemandes(
  supabase: SupabaseClient,
  equipe_id?: string
): Promise<StatistiquesDemandes | null> {
  try {
    let query = supabase
      .from('demandes_versement')
      .select('statut, montant');

    if (equipe_id) {
      query = query.eq('equipe_id', equipe_id);
    }

    const { data, error } = await query;

    if (error) {
      throw new DatabaseError('Failed to fetch statistiques', error);
    }

    // Calculer les statistiques
    const stats: StatistiquesDemandes = {
      total_demandes: data.length,
      en_attente: 0,
      en_cours: 0,
      payees: 0,
      rejetees: 0,
      montant_total_en_attente: 0,
      montant_total_paye: 0,
    };

    data.forEach((demande) => {
      switch (demande.statut as StatutDemandeType) {
        case 'en_attente':
          stats.en_attente++;
          stats.montant_total_en_attente += Number(demande.montant);
          break;
        case 'en_cours':
        case 'validee':
          stats.en_cours++;
          stats.montant_total_en_attente += Number(demande.montant);
          break;
        case 'payee':
          stats.payees++;
          stats.montant_total_paye += Number(demande.montant);
          break;
        case 'rejetee':
          stats.rejetees++;
          break;
      }
    });

    return stats;
  } catch (error) {
    logError(error, {
      component: 'getStatistiquesDemandes',
      action: 'fetch',
      equipe_id,
    });
    return null;
  }
}

// =====================================================
// VALIDATION & VÉRIFICATIONS
// =====================================================

/**
 * Vérifie si l'utilisateur a suffisamment de solde disponible
 */
export async function hasSufficientBalance(
  supabase: SupabaseClient,
  userId: string,
  montant: number
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('comptes_sp')
      .select('solde_disponible')
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new DatabaseError('Failed to check balance', error);
    }

    const soldeDisponible = data?.solde_disponible || 0;
    return soldeDisponible >= montant;
  } catch (error) {
    logError(error, {
      component: 'hasSufficientBalance',
      action: 'check',
      userId,
      montant,
    });
    return false;
  }
}

/**
 * Récupère le solde disponible d'un utilisateur
 */
export async function getUserBalance(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('comptes_sp')
      .select('solde_disponible')
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new DatabaseError('Failed to get user balance', error);
    }

    return data?.solde_disponible || 0;
  } catch (error) {
    logError(error, {
      component: 'getUserBalance',
      action: 'fetch',
      userId,
    });
    return 0;
  }
}

/**
 * Vérifie si l'utilisateur a des demandes en attente
 */
export async function hasPendingDemandes(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('demandes_versement')
      .select('id')
      .eq('user_id', userId)
      .in('statut', ['en_attente', 'en_cours', 'validee'])
      .limit(1);

    if (error) {
      throw new DatabaseError('Failed to check pending demandes', error);
    }

    return (data?.length || 0) > 0;
  } catch (error) {
    logError(error, {
      component: 'hasPendingDemandes',
      action: 'check',
      userId,
    });
    return false;
  }
}

// =====================================================
// ACTIONS (via RPC - appelle les fonctions PostgreSQL)
// =====================================================

/**
 * Crée une nouvelle demande de versement
 * Utilise la fonction PostgreSQL qui bloque automatiquement le montant
 */
export async function createDemandeVersement(
  supabase: SupabaseClient,
  params: {
    montant: number
    type_versement: string
    iban?: string
    nom_beneficiaire?: string
    notes_utilisateur?: string
  }
): Promise<{ success: boolean; demande_id?: string; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('creer_demande_versement', {
      p_montant: params.montant,
      p_type_versement: params.type_versement,
      p_iban: params.iban || null,
      p_nom_beneficiaire: params.nom_beneficiaire || null,
      p_notes_utilisateur: params.notes_utilisateur || null,
    });

    if (error) {
      throw new DatabaseError('Failed to create demande', error);
    }

    return { success: true, demande_id: data };
  } catch (error: any) {
    logError(error, {
      component: 'createDemandeVersement',
      action: 'create',
      params,
    });
    return {
      success: false,
      error: error?.message || 'Erreur lors de la création de la demande',
    };
  }
}

/**
 * Valide une demande (trésorier uniquement)
 */
export async function validateDemande(
  supabase: SupabaseClient,
  demandeId: string,
  notesTresorier?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc('valider_demande_versement', {
      p_demande_id: demandeId,
      p_notes_tresorier: notesTresorier || null,
    });

    if (error) {
      throw new DatabaseError('Failed to validate demande', error);
    }

    return { success: true };
  } catch (error: any) {
    logError(error, {
      component: 'validateDemande',
      action: 'validate',
      demandeId,
    });
    return {
      success: false,
      error: error?.message || 'Erreur lors de la validation',
    };
  }
}

/**
 * Marque une demande comme payée (trésorier uniquement)
 */
export async function markDemandePaid(
  supabase: SupabaseClient,
  demandeId: string,
  preuveUrl?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc('marquer_demande_payee', {
      p_demande_id: demandeId,
      p_preuve_url: preuveUrl || null,
    });

    if (error) {
      throw new DatabaseError('Failed to mark as paid', error);
    }

    return { success: true };
  } catch (error: any) {
    logError(error, {
      component: 'markDemandePaid',
      action: 'mark_paid',
      demandeId,
    });
    return {
      success: false,
      error: error?.message || 'Erreur lors du marquage comme payée',
    };
  }
}

/**
 * Rejette une demande (trésorier uniquement)
 */
export async function rejectDemande(
  supabase: SupabaseClient,
  demandeId: string,
  raison: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc('rejeter_demande_versement', {
      p_demande_id: demandeId,
      p_raison: raison,
    });

    if (error) {
      throw new DatabaseError('Failed to reject demande', error);
    }

    return { success: true };
  } catch (error: any) {
    logError(error, {
      component: 'rejectDemande',
      action: 'reject',
      demandeId,
    });
    return {
      success: false,
      error: error?.message || 'Erreur lors du rejet',
    };
  }
}
