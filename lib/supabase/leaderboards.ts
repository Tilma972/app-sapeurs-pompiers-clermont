/**
 * Système de Classements (Leaderboards)
 * Classements global, par équipe, hebdomadaire, mensuel
 */

import { createClient as createClientComponent } from "@/lib/supabase/client";
import type { LeaderboardEntry, UserRank } from "@/lib/types/gamification.types";

// =====================================================
// TYPES SUPABASE
// =====================================================

interface SupabaseProfileData {
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  calendriers_distribues: number;
  montant_collecte: number;
  equipe?: Array<{ equipe_nom: string | null }>;
  equipe_id?: string | null;
}

interface SupabaseProgressionWithProfile {
  user_id: string;
  level: number;
  total_xp: number;
  streak_days: number;
  profiles: Array<SupabaseProfileData>;
}

interface SupabaseXpHistoryEntry {
  user_id: string;
  amount: number;
  profiles: Array<SupabaseProfileData>;
  progression: Array<{
    level: number;
    total_xp: number;
    streak_days: number;
  }>;
}

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
        first_name,
        last_name,
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

  const results = (data as unknown as SupabaseProgressionWithProfile[]) || [];
  
  return results.map((item, index) => ({
    user_id: item.user_id,
    rank: index + 1,
    level: item.level,
    total_xp: item.total_xp,
    streak_days: item.streak_days,
    nom: item.profiles?.[0]?.first_name || null,
    prenom: item.profiles?.[0]?.last_name || null,
    avatar_url: item.profiles?.[0]?.avatar_url || null,
    calendriers_distribues: item.profiles?.[0]?.calendriers_distribues || 0,
    montant_collecte: item.profiles?.[0]?.montant_collecte || 0,
    equipe_nom: item.profiles?.[0]?.equipe?.[0]?.equipe_nom || null,
  }));
}

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
        first_name,
        last_name,
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

  const results = (data as unknown as SupabaseProgressionWithProfile[]) || [];
  
  return results.map((item, index) => ({
    user_id: item.user_id,
    rank: index + 1,
    level: item.level,
    total_xp: item.total_xp,
    streak_days: item.streak_days,
    nom: item.profiles?.[0]?.first_name || null,
    prenom: item.profiles?.[0]?.last_name || null,
    avatar_url: item.profiles?.[0]?.avatar_url || null,
    calendriers_distribues: item.profiles?.[0]?.calendriers_distribues || 0,
    montant_collecte: item.profiles?.[0]?.montant_collecte || 0,
    equipe_nom: item.profiles?.[0]?.equipe?.[0]?.equipe_nom || null,
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
        first_name,
        last_name,
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

  const results = (data as unknown as SupabaseProgressionWithProfile[]) || [];
  
  return results.map((item, index) => ({
    user_id: item.user_id,
    rank: index + 1,
    level: item.level,
    total_xp: item.total_xp,
    streak_days: item.streak_days,
    nom: item.profiles?.[0]?.first_name || null,
    prenom: item.profiles?.[0]?.last_name || null,
    avatar_url: item.profiles?.[0]?.avatar_url || null,
    calendriers_distribues: item.profiles?.[0]?.calendriers_distribues || 0,
    montant_collecte: item.profiles?.[0]?.montant_collecte || 0,
    equipe_nom: item.profiles?.[0]?.equipe?.[0]?.equipe_nom || null,
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
        first_name,
        last_name,
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

  const entries = (data as unknown as SupabaseXpHistoryEntry[]) || [];
  entries.forEach((entry) => {
    const existing = userXpMap.get(entry.user_id);
    const weeklyXp = (existing?.weeklyXp || 0) + entry.amount;

    const profile = entry.profiles?.[0];
    const prog = entry.progression?.[0];

    userXpMap.set(entry.user_id, {
      weeklyXp,
      userData: {
        level: prog?.level || 1,
        total_xp: prog?.total_xp || 0,
        streak_days: prog?.streak_days || 0,
        nom: profile?.first_name || null,
        prenom: profile?.last_name || null,
        avatar_url: profile?.avatar_url || null,
        calendriers_distribues: profile?.calendriers_distribues || 0,
        montant_collecte: profile?.montant_collecte || 0,
        equipe_nom: profile?.equipe?.[0]?.equipe_nom || null,
      },
    });
  });

  // Trier et formater
  const sorted = Array.from(userXpMap.entries())
    .sort((a, b) => b[1].weeklyXp - a[1].weeklyXp)
    .slice(0, limit)
    .map(([userId, { weeklyXp, userData }], index) => ({
      user_id: userId,
      rank: index + 1,
      level: userData.level,
      total_xp: weeklyXp, // XP hebdomadaire dans ce contexte
      streak_days: userData.streak_days,
      nom: userData.nom,
      prenom: userData.prenom,
      avatar_url: userData.avatar_url,
      calendriers_distribues: userData.calendriers_distribues,
      montant_collecte: userData.montant_collecte,
      equipe_nom: userData.equipe_nom,
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
        first_name,
        last_name,
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

  const entries = (data as unknown as SupabaseXpHistoryEntry[]) || [];
  entries.forEach((entry) => {
    const existing = userXpMap.get(entry.user_id);
    const monthlyXp = (existing?.monthlyXp || 0) + entry.amount;

    const profile = entry.profiles?.[0];
    const prog = entry.progression?.[0];

    userXpMap.set(entry.user_id, {
      monthlyXp,
      userData: {
        level: prog?.level || 1,
        total_xp: prog?.total_xp || 0,
        streak_days: prog?.streak_days || 0,
        nom: profile?.first_name || null,
        prenom: profile?.last_name || null,
        avatar_url: profile?.avatar_url || null,
        calendriers_distribues: profile?.calendriers_distribues || 0,
        montant_collecte: profile?.montant_collecte || 0,
        equipe_nom: profile?.equipe?.[0]?.equipe_nom || null,
      },
    });
  });

  // Trier et formater
  const sorted = Array.from(userXpMap.entries())
    .sort((a, b) => b[1].monthlyXp - a[1].monthlyXp)
    .slice(0, limit)
    .map(([userId, { monthlyXp, userData }], index) => ({
      user_id: userId,
      rank: index + 1,
      level: userData.level,
      total_xp: monthlyXp, // XP mensuel dans ce contexte
      streak_days: userData.streak_days,
      nom: userData.nom,
      prenom: userData.prenom,
      avatar_url: userData.avatar_url,
      calendriers_distribues: userData.calendriers_distribues,
      montant_collecte: userData.montant_collecte,
      equipe_nom: userData.equipe_nom,
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
