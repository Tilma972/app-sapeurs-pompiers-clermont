/**
 * Helpers Supabase pour le système de demandes de pot d'équipe
 * Fonctions pour récupérer et gérer les demandes de pot d'équipe
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'
import {
  DemandePotEquipeAvecDetails,
  MouvementPotEquipeAvecDetails,
  CreateDemandePotEquipeInput,
  StatutDemandePotType,
} from '@/lib/types/pot-equipe'
import { logError } from '@/lib/utils/error-handling'

type SupabaseClientType = SupabaseClient<Database>

// =====================================================
// TYPES DE RETOUR
// =====================================================

type FunctionResult<T = void> = {
  success: boolean
  error?: string
  data?: T
}

type RPCResult = {
  success: boolean
  demande_id?: string
  nouveau_solde?: number
  error?: string
}

// =====================================================
// RÉCUPÉRATION DES DEMANDES
// =====================================================

/**
 * Récupère toutes les demandes de pot d'une équipe
 */
export async function getEquipeDemandes(
  supabase: SupabaseClientType,
  equipeId: string
): Promise<DemandePotEquipeAvecDetails[]> {
  try {
    const { data, error } = await supabase
      .from('demandes_pot_equipe' as keyof Database['public']['Tables'])
      .select(`
        *,
        demandeur:profiles!demandes_pot_equipe_demandeur_id_fkey(id, full_name, display_name, email),
        equipe:equipes!demandes_pot_equipe_equipe_id_fkey(id, nom, numero),
        validateur:profiles!demandes_pot_equipe_validated_by_fkey(id, full_name, display_name),
        payeur:profiles!demandes_pot_equipe_paid_by_fkey(id, full_name, display_name)
      `)
      .eq('equipe_id', equipeId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []) as unknown as DemandePotEquipeAvecDetails[]
  } catch (error) {
    logError(error, {
      component: 'getEquipeDemandes',
      action: 'fetch',
      metadata: { equipeId }
    })
    return []
  }
}

/**
 * Récupère toutes les demandes avec filtres optionnels (pour le trésorier)
 */
export async function getAllDemandesPot(
  supabase: SupabaseClientType,
  filters?: {
    statut?: StatutDemandePotType | StatutDemandePotType[]
    equipeId?: string
  }
): Promise<DemandePotEquipeAvecDetails[]> {
  try {
    let query = supabase
      .from('demandes_pot_equipe' as keyof Database['public']['Tables'])
      .select(`
        *,
        demandeur:profiles!demandes_pot_equipe_demandeur_id_fkey(id, full_name, display_name, email),
        equipe:equipes!demandes_pot_equipe_equipe_id_fkey(id, nom, numero),
        validateur:profiles!demandes_pot_equipe_validated_by_fkey(id, full_name, display_name),
        payeur:profiles!demandes_pot_equipe_paid_by_fkey(id, full_name, display_name)
      `)

    // Appliquer les filtres
    if (filters?.statut) {
      if (Array.isArray(filters.statut)) {
        query = query.in('statut', filters.statut)
      } else {
        query = query.eq('statut', filters.statut)
      }
    }

    if (filters?.equipeId) {
      query = query.eq('equipe_id', filters.equipeId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    return (data || []) as unknown as DemandePotEquipeAvecDetails[]
  } catch (error) {
    logError(error, {
      component: 'getAllDemandesPot',
      action: 'fetch',
      metadata: { filters }
    })
    return []
  }
}

/**
 * Récupère une demande spécifique par son ID
 */
export async function getDemandePotById(
  supabase: SupabaseClientType,
  demandeId: string
): Promise<DemandePotEquipeAvecDetails | null> {
  try {
    const { data, error } = await supabase
      .from('demandes_pot_equipe' as keyof Database['public']['Tables'])
      .select(`
        *,
        demandeur:profiles!demandes_pot_equipe_demandeur_id_fkey(id, full_name, display_name, email),
        equipe:equipes!demandes_pot_equipe_equipe_id_fkey(id, nom, numero),
        validateur:profiles!demandes_pot_equipe_validated_by_fkey(id, full_name, display_name),
        payeur:profiles!demandes_pot_equipe_paid_by_fkey(id, full_name, display_name)
      `)
      .eq('id', demandeId)
      .single()

    if (error) throw error

    return data as unknown as DemandePotEquipeAvecDetails
  } catch (error) {
    logError(error, {
      component: 'getDemandePotById',
      action: 'fetch',
      metadata: { demandeId }
    })
    return null
  }
}

// =====================================================
// RÉCUPÉRATION DES MOUVEMENTS
// =====================================================

/**
 * Récupère l'historique des mouvements d'une équipe
 */
export async function getMouvementsPotEquipe(
  supabase: SupabaseClientType,
  equipeId: string,
  options?: {
    limit?: number
    offset?: number
  }
): Promise<MouvementPotEquipeAvecDetails[]> {
  try {
    let query = supabase
      .from('mouvements_pot_equipe' as keyof Database['public']['Tables'])
      .select(`
        *,
        auteur:profiles!mouvements_pot_equipe_created_by_fkey(id, full_name, display_name),
        demande:demandes_pot_equipe!mouvements_pot_equipe_demande_pot_id_fkey(id, titre, montant)
      `)
      .eq('equipe_id', equipeId)
      .order('created_at', { ascending: false })

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) throw error

    return (data || []) as unknown as MouvementPotEquipeAvecDetails[]
  } catch (error) {
    logError(error, {
      component: 'getMouvementsPotEquipe',
      action: 'fetch',
      metadata: { equipeId, options }
    })
    return []
  }
}

// =====================================================
// STATISTIQUES
// =====================================================

/**
 * Récupère les statistiques des demandes pour le trésorier
 */
export async function getStatistiquesPot(
  supabase: SupabaseClientType
): Promise<{
  total_en_attente: number
  total_en_cours: number
  total_payees: number
  montant_en_attente: number
  montant_paye_mois: number
}> {
  try {
    // Compter les demandes en attente
    const { count: countEnAttente } = await supabase
      .from('demandes_pot_equipe' as keyof Database['public']['Tables'])
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'en_attente')

    // Compter les demandes en cours
    const { count: countEnCours } = await supabase
      .from('demandes_pot_equipe' as keyof Database['public']['Tables'])
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'en_cours')

    // Compter les demandes payées
    const { count: countPayees } = await supabase
      .from('demandes_pot_equipe' as keyof Database['public']['Tables'])
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'payee')

    // Somme des montants en attente
    const { data: dataEnAttente } = await supabase
      .from('demandes_pot_equipe' as keyof Database['public']['Tables'])
      .select('montant')
      .eq('statut', 'en_attente')

    const montantEnAttente = (dataEnAttente || []).reduce(
      (sum, row) => sum + (row.montant || 0),
      0
    )

    // Somme des montants payés ce mois
    const debutMois = new Date()
    debutMois.setDate(1)
    debutMois.setHours(0, 0, 0, 0)

    const { data: dataPayeesMois } = await supabase
      .from('demandes_pot_equipe' as keyof Database['public']['Tables'])
      .select('montant')
      .eq('statut', 'payee')
      .gte('paid_at', debutMois.toISOString())

    const montantPayeMois = (dataPayeesMois || []).reduce(
      (sum, row) => sum + (row.montant || 0),
      0
    )

    return {
      total_en_attente: countEnAttente || 0,
      total_en_cours: countEnCours || 0,
      total_payees: countPayees || 0,
      montant_en_attente: montantEnAttente,
      montant_paye_mois: montantPayeMois,
    }
  } catch (error) {
    logError(error, { component: 'getStatistiquesPot', action: 'calculate' })
    return {
      total_en_attente: 0,
      total_en_cours: 0,
      total_payees: 0,
      montant_en_attente: 0,
      montant_paye_mois: 0,
    }
  }
}

/**
 * Récupère le solde du pot d'équipe
 */
export async function getSoldePotEquipe(
  supabase: SupabaseClientType,
  equipeId: string
): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('equipes')
      .select('solde_pot_equipe')
      .eq('id', equipeId)
      .single()

    if (error) throw error

    return data?.solde_pot_equipe || 0
  } catch (error) {
    logError(error, {
      component: 'getSoldePotEquipe',
      action: 'fetch',
      metadata: { equipeId }
    })
    return 0
  }
}

// =====================================================
// APPELS DE FONCTIONS POSTGRESQL
// =====================================================

/**
 * Crée une nouvelle demande de pot d'équipe
 */
export async function createDemandePotEquipe(
  supabase: SupabaseClientType,
  input: CreateDemandePotEquipeInput
): Promise<FunctionResult<{ demande_id: string }>> {
  try {
    const { data, error } = await supabase.rpc('creer_demande_pot_equipe', {
      p_equipe_id: input.equipe_id,
      p_titre: input.titre,
      p_description: input.description,
      p_montant: input.montant,
      p_categorie: input.categorie,
      p_notes_demandeur: input.notes_demandeur || null,
    })

    if (error) throw error

    const result = (data as unknown as RPCResult[])?.[0]

    if (!result?.success) {
      return {
        success: false,
        error: result?.error || 'Erreur lors de la création de la demande',
      }
    }

    return {
      success: true,
      data: { demande_id: result.demande_id! },
    }
  } catch (error) {
    logError(error, {
      component: 'createDemandePotEquipe',
      action: 'rpc',
      metadata: { input }
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

/**
 * Valide une demande de pot d'équipe
 */
export async function validateDemandePot(
  supabase: SupabaseClientType,
  demandeId: string,
  notesTresorier?: string
): Promise<FunctionResult> {
  try {
    const { data, error } = await supabase.rpc('valider_demande_pot_equipe', {
      p_demande_id: demandeId,
      p_notes_tresorier: notesTresorier || null,
    })

    if (error) throw error

    const result = (data as unknown as RPCResult[])?.[0]

    if (!result?.success) {
      return {
        success: false,
        error: result?.error || 'Erreur lors de la validation',
      }
    }

    return { success: true }
  } catch (error) {
    logError(error, {
      component: 'validateDemandePot',
      action: 'rpc',
      metadata: { demandeId, notesTresorier }
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

/**
 * Marque une demande comme payée
 */
export async function markDemandePotPaid(
  supabase: SupabaseClientType,
  demandeId: string,
  preuvePaiementUrl?: string
): Promise<FunctionResult> {
  try {
    const { data, error } = await supabase.rpc('marquer_demande_pot_equipe_payee', {
      p_demande_id: demandeId,
      p_preuve_paiement_url: preuvePaiementUrl || null,
    })

    if (error) throw error

    const result = (data as unknown as RPCResult[])?.[0]

    if (!result?.success) {
      return {
        success: false,
        error: result?.error || 'Erreur lors du marquage comme payée',
      }
    }

    return { success: true }
  } catch (error) {
    logError(error, {
      component: 'markDemandePotPaid',
      action: 'rpc',
      metadata: { demandeId, preuvePaiementUrl }
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

/**
 * Rejette une demande de pot d'équipe
 */
export async function rejectDemandePot(
  supabase: SupabaseClientType,
  demandeId: string,
  raison: string
): Promise<FunctionResult> {
  try {
    const { data, error } = await supabase.rpc('rejeter_demande_pot_equipe', {
      p_demande_id: demandeId,
      p_rejection_reason: raison,
    })

    if (error) throw error

    const result = (data as unknown as RPCResult[])?.[0]

    if (!result?.success) {
      return {
        success: false,
        error: result?.error || 'Erreur lors du rejet',
      }
    }

    return { success: true }
  } catch (error) {
    logError(error, {
      component: 'rejectDemandePot',
      action: 'rpc',
      metadata: { demandeId, raison }
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

/**
 * Ajoute un mouvement manuel au pot d'équipe
 */
export async function ajouterMouvementPot(
  supabase: SupabaseClientType,
  equipeId: string,
  typeMouvement: 'contribution' | 'depense' | 'ajustement',
  montant: number,
  description: string
): Promise<FunctionResult<{ nouveau_solde: number }>> {
  try {
    const { data, error } = await supabase.rpc('ajouter_mouvement_pot_equipe', {
      p_equipe_id: equipeId,
      p_type_mouvement: typeMouvement,
      p_montant: montant,
      p_description: description,
    })

    if (error) throw error

    const result = (data as unknown as RPCResult[])?.[0]

    if (!result?.success) {
      return {
        success: false,
        error: result?.error || 'Erreur lors de l\'ajout du mouvement',
      }
    }

    return {
      success: true,
      data: { nouveau_solde: result.nouveau_solde! },
    }
  } catch (error) {
    logError(error, {
      component: 'ajouterMouvementPot',
      action: 'rpc',
      metadata: { equipeId, typeMouvement, montant, description }
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}
