/**
 * Helpers Supabase pour la gestion des dépôts de fonds physiques
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { DemandeDepotFonds, DemandeDepotFondsAvecProfile, DetailFondsUtilisateur } from '@/lib/types/depot-fonds'

/**
 * Récupère le montant total non encore déposé pour un utilisateur
 */
export async function getMontantNonDepose(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { data, error } = await supabase.rpc('get_montant_non_depose', {
    p_user_id: userId,
  })

  if (error) {
    console.error('Erreur get_montant_non_depose:', error)
    throw new Error('Erreur lors du calcul du montant non déposé')
  }

  return data || 0
}

/**
 * Récupère toutes les demandes de dépôt d'un utilisateur
 */
export async function getDemandesDepotUtilisateur(
  supabase: SupabaseClient,
  userId: string
): Promise<DemandeDepotFonds[]> {
  const { data, error } = await supabase
    .from('demandes_depot_fonds')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erreur getDemandesDepotUtilisateur:', error)
    throw new Error('Erreur lors de la récupération des demandes')
  }

  return data || []
}

/**
 * Récupère une demande de dépôt spécifique avec le profil
 */
export async function getDemandeDepotById(
  supabase: SupabaseClient,
  demandeId: string
): Promise<DemandeDepotFondsAvecProfile | null> {
  const { data, error } = await supabase
    .from('demandes_depot_fonds')
    .select(`
      *,
      profiles!demandes_depot_fonds_user_id_fkey(full_name, equipes:equipes(nom)),
      validateur:profiles!demandes_depot_fonds_valide_par_fkey(full_name)
    `)
    .eq('id', demandeId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('Erreur getDemandeDepotById:', error)
    throw new Error('Erreur lors de la récupération de la demande')
  }

  return data
}

/**
 * Récupère toutes les demandes de dépôt (pour trésorier)
 */
export async function getToutesDemandesDepot(
  supabase: SupabaseClient,
  filters?: {
    statut?: string
    limit?: number
  }
): Promise<DemandeDepotFondsAvecProfile[]> {
  let query = supabase
    .from('demandes_depot_fonds')
    .select(`
      *,
      profiles!demandes_depot_fonds_user_id_fkey(full_name, equipes:equipes(nom)),
      validateur:profiles!demandes_depot_fonds_valide_par_fkey(full_name)
    `)
    .order('created_at', { ascending: false })

  if (filters?.statut) {
    query = query.eq('statut', filters.statut)
  }

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Erreur getToutesDemandesDepot:', error)
    throw new Error('Erreur lors de la récupération des demandes')
  }

  // Note: team field is not included to avoid ambiguity with equipes relations
  return data || []
}

/**
 * Récupère le nombre de demandes en attente (pour KPI trésorier)
 */
export async function getNombreDemandesEnAttente(
  supabase: SupabaseClient
): Promise<number> {
  const { count, error } = await supabase
    .from('demandes_depot_fonds')
    .select('*', { count: 'exact', head: true })
    .eq('statut', 'en_attente')

  if (error) {
    console.error('Erreur getNombreDemandesEnAttente:', error)
    return 0
  }

  return count || 0
}

/**
 * Récupère le montant total en attente de dépôt (pour KPI trésorier)
 */
export async function getMontantTotalEnAttente(
  supabase: SupabaseClient
): Promise<number> {
  const { data, error } = await supabase
    .from('demandes_depot_fonds')
    .select('montant_a_deposer')
    .eq('statut', 'en_attente')

  if (error) {
    console.error('Erreur getMontantTotalEnAttente:', error)
    return 0
  }

  const total = data?.reduce((sum, d) => sum + (d.montant_a_deposer || 0), 0) || 0
  return total
}

/**
 * Récupère le détail complet des fonds d'un utilisateur
 * Utilise la fonction SQL get_detail_fonds_utilisateur() qui retourne un breakdown détaillé
 */
export async function getDetailFondsUtilisateur(
  supabase: SupabaseClient,
  userId: string
): Promise<DetailFondsUtilisateur> {
  const { data, error } = await supabase.rpc('get_detail_fonds_utilisateur', {
    p_user_id: userId,
  })

  if (error) {
    console.error('Erreur get_detail_fonds_utilisateur:', error)
    // Retourner des valeurs par défaut en cas d'erreur
    return {
      total_collecte: 0,
      total_cb_valide: 0,
      total_cash_depose: 0,
      cash_a_deposer: 0,
    }
  }

  return data || {
    total_collecte: 0,
    total_cb_valide: 0,
    total_cash_depose: 0,
    cash_a_deposer: 0,
  }
}
