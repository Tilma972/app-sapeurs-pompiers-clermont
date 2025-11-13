/**
 * Système de Gamification - Helpers
 * Gestion des XP, niveaux, badges, streaks
 */

import { createClient as createClientComponent } from "@/lib/supabase/client";
import { createClient as createServerClient } from "@/lib/supabase/server";
import type {
  UserProgression,
  BadgeDefinition,
  UserBadge,
  BadgeWithProgress,
  AwardXpResult,
  XpHistoryEntry,
  NotificationBadge,
  GamificationStats,
} from "@/lib/types/gamification.types";

// =====================================================
// PROGRESSION (XP, NIVEAU, STREAK)
// =====================================================

/**
 * Récupère la progression d'un utilisateur
 */
export async function getUserProgression(userId: string): Promise<UserProgression | null> {
  const supabase = createClientComponent();

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
 * Récupère ou initialise la progression d'un utilisateur
 */
export async function getOrCreateProgression(userId: string): Promise<UserProgression> {
  const existing = await getUserProgression(userId);

  if (existing) {
    return existing;
  }

  // Initialiser
  const supabase = createClientComponent();
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
    console.error('Error creating user progression:', error);
    throw error;
  }

  return data;
}

/**
 * Calcule l'XP requis pour atteindre un niveau
 */
export function getXpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  return level * 100 + Math.floor(Math.pow(level, 1.5) * 50);
}

/**
 * Attribue de l'XP à un utilisateur (via fonction SQL)
 */
export async function awardXP(
  userId: string,
  amount: number,
  reason: string,
  metadata?: Record<string, unknown>
): Promise<AwardXpResult | null> {
  const supabase = createClientComponent();

  const { data, error } = await supabase.rpc('award_xp', {
    p_user_id: userId,
    p_amount: amount,
    p_reason: reason,
    p_metadata: metadata || null,
  });

  if (error) {
    console.error('Error awarding XP:', error);
    return null;
  }

  // La fonction retourne un array, on prend le premier élément
  return data?.[0] || null;
}

/**
 * Met à jour le streak de l'utilisateur (via fonction SQL)
 */
export async function updateStreak(userId: string): Promise<number | null> {
  const supabase = createClientComponent();

  const { data, error } = await supabase.rpc('update_user_streak', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error updating streak:', error);
    return null;
  }

  return data;
}

/**
 * Récupère l'historique XP d'un utilisateur
 */
export async function getXpHistory(userId: string, limit = 20): Promise<XpHistoryEntry[]> {
  const supabase = createClientComponent();

  const { data, error } = await supabase
    .from('xp_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching XP history:', error);
    return [];
  }

  return data || [];
}

// =====================================================
// BADGES
// =====================================================

/**
 * Récupère tous les badges disponibles
 */
export async function getAllBadges(): Promise<BadgeDefinition[]> {
  const supabase = createClientComponent();

  const { data, error } = await supabase
    .from('badges_definitions')
    .select('*')
    .eq('active', true)
    .order('order_display', { ascending: true });

  if (error) {
    console.error('Error fetching badges:', error);
    return [];
  }

  return data || [];
}

/**
 * Récupère les badges débloqués par un utilisateur
 */
export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  const supabase = createClientComponent();

  const { data, error } = await supabase
    .from('user_badges')
    .select(`
      *,
      badge:badges_definitions(*)
    `)
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: false });

  if (error) {
    console.error('Error fetching user badges:', error);
    return [];
  }

  return data || [];
}

/**
 * Récupère tous les badges avec statut débloqué/verrouillé
 */
export async function getBadgesWithProgress(userId: string): Promise<BadgeWithProgress[]> {
  const allBadges = await getAllBadges();
  const userBadges = await getUserBadges(userId);

  const userBadgeMap = new Map(
    userBadges.map((ub) => [ub.badge_id, { unlocked_at: ub.unlocked_at, seen: ub.seen }])
  );

  // Récupérer les stats utilisateur pour calculer la progression
  const supabase = createClientComponent();
  const { data: profile } = await supabase
    .from('profiles_with_equipe_view')
    .select('calendriers_distribues, montant_collecte')
    .eq('id', userId)
    .single();

  const progression = await getUserProgression(userId);

  const { data: ideasCount } = await supabase
    .from('ideas')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('deleted_at', null);

  const { data: likesCount } = await supabase
    .from('gallery_likes')
    .select('photo_id', { count: 'exact', head: true })
    .eq('user_id', userId);

  const { data: votesCount } = await supabase
    .from('idea_votes')
    .select('idea_id', { count: 'exact', head: true })
    .eq('user_id', userId);

  const calendriers = profile?.calendriers_distribues || 0;
  const montant = profile?.montant_collecte || 0;
  const streak = progression?.streak_days || 0;
  const level = progression?.level || 1;
  const ideas = ideasCount || 0;
  const likes = likesCount || 0;
  const votes = votesCount || 0;

  return allBadges.map((badge) => {
    const userBadge = userBadgeMap.get(badge.id);
    const unlocked = !!userBadge;

    // Calculer la progression
    let currentProgress = 0;
    const threshold = badge.unlock_criteria.threshold;

    switch (badge.unlock_criteria.type) {
      case 'calendars':
        currentProgress = calendriers;
        break;
      case 'montant':
        currentProgress = montant;
        break;
      case 'streak':
        currentProgress = streak;
        break;
      case 'level':
        currentProgress = level;
        break;
      case 'ideas':
        currentProgress = ideas;
        break;
      case 'likes':
        currentProgress = likes;
        break;
      case 'votes':
        currentProgress = votes;
        break;
    }

    return {
      ...badge,
      unlocked,
      current_progress: currentProgress,
      unlocked_at: userBadge?.unlocked_at,
    };
  });
}

/**
 * Vérifie et débloque les badges éligibles (via fonction SQL)
 */
export async function checkAndUnlockBadges(userId: string): Promise<NotificationBadge[]> {
  const supabase = createClientComponent();

  const { data, error } = await supabase.rpc('check_and_unlock_badges', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error checking badges:', error);
    return [];
  }

  return (data || []).map((item: {badge_id: string; badge_name: string; badge_icon: string; xp_awarded: number}) => ({
    badge: {
      id: item.badge_id,
      name: item.badge_name,
      icon: item.badge_icon,
    } as BadgeDefinition,
    xp_awarded: item.xp_awarded,
  }));
}

/**
 * Récupère les badges non vus (pour notifications)
 */
export async function getUnseenBadges(userId: string): Promise<UserBadge[]> {
  const supabase = createClientComponent();

  const { data, error } = await supabase
    .from('user_badges')
    .select(`
      *,
      badge:badges_definitions(*)
    `)
    .eq('user_id', userId)
    .eq('seen', false)
    .order('unlocked_at', { ascending: false });

  if (error) {
    console.error('Error fetching unseen badges:', error);
    return [];
  }

  return data || [];
}

/**
 * Marque des badges comme vus
 */
export async function markBadgesAsSeen(userId: string, badgeIds: string[]): Promise<void> {
  const supabase = createClientComponent();

  const { error } = await supabase
    .from('user_badges')
    .update({ seen: true })
    .eq('user_id', userId)
    .in('badge_id', badgeIds);

  if (error) {
    console.error('Error marking badges as seen:', error);
  }
}

// =====================================================
// STATISTIQUES GLOBALES
// =====================================================

/**
 * Récupère toutes les stats de gamification d'un utilisateur
 */
export async function getGamificationStats(userId: string): Promise<GamificationStats | null> {
  const [progression, userBadges, allBadges] = await Promise.all([
    getOrCreateProgression(userId),
    getUserBadges(userId),
    getAllBadges(),
  ]);

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
    badges_unlocked: userBadges.length,
    badges_total: allBadges.length,
    recent_badges: userBadges.slice(0, 5),

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

// =====================================================
// ACTIONS RAPIDES (HELPERS)
// =====================================================

/**
 * Action après distribution de calendrier
 */
export async function onCalendrierDistributed(userId: string, montant: number): Promise<void> {
  // XP pour le calendrier
  await awardXP(userId, 10, 'calendrier_distribue', { montant });

  // XP bonus pour le montant (1 XP par 5€)
  const bonusXP = Math.floor(montant / 5);
  if (bonusXP > 0) {
    await awardXP(userId, bonusXP, 'montant_collecte', { montant });
  }

  // Mettre à jour le streak
  await updateStreak(userId);

  // Vérifier les badges
  await checkAndUnlockBadges(userId);
}

/**
 * Action après vote sur une idée
 */
export async function onIdeaVoted(userId: string, ideaId: string): Promise<void> {
  await awardXP(userId, 5, 'vote_idee', { ideaId });
  await checkAndUnlockBadges(userId);
}

/**
 * Action après like d'une photo
 */
export async function onPhotoLiked(userId: string, photoId: string): Promise<void> {
  await awardXP(userId, 3, 'like_photo', { photoId });
  await checkAndUnlockBadges(userId);
}

/**
 * Action après post d'une idée
 */
export async function onIdeaPosted(userId: string, ideaId: string): Promise<void> {
  await awardXP(userId, 50, 'idee_postee', { ideaId });
  await checkAndUnlockBadges(userId);
}

/**
 * Action après commentaire
 */
export async function onCommentPosted(userId: string, commentId: string): Promise<void> {
  await awardXP(userId, 10, 'commentaire_poste', { commentId });
  await checkAndUnlockBadges(userId);
}
