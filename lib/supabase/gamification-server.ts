/**
 * Système de Gamification - Server Helpers
 * Versions serveur des fonctions de gamification
 * À utiliser dans les Server Components et Server Actions
 */

import { createClient } from "@/lib/supabase/server";
import type {
  UserProgression,
  GamificationStats,
} from "@/lib/types/gamification.types";
import { getXpRequiredForLevel } from "./gamification";

/**
 * Récupère la progression d'un utilisateur (version serveur)
 */
export async function getUserProgressionServer(userId: string): Promise<UserProgression | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_progression')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    // Si pas de progression, l'utilisateur n'a pas encore d'XP
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching user progression:', error);
    return null;
  }

  return data;
}

/**
 * Récupère ou initialise la progression d'un utilisateur (version serveur)
 */
export async function getOrCreateProgressionServer(userId: string): Promise<UserProgression> {
  const existing = await getUserProgressionServer(userId);

  if (existing) {
    return existing;
  }

  // Initialiser
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('user_progression')
    .insert({
      user_id: userId,
      level: 1,
      current_xp: 0,
      total_xp: 0,
      streak_days: 0,
      tokens: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating user progression (server):', error);
    throw error;
  }

  return data;
}

/**
 * Récupère toutes les stats de gamification d'un utilisateur (version serveur)
 */
export async function getGamificationStatsServer(userId: string): Promise<GamificationStats | null> {
  const supabase = await createClient();

  // Récupérer ou créer la progression
  const progression = await getOrCreateProgressionServer(userId);

  // Récupérer les badges
  const { data: userBadges } = await supabase
    .from('user_badges')
    .select(`
      *,
      badge:badges_definitions(*)
    `)
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: false });

  const { data: allBadges } = await supabase
    .from('badges_definitions')
    .select('*')
    .eq('active', true);

  const xpForNextLevel = getXpRequiredForLevel(progression.level + 1);
  const progressPercentage = xpForNextLevel > 0
    ? Math.min((progression.current_xp / xpForNextLevel) * 100, 100)
    : 0;

  return {
    // Progression
    level: progression.level,
    current_xp: progression.current_xp,
    xp_for_next_level: xpForNextLevel,
    progress_percentage: Math.round(progressPercentage),
    total_xp: progression.total_xp,

    // Streak
    streak_days: progression.streak_days,

    // Badges
    badges_unlocked: userBadges?.length || 0,
    badges_total: allBadges?.length || 0,
    recent_badges: (userBadges || []).slice(0, 5),

    // Défis (à implémenter plus tard)
    daily_challenges_completed: 0,
    weekly_challenges_completed: 0,
    monthly_challenges_completed: 0,

    // Classement (à implémenter plus tard)
    global_rank: null,
    team_rank: null,

    // Jetons
    tokens: progression.tokens,
  };
}
