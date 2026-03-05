/**
 * Queries Supabase pour les comptes utilisateur
 * Centralise toutes les requêtes liées aux soldes et rétributions
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { CompteSolde, MouvementRetribution, PotEquipe, PotEquipeTournees } from "@/lib/types";
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
      .maybeSingle(); // ✅ Ne lève pas d'erreur si aucun résultat

    if (error) {
      throw new DatabaseError('Failed to fetch user compte', error);
    }

    return data as CompteSolde;
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
 * Calcule le pot d'équipe directement depuis les tournées complétées
 * Indépendant des clôtures individuelles — affichage en lecture seule
 */
export async function getPotEquipeTournees(
  supabase: SupabaseClient,
  equipeId: string
): Promise<PotEquipeTournees> {
  try {
    const { data, error } = await supabase
      .from('tournees')
      .select('montant_collecte, date_debut')
      .eq('equipe_id', equipeId)
      .eq('statut', 'completed');

    if (error) {
      throw new DatabaseError('Failed to fetch tournees for pot equipe', error);
    }

    const total_collecte = (data ?? []).reduce(
      (sum, t) => sum + (t.montant_collecte ?? 0),
      0
    );

    const maxDateDebut = (data ?? []).reduce<string | null>(
      (max, t) => (t.date_debut && (!max || t.date_debut > max) ? t.date_debut : max),
      null
    );

    const annee_campagne = maxDateDebut
      ? new Date(maxDateDebut).getFullYear()
      : new Date().getFullYear();

    return {
      total_collecte,
      part_equipe: total_collecte * 0.30,
      annee_campagne,
    };
  } catch (error) {
    logError(error, {
      component: 'getPotEquipeTournees',
      action: 'fetch',
      metadata: { equipeId },
    });
    return { total_collecte: 0, part_equipe: 0, annee_campagne: new Date().getFullYear() };
  }
}

/**
 * Récupère le solde antérieur d'une équipe pour une année donnée
 * Saisi manuellement par le trésorier dans pots_equipe_historique
 */
export async function getSoldeAnterieur(
  supabase: SupabaseClient,
  equipeId: string,
  annee: number
): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('pots_equipe_historique')
      .select('solde_anterieur')
      .eq('equipe_id', equipeId)
      .eq('annee', annee)
      .maybeSingle();

    if (error) {
      throw new DatabaseError('Failed to fetch solde anterieur', error);
    }

    return data?.solde_anterieur ?? 0;
  } catch (error) {
    logError(error, {
      component: 'getSoldeAnterieur',
      action: 'fetch',
      metadata: { equipeId, annee },
    });
    return 0;
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
