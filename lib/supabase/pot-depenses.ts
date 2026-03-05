/**
 * Helpers Supabase pour la gestion des dépenses du pot d'équipe
 * Centralise toutes les requêtes liées aux demandes de dépense
 */

import { SupabaseClient } from "@supabase/supabase-js";

// =====================================================
// TYPES
// =====================================================

export type StatutDemandePot = 'soumise' | 'approuvée' | 'payée' | 'rejetée';

export type DemandePotEquipe = {
  id: string;
  equipe_id: string;
  created_by: string;
  motif: string;
  prestataire_nom: string;
  montant_demande: number;
  montant_paye: number | null;
  justificatif_url: string;
  justificatif_est_provisoire: boolean;
  facture_finale_url: string | null;
  statut: StatutDemandePot;
  motif_rejet: string | null;
  traite_par: string | null;
  notes_tresorier: string | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
};

export type DemandePotEquipeAvecRelations = DemandePotEquipe & {
  equipe: { id: string; nom: string } | null;
  chef: { id: string; full_name: string | null; display_name: string | null } | null;
  traite_par_profile: { id: string; full_name: string | null } | null;
};

// =====================================================
// REQUÊTES
// =====================================================

/**
 * Récupère toutes les demandes d'une équipe (pour chef + membres)
 * Triées par date de création décroissante
 */
export async function getDemandesPotByEquipe(
  supabase: SupabaseClient,
  equipeId: string
): Promise<DemandePotEquipeAvecRelations[]> {
  try {
    const { data, error } = await supabase
      .from('demandes_pot_equipe')
      .select(`
        *,
        equipe:equipe_id ( id, nom ),
        chef:created_by ( id, full_name, display_name ),
        traite_par_profile:traite_par ( id, full_name )
      `)
      .eq('equipe_id', equipeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getDemandesPotByEquipe error:', error);
      return [];
    }

    return (data ?? []) as unknown as DemandePotEquipeAvecRelations[];
  } catch (err) {
    console.error('getDemandesPotByEquipe exception:', err);
    return [];
  }
}

/**
 * Récupère les demandes en attente de traitement pour le dashboard trésorier
 * Statuts : soumise + approuvée
 */
export async function getDemandesPotEnAttente(
  supabase: SupabaseClient
): Promise<DemandePotEquipeAvecRelations[]> {
  try {
    const { data, error } = await supabase
      .from('demandes_pot_equipe')
      .select(`
        *,
        equipe:equipe_id ( id, nom ),
        chef:created_by ( id, full_name, display_name ),
        traite_par_profile:traite_par ( id, full_name )
      `)
      .in('statut', ['soumise', 'approuvée'])
      .order('created_at', { ascending: true });

    if (error) {
      console.error('getDemandesPotEnAttente error:', error);
      return [];
    }

    return (data ?? []) as unknown as DemandePotEquipeAvecRelations[];
  } catch (err) {
    console.error('getDemandesPotEnAttente exception:', err);
    return [];
  }
}

/**
 * Récupère toutes les demandes (pour vue trésorier complète)
 */
export async function getAllDemandesPot(
  supabase: SupabaseClient
): Promise<DemandePotEquipeAvecRelations[]> {
  try {
    const { data, error } = await supabase
      .from('demandes_pot_equipe')
      .select(`
        *,
        equipe:equipe_id ( id, nom ),
        chef:created_by ( id, full_name, display_name ),
        traite_par_profile:traite_par ( id, full_name )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getAllDemandesPot error:', error);
      return [];
    }

    return (data ?? []) as unknown as DemandePotEquipeAvecRelations[];
  } catch (err) {
    console.error('getAllDemandesPot exception:', err);
    return [];
  }
}

/**
 * Calcule le solde disponible du pot d'une équipe
 * = total_disponible (30% tournées + solde antérieur) - somme des demandes engagées
 *
 * Les demandes engagées sont celles au statut 'soumise' ou 'approuvée'
 */
export async function getSoldeDisponiblePot(
  supabase: SupabaseClient,
  equipeId: string,
  totalDisponible: number
): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('demandes_pot_equipe')
      .select('montant_demande')
      .eq('equipe_id', equipeId)
      .in('statut', ['soumise', 'approuvée']);

    if (error) {
      console.error('getSoldeDisponiblePot error:', error);
      return totalDisponible;
    }

    const montantEngage = (data ?? []).reduce(
      (sum, d) => sum + (Number(d.montant_demande) ?? 0),
      0
    );

    return Math.max(0, totalDisponible - montantEngage);
  } catch (err) {
    console.error('getSoldeDisponiblePot exception:', err);
    return totalDisponible;
  }
}

/**
 * Vérifie si une équipe a des demandes de pot (pour conditionnel d'affichage)
 */
export async function equipaADesDemandesPot(
  supabase: SupabaseClient,
  equipeId: string
): Promise<boolean> {
  try {
    const { count, error } = await supabase
      .from('demandes_pot_equipe')
      .select('id', { count: 'exact', head: true })
      .eq('equipe_id', equipeId);

    if (error) return false;
    return (count ?? 0) > 0;
  } catch {
    return false;
  }
}

/**
 * Compte les demandes avec justificatif provisoire et statut payée
 * (alerte pour le trésorier)
 */
export async function countDemandesFactureManquante(
  supabase: SupabaseClient
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('demandes_pot_equipe')
      .select('id', { count: 'exact', head: true })
      .eq('statut', 'payée')
      .eq('justificatif_est_provisoire', true)
      .is('facture_finale_url', null);

    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}
