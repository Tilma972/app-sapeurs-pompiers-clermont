import { createClient } from "./server";
import { SupabaseClient } from "@supabase/supabase-js";
import { EquipeSettings, EquipeDetails, EquipeWithSettings } from "@/lib/types";
import { DatabaseError, logError } from "@/lib/utils/error-handling";

// Types pour les équipes
export type EquipeStats = {
  equipe_id: string;
  equipe_nom: string;
  equipe_numero: number | null;
  secteur: string;
  calendriers_alloues: number;
  calendriers_distribues: number;
  montant_collecte: number;
  progression_pourcentage: number;
  moyenne_par_calendrier: number;
  nombre_membres: number;
  tournees_actives: number;
  couleur: string;
};

export type EquipeRanking = {
  rang: number;
  equipe_nom: string;
  equipe_numero: number | null;
  secteur: string;
  montant_collecte: number;
  calendriers_distribues: number;
  progression_pourcentage: number;
  couleur: string;
  nombre_membres: number;
};

export type EquipeMembre = {
  membre_id: string;
  membre_nom: string;
  membre_role: string;
  calendriers_distribues: number;
  montant_collecte: number;
  moyenne_par_calendrier: number;
  nombre_tournees: number;
  derniere_tournee: string | null;
};

export type EquipeSummaryForCharts = {
  team: string;
  totalAmountCollected: number;
  totalCalendarsDistributed: number;
  progression_pourcentage: number;
  couleur: string;
  secteur: string;
};

/**
 * Récupère les statistiques d'une équipe spécifique
 */
export async function getEquipeStats(equipeId: string): Promise<EquipeStats | null> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.rpc('get_equipe_stats', {
      equipe_id_param: equipeId
    });

    if (error) {
      console.error('Erreur lors de la récupération des statistiques d\'équipe:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    return data[0] as EquipeStats;
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques d\'équipe:', error);
    return null;
  }
}

/**
 * Récupère le classement des équipes
 */
export async function getEquipesRanking(): Promise<EquipeRanking[]> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.rpc('get_equipes_ranking');

    if (error) {
      console.error('Erreur lors de la récupération du classement des équipes:', error);
      return [];
    }

    return (data || []) as EquipeRanking[];
  } catch (error) {
    console.error('Erreur lors de la récupération du classement des équipes:', error);
    return [];
  }
}

/**
 * Récupère les membres d'une équipe
 */
export async function getEquipeMembres(equipeId: string): Promise<EquipeMembre[]> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.rpc('get_equipe_membres', {
      equipe_id_param: equipeId
    });

    if (error) {
      console.error('Erreur lors de la récupération des membres d\'équipe:', error);
      return [];
    }

    return (data || []) as EquipeMembre[];
  } catch (error) {
    console.error('Erreur lors de la récupération des membres d\'équipe:', error);
    return [];
  }
}

/**
 * Récupère le résumé des équipes pour les graphiques (compatible avec l'interface existante)
 */
export async function getEquipesSummaryForCharts(): Promise<EquipeSummaryForCharts[]> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.rpc('get_equipes_summary_for_charts');

    if (error) {
      console.error('Erreur lors de la récupération du résumé des équipes:', error);
      return [];
    }

    return (data || []) as EquipeSummaryForCharts[];
  } catch (error) {
    console.error('Erreur lors de la récupération du résumé des équipes:', error);
    return [];
  }
}

/**
 * Récupère toutes les équipes avec leurs statistiques
 */
export async function getAllEquipesStats(): Promise<EquipeStats[]> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('equipes_stats_view')
      .select('*')
      .order('ordre_affichage');

    if (error) {
      console.error('Erreur lors de la récupération des statistiques des équipes:', error);
      return [];
    }

    return (data || []) as EquipeStats[];
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques des équipes:', error);
    return [];
  }
}

/**
 * Récupère les informations d'équipe d'un utilisateur
 */
export async function getUserEquipeInfo(userId: string): Promise<{
  equipe_id: string | null;
  equipe_nom: string | null;
  equipe_numero: number | null;
  secteur: string | null;
  calendriers_alloues: number | null;
  couleur: string | null;
  chef_equipe_nom: string | null;
} | null> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('profiles_with_equipe_view')
      .select(`
        equipe_id,
        equipe_nom,
        equipe_numero,
        secteur,
        calendriers_alloues,
        equipe_couleur,
        chef_equipe_nom
      `)
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Erreur lors de la récupération des informations d\'équipe:', error);
      return null;
    }

    return {
      equipe_id: data.equipe_id,
      equipe_nom: data.equipe_nom,
      equipe_numero: data.equipe_numero,
      secteur: data.secteur,
      calendriers_alloues: data.calendriers_alloues,
      couleur: data.equipe_couleur,
      chef_equipe_nom: data.chef_equipe_nom
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des informations d\'équipe:', error);
    return null;
  }
}

/**
 * Récupère les équipes actives (pour les listes déroulantes, etc.)
 */
export async function getActiveEquipes(): Promise<{
  id: string;
  nom: string;
  numero: number | null;
  secteur: string;
  couleur: string;
}[]> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('equipes')
      .select('id, nom, numero, secteur, couleur')
      .eq('actif', true)
      .order('ordre_affichage');

    if (error) {
      console.error('Erreur lors de la récupération des équipes actives:', error);
      return [];
    }

    return (data || []) as {
      id: string;
      nom: string;
      numero: number | null;
      secteur: string;
      couleur: string;
    }[];
  } catch (error) {
    console.error('Erreur lors de la récupération des équipes actives:', error);
    return [];
  }
}

/**
 * Fonction de compatibilité avec l'interface existante
 * Remplace getTeamsSummary() pour utiliser les nouvelles données d'équipes
 */
export async function getTeamsSummaryNew(): Promise<{
  team: string;
  totalAmountCollected: number;
  totalCalendarsDistributed: number;
}[]> {
  const equipesSummary = await getEquipesSummaryForCharts();
  
  return equipesSummary.map(equipe => ({
    team: equipe.team,
    totalAmountCollected: equipe.totalAmountCollected,
    totalCalendarsDistributed: equipe.totalCalendarsDistributed
  }));
}

/**
 * Récupère les paramètres d'équipe (min/recommandé) depuis un profile
 */
export async function getEquipeSettingsFromProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<{ settings: EquipeSettings | null; teamId: string | null }> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('team_id, equipes(pourcentage_minimum_pot, pourcentage_recommande_pot)')
      .eq('id', userId)
      .single();

    if (error) {
      throw new DatabaseError('Failed to fetch equipe settings from profile', error);
    }

    const eqRaw = (profile as unknown as { team_id?: string | null; equipes?: EquipeSettings | EquipeSettings[] })?.equipes;
    const settings: EquipeSettings | null = Array.isArray(eqRaw) ? eqRaw[0] || null : eqRaw || null;
    const teamId = (profile as unknown as { team_id?: string | null })?.team_id || null;

    return { settings, teamId };
  } catch (error) {
    logError(error, {
      component: 'getEquipeSettingsFromProfile',
      action: 'fetch',
      userId,
    });
    return { settings: null, teamId: null };
  }
}

/**
 * Récupère les détails complets d'une équipe
 */
export async function getEquipeDetails(
  supabase: SupabaseClient,
  equipeId: string
): Promise<EquipeDetails | null> {
  try {
    const { data, error } = await supabase
      .from('equipes')
      .select('id, nom, enable_retribution, pourcentage_minimum_pot, pourcentage_recommande_pot, mode_transparence')
      .eq('id', equipeId)
      .single();

    if (error) {
      throw new DatabaseError('Failed to fetch equipe details', error);
    }

    return data as EquipeDetails;
  } catch (error) {
    logError(error, {
      component: 'getEquipeDetails',
      action: 'fetch',
      metadata: { equipeId },
    });
    return null;
  }
}

/**
 * Récupère les infos d'équipe avec settings depuis un profile (variante complète)
 */
export async function getEquipeWithSettingsFromProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<EquipeWithSettings | null> {
  try {
    // 1. D'abord, récupérer le team_id du profil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('team_id')
      .eq('id', userId)
      .single();

    if (profileError) {
      throw new DatabaseError('Failed to fetch profile team_id', profileError);
    }

    // 2. Si pas d'équipe assignée, retourner null (cas légitime)
    if (!profile?.team_id) {
      return null;
    }

    // 3. Ensuite, fetch les détails de l'équipe
    const { data: equipe, error: equipeError } = await supabase
      .from('equipes')
      .select('id, nom, mode_transparence, pourcentage_minimum_pot, pourcentage_recommande_pot')
      .eq('id', profile.team_id)
      .maybeSingle();

    if (equipeError) {
      // Si erreur RLS ou FK invalide → log mais ne crash pas
      logError(new DatabaseError('Failed to fetch equipe details', equipeError), {
        component: 'getEquipeWithSettingsFromProfile',
        action: 'fetch_equipe',
        userId,
        metadata: { teamId: profile.team_id },
      });
      return null;
    }

    // Si l'équipe n'existe pas (FK cassée), retourner null
    if (!equipe) {
      logError(new DatabaseError('Equipe not found (broken FK?)', null), {
        component: 'getEquipeWithSettingsFromProfile',
        action: 'fetch_equipe',
        userId,
        metadata: { teamId: profile.team_id },
      });
      return null;
    }

    return equipe as EquipeWithSettings;
  } catch (error) {
    logError(error, {
      component: 'getEquipeWithSettingsFromProfile',
      action: 'fetch',
      userId,
    });
    return null;
  }
}
