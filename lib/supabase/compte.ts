/**
 * Queries Supabase pour les comptes utilisateur
 * Centralise toutes les requêtes liées aux soldes et rétributions
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { CompteSolde, MouvementRetribution, PotEquipe } from "@/lib/types";
import { DatabaseError, logError } from "@/lib/utils/error-handling";

/**
 * Récupère les soldes et préférences d'un compte utilisateur
 */
export async function getUserCompte(
  supabase: SupabaseClient,
  userId: string
): Promise<CompteSolde | null> {
  try {
    const { data, error } = await supabase
      .from('comptes_sp')
      .select('solde_disponible, total_retributions, pourcentage_pot_equipe_defaut')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new DatabaseError('Failed to fetch user compte', error);
    }

    // maybeSingle() retourne null si aucun résultat (utilisateur sans compte)
    return data as CompteSolde | null;
  } catch (error) {
    logError(error, {
      component: 'getUserCompte',
      action: 'fetch',
      userId,
    });
    return null;
  }
}

/**
 * Récupère uniquement la préférence de répartition
 */
export async function getUserPreference(
  supabase: SupabaseClient,
  userId: string
): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from('comptes_sp')
      .select('pourcentage_pot_equipe_defaut')
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new DatabaseError('Failed to fetch user preference', error);
    }

    return data?.pourcentage_pot_equipe_defaut ?? null;
  } catch (error) {
    logError(error, {
      component: 'getUserPreference',
      action: 'fetch',
      userId,
    });
    return null;
  }
}

/**
 * Récupère le pot d'équipe
 */
export async function getPotEquipe(
  supabase: SupabaseClient,
  equipeId: string
): Promise<PotEquipe | null> {
  try {
    const { data, error } = await supabase
      .from('pots_equipe')
      .select('solde_disponible')
      .eq('equipe_id', equipeId)
      .maybeSingle(); // ✅ Ne lève pas d'erreur si aucun résultat

    if (error) {
      throw new DatabaseError('Failed to fetch pot equipe', error);
    }

    // Retourner null si le pot n'existe pas encore (cas légitime)
    return data ? (data as PotEquipe) : null;
  } catch (error) {
    logError(error, {
      component: 'getPotEquipe',
      action: 'fetch',
      metadata: { equipeId },
    });
    return null;
  }
}

/**
 * Récupère l'historique des mouvements de rétribution
 */
export async function getMouvementsRetribution(
  supabase: SupabaseClient,
  userId: string,
  limit: number = 5
): Promise<MouvementRetribution[]> {
  try {
    const { data, error } = await supabase
      .from('mouvements_retribution')
      .select('created_at, montant_total_collecte, montant_compte_perso')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new DatabaseError('Failed to fetch mouvements', error);
    }

    return data as MouvementRetribution[];
  } catch (error) {
    logError(error, {
      component: 'getMouvementsRetribution',
      action: 'fetch',
      userId,
      metadata: { limit },
    });
    return [];
  }
}

/**
 * Met à jour la préférence de répartition
 */
export async function updateUserPreference(
  supabase: SupabaseClient,
  userId: string,
  pourcentage: number
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('comptes_sp')
      .update({ pourcentage_pot_equipe_defaut: pourcentage })
      .eq('user_id', userId);

    if (error) {
      throw new DatabaseError('Failed to update preference', error);
    }

    return true;
  } catch (error) {
    logError(error, {
      component: 'updateUserPreference',
      action: 'update',
      userId,
      metadata: { pourcentage },
    });
    return false;
  }
}
