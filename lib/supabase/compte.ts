/**
 * Queries Supabase pour les comptes utilisateur
 * Centralise toutes les requêtes liées aux soldes et rétributions
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { CompteSolde, MouvementRetribution, PotEquipe } from "@/lib/types";

/**
 * Récupère les soldes et préférences d'un compte utilisateur
 */
export async function getUserCompte(
  supabase: SupabaseClient,
  userId: string
): Promise<CompteSolde | null> {
  const { data, error } = await supabase
    .from('comptes_sp')
    .select('solde_disponible, total_retributions, pourcentage_pot_equipe_defaut')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching user compte:', error);
    return null;
  }

  return data as CompteSolde;
}

/**
 * Récupère uniquement la préférence de répartition
 */
export async function getUserPreference(
  supabase: SupabaseClient,
  userId: string
): Promise<number | null> {
  const { data, error } = await supabase
    .from('comptes_sp')
    .select('pourcentage_pot_equipe_defaut')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching user preference:', error);
    return null;
  }

  return data?.pourcentage_pot_equipe_defaut ?? null;
}

/**
 * Récupère le pot d'équipe
 */
export async function getPotEquipe(
  supabase: SupabaseClient,
  equipeId: string
): Promise<PotEquipe | null> {
  const { data, error } = await supabase
    .from('pots_equipe')
    .select('solde_disponible')
    .eq('equipe_id', equipeId)
    .single();

  if (error) {
    console.error('Error fetching pot equipe:', error);
    return null;
  }

  return data as PotEquipe;
}

/**
 * Récupère l'historique des mouvements de rétribution
 */
export async function getMouvementsRetribution(
  supabase: SupabaseClient,
  userId: string,
  limit: number = 5
): Promise<MouvementRetribution[]> {
  const { data, error } = await supabase
    .from('mouvements_retribution')
    .select('created_at, montant_total_collecte, montant_compte_perso')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching mouvements:', error);
    return [];
  }

  return data as MouvementRetribution[];
}

/**
 * Met à jour la préférence de répartition
 */
export async function updateUserPreference(
  supabase: SupabaseClient,
  userId: string,
  pourcentage: number
): Promise<boolean> {
  const { error } = await supabase
    .from('comptes_sp')
    .update({ pourcentage_pot_equipe_defaut: pourcentage })
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating preference:', error);
    return false;
  }

  return true;
}
