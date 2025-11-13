/**
 * Système de Classements (Leaderboards)
 * Classements global, par équipe, hebdomadaire, mensuel
 */

import { createClient as createClientComponent } from "@/lib/supabase/client";
import type { LeaderboardEntry, UserRank } from "@/lib/types/gamification.types";

// =====================================================
// CLASSEMENT GLOBAL
// =====================================================

/**
 * Récupère le classement global par XP
 */
export async function getGlobalLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
  const supabase = createClientComponent();

  const { data, error } = await supabase
    .from('user_progression')
    .select(`
      user_id,
      level,
      total_xp,
      streak_days,
      profiles:user_id (
        nom,
        prenom,
        avatar_url,
        calendriers_distribues,
        montant_collecte,
        equipe:profiles_with_equipe_view!user_id (
          equipe_nom
        )
      )
    `)
    .order('total_xp', { ascending: false })
    .order('level', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching global leaderboard:', error);
    return [];
  }

  return (data || []).map((item: LeaderboardEntryRaw, index) => ({
    user_id: item.user_id,
    rank: index + 1,
    level: item.level,
    total_xp: item.total_xp,
    streak_days: item.streak_days,
    nom: item.profiles?.nom || null,
    prenom: item.profiles?.prenom || null,
    avatar_url: item.profiles?.avatar_url || null,
    calendriers_distribues: item.profiles?.calendriers_distribues || 0,
    montant_collecte: item.profiles?.montant_collecte || 0,
    equipe_nom: (item.profiles?.equipe as {equipe_nom?: string})?.equipe_nom || null,
  }));
}

type LeaderboardEntryRaw = {
  user_id: string;
  level: number;
  total_xp: number;
  streak_days: number;
  profiles?: {
    nom: string | null;
    prenom: string | null;
    avatar_url: string | null;
    calendriers_distribues: number;
    montant_collecte: number;
    equipe: unknown;
  };
};

/**
 * Récupère le classement global par niveau
 */
export async function getGlobalLeaderboardByLevel(limit: number = 100): Promise<LeaderboardEntry[]> {
  const supabase = createClientComponent();

  const { data, error } = await supabase
    .from('user_progression')
    .select(`
      user_id,
      level,
      total_xp,
      streak_days,
      profiles:user_id (
        nom,
        prenom,
        avatar_url,
        calendriers_distribues,
        montant_collecte,
        equipe:profiles_with_equipe_view!user_id (
          equipe_nom
        )
      )
    `)
    .order('level', { ascending: false })
    .order('total_xp', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching leaderboard by level:', error);
    return [];
  }

  return (data || []).map((item: LeaderboardEntryRaw, index) => ({
    user_id: item.user_id,
    rank: index + 1,
    level: item.level,
    total_xp: item.total_xp,
    streak_days: item.streak_days,
    nom: item.profiles?.nom || null,
    prenom: item.profiles?.prenom || null,
    avatar_url: item.profiles?.avatar_url || null,
    calendriers_distribues: item.profiles?.calendriers_distribues || 0,
    montant_collecte: item.profiles?.montant_collecte || 0,
    equipe_nom: (item.profiles?.equipe as {equipe_nom?: string})?.equipe_nom || null,
  }));
}

// =====================================================
// CLASSEMENT PAR ÉQUIPE
// =====================================================

/**
 * Récupère le classement des membres d'une équipe
 */
export async function getTeamLeaderboard(teamId: string, limit: number = 50): Promise<LeaderboardEntry[]> {
  const supabase = createClientComponent();

  const { data, error } = await supabase
    .from('user_progression')
    .select(`
      user_id,
      level,
      total_xp,
      streak_days,
      profiles:user_id (
        nom,
        prenom,
        avatar_url,
        calendriers_distribues,
        montant_collecte,
        equipe_id,
        equipe:profiles_with_equipe_view!user_id (
          equipe_nom
        )
      )
    `)
    .eq('profiles.equipe_id', teamId)
    .order('total_xp', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching team leaderboard:', error);
    return [];
  }

  return (data || []).map((item: LeaderboardEntryRaw, index) => ({
    user_id: item.user_id,
    rank: index + 1,
    level: item.level,
    total_xp: item.total_xp,
    streak_days: item.streak_days,
    nom: item.profiles?.nom || null,
    prenom: item.profiles?.prenom || null,
    avatar_url: item.profiles?.avatar_url || null,
    calendriers_distribues: item.profiles?.calendriers_distribues || 0,
    montant_collecte: item.profiles?.montant_collecte || 0,
    equipe_nom: (item.profiles?.equipe as {equipe_nom?: string})?.equipe_nom || null,
  }));
}

// =====================================================
// CLASSEMENT HEBDOMADAIRE
// =====================================================

/**
 * Récupère le classement hebdomadaire (par XP gagnés cette semaine)
 */
export async function getWeeklyLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
  const supabase = createClientComponent();

  // Calculer le début de la semaine (lundi)
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const weekStart = new Date(now.getFullYear(), now.getMonth(), diff);
  weekStart.setHours(0, 0, 0, 0);

  // Récupérer les gains XP de la semaine
  const { data, error } = await supabase
    .from('xp_history')
    .select(`
      user_id,
      amount,
      profiles:user_id (
        nom,
        prenom,
        avatar_url,
        calendriers_distribues,
        montant_collecte,
        equipe:profiles_with_equipe_view!user_id (
          equipe_nom
        )
      ),
      progression:user_id (
        level,
        total_xp,
        streak_days
      )
    `)
    .gte('created_at', weekStart.toISOString());

  if (error) {
    console.error('Error fetching weekly leaderboard:', error);
    return [];
  }

  // Agréger par utilisateur
  const userXpMap = new Map<string, {
    weeklyXp: number;
    userData: {
      level: number;
      total_xp: number;
      streak_days: number;
      nom: string | null;
      prenom: string | null;
      avatar_url: string | null;
      calendriers_distribues: number;
      montant_collecte: number;
      equipe_nom: string | null;
    };
  }>();

  (data || []).forEach((entry: {
    user_id: string;
    amount: number;
    profiles: {
      nom: string;
      prenom: string;
      avatar_url: string;
      calendriers_distribues: number;
      montant_collecte: number;
      equipe: unknown;
    };
    progression: {
      level: number;
      total_xp: number;
      streak_days: number;
    };
  }) => {
    const existing = userXpMap.get(entry.user_id);
    const weeklyXp = (existing?.weeklyXp || 0) + entry.amount;

    userXpMap.set(entry.user_id, {
      weeklyXp,
      userData: {
        level: entry.progression?.level || 1,
        total_xp: entry.progression?.total_xp || 0,
        streak_days: entry.progression?.streak_days || 0,
        nom: entry.profiles?.nom || null,
        prenom: entry.profiles?.prenom || null,
        avatar_url: entry.profiles?.avatar_url || null,
        calendriers_distribues: entry.profiles?.calendriers_distribues || 0,
        montant_collecte: entry.profiles?.montant_collecte || 0,
        equipe_nom: (entry.profiles?.equipe as {equipe_nom?: string})?.equipe_nom || null,
      },
    });
  });

  // Trier et formater
  const sorted = Array.from(userXpMap.entries())
    .sort((a, b) => b[1].weeklyXp - a[1].weeklyXp)
    .slice(0, limit)
    .map(([userId, data], index) => ({
      user_id: userId,
      rank: index + 1,
      level: data.userData.level,
      total_xp: data.weeklyXp, // XP hebdomadaire dans ce contexte
      streak_days: data.userData.streak_days,
      ...data.userData,
    }));

  return sorted;
}

// =====================================================
// CLASSEMENT MENSUEL
// =====================================================

/**
 * Récupère le classement mensuel (par XP gagnés ce mois)
 */
export async function getMonthlyLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
  const supabase = createClientComponent();

  // Début du mois
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  monthStart.setHours(0, 0, 0, 0);

  // Récupérer les gains XP du mois
  const { data, error } = await supabase
    .from('xp_history')
    .select(`
      user_id,
      amount,
      profiles:user_id (
        nom,
        prenom,
        avatar_url,
        calendriers_distribues,
        montant_collecte,
        equipe:profiles_with_equipe_view!user_id (
          equipe_nom
        )
      ),
      progression:user_id (
        level,
        total_xp,
        streak_days
      )
    `)
    .gte('created_at', monthStart.toISOString());

  if (error) {
    console.error('Error fetching monthly leaderboard:', error);
    return [];
  }

  // Agréger par utilisateur
  const userXpMap = new Map<string, {
    monthlyXp: number;
    userData: {
      level: number;
      total_xp: number;
      streak_days: number;
      nom: string | null;
      prenom: string | null;
      avatar_url: string | null;
      calendriers_distribues: number;
      montant_collecte: number;
      equipe_nom: string | null;
    };
  }>();

  (data || []).forEach((entry: {
    user_id: string;
    amount: number;
    profiles: {
      nom: string;
      prenom: string;
      avatar_url: string;
      calendriers_distribues: number;
      montant_collecte: number;
      equipe: unknown;
    };
    progression: {
      level: number;
      total_xp: number;
      streak_days: number;
    };
  }) => {
    const existing = userXpMap.get(entry.user_id);
    const monthlyXp = (existing?.monthlyXp || 0) + entry.amount;

    userXpMap.set(entry.user_id, {
      monthlyXp,
      userData: {
        level: entry.progression?.level || 1,
        total_xp: entry.progression?.total_xp || 0,
        streak_days: entry.progression?.streak_days || 0,
        nom: entry.profiles?.nom || null,
        prenom: entry.profiles?.prenom || null,
        avatar_url: entry.profiles?.avatar_url || null,
        calendriers_distribues: entry.profiles?.calendriers_distribues || 0,
        montant_collecte: entry.profiles?.montant_collecte || 0,
        equipe_nom: (entry.profiles?.equipe as {equipe_nom?: string})?.equipe_nom || null,
      },
    });
  });

  // Trier et formater
  const sorted = Array.from(userXpMap.entries())
    .sort((a, b) => b[1].monthlyXp - a[1].monthlyXp)
    .slice(0, limit)
    .map(([userId, data], index) => ({
      user_id: userId,
      rank: index + 1,
      level: data.userData.level,
      total_xp: data.monthlyXp, // XP mensuel dans ce contexte
      streak_days: data.userData.streak_days,
      ...data.userData,
    }));

  return sorted;
}

// =====================================================
// RANG UTILISATEUR
// =====================================================

/**
 * Récupère le rang global d'un utilisateur (via fonction SQL)
 */
export async function getUserRankGlobal(userId: string): Promise<UserRank | null> {
  const supabase = createClientComponent();

  const { data, error } = await supabase.rpc('get_user_rank_global', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error fetching user rank:', error);
    return null;
  }

  return data?.[0] || null;
}

/**
 * Récupère le rang d'un utilisateur dans son équipe
 */
export async function getUserRankInTeam(userId: string, teamId: string): Promise<number | null> {
  const leaderboard = await getTeamLeaderboard(teamId);
  const index = leaderboard.findIndex((entry) => entry.user_id === userId);
  return index >= 0 ? index + 1 : null;
}

/**
 * Vérifie si un utilisateur est dans le top X%
 */
export async function isUserInTopPercentile(userId: string, percentile: number): Promise<boolean> {
  const rank = await getUserRankGlobal(userId);
  if (!rank) return false;

  return rank.percentile <= percentile;
}
