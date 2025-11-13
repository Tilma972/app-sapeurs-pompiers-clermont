/**
 * Types pour le système de gamification
 */

// =====================================================
// BADGES
// =====================================================

export type BadgeCategory = 'starter' | 'montant' | 'social' | 'streak' | 'excellence' | 'special';
export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface BadgeUnlockCriteria {
  type: 'calendars' | 'montant' | 'streak' | 'level' | 'ideas' | 'likes' | 'votes';
  threshold: number;
}

export interface BadgeDefinition {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  category: BadgeCategory;
  rarity: BadgeRarity;
  xp_reward: number;
  unlock_criteria: BadgeUnlockCriteria;
  order_display: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  unlocked_at: string;
  seen: boolean;
  badge?: BadgeDefinition; // relation
}

export interface BadgeWithProgress extends BadgeDefinition {
  unlocked: boolean;
  current_progress?: number;
  unlocked_at?: string;
}

// =====================================================
// PROGRESSION (XP, NIVEAU, STREAK)
// =====================================================

export interface UserProgression {
  user_id: string;
  level: number;
  current_xp: number;
  total_xp: number;
  streak_days: number;
  last_activity_date: string | null;
  tokens: number;
  created_at: string;
  updated_at: string;
}

export interface XpHistoryEntry {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface AwardXpResult {
  new_level: number;
  leveled_up: boolean;
  new_xp: number;
  tokens_earned: number;
}

// =====================================================
// DÉFIS (CHALLENGES)
// =====================================================

export type ChallengeType = 'daily' | 'weekly' | 'monthly' | 'event';
export type ChallengeTargetType = 'calendars' | 'votes' | 'likes' | 'ideas' | 'montant' | 'team_rank' | 'engagement';

export interface ChallengeDefinition {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  type: ChallengeType;
  target_value: number;
  target_type: ChallengeTargetType;
  xp_reward: number;
  token_reward: number;
  active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  current_progress: number;
  completed: boolean;
  completed_at: string | null;
  period_start: string;
  created_at: string;
  updated_at: string;
  challenge?: ChallengeDefinition; // relation
}

export interface ChallengeWithProgress extends ChallengeDefinition {
  current_progress: number;
  completed: boolean;
  progress_percentage: number;
  completed_at?: string | null;
}

// =====================================================
// COSMÉTIQUES
// =====================================================

export type CosmeticType = 'title' | 'frame' | 'badge_cosmetic';

export interface UserCosmetic {
  id: string;
  user_id: string;
  type: CosmeticType;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  unlocked_at: string;
  equipped: boolean;
}

// =====================================================
// CLASSEMENTS (LEADERBOARDS)
// =====================================================

export interface LeaderboardEntry {
  user_id: string;
  rank: number;
  level: number;
  total_xp: number;
  streak_days: number;
  // Infos utilisateur
  nom?: string | null;
  prenom?: string | null;
  avatar_url?: string | null;
  equipe_nom?: string | null;
  // Métriques
  calendriers_distribues?: number;
  montant_collecte?: number;
}

export interface UserRank {
  rank: number;
  total_users: number;
  percentile: number;
}

// =====================================================
// STATISTIQUES GAMIFICATION
// =====================================================

export interface GamificationStats {
  // Progression
  level: number;
  current_xp: number;
  xp_for_next_level: number;
  progress_percentage: number;
  total_xp: number;

  // Streak
  streak_days: number;

  // Badges
  badges_unlocked: number;
  badges_total: number;
  recent_badges: UserBadge[];

  // Défis
  daily_challenges_completed: number;
  weekly_challenges_completed: number;
  monthly_challenges_completed: number;

  // Classement
  global_rank: number | null;
  team_rank: number | null;

  // Jetons
  tokens: number;
}

// =====================================================
// UTILITAIRES
// =====================================================

export interface NotificationBadge {
  badge: BadgeDefinition;
  xp_awarded: number;
}

export interface LevelUpNotification {
  old_level: number;
  new_level: number;
  tokens_earned: number;
  rewards: string[]; // descriptions des récompenses
}
