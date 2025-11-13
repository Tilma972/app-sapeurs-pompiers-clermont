/**
 * Système de Défis (Challenges)
 * Gestion des défis quotidiens, hebdomadaires, mensuels
 */

import { createClient as createClientComponent } from "@/lib/supabase/client";
import type {
  ChallengeDefinition,
  UserChallenge,
  ChallengeWithProgress,
  ChallengeType,
} from "@/lib/types/gamification.types";
import { awardXP } from "./gamification";

// =====================================================
// RÉCUPÉRATION DES DÉFIS
// =====================================================

/**
 * Récupère tous les défis actifs d'un type donné
 */
export async function getActiveChallenges(type?: ChallengeType): Promise<ChallengeDefinition[]> {
  const supabase = createClientComponent();

  let query = supabase
    .from('challenges_definitions')
    .select('*')
    .eq('active', true);

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query.order('xp_reward', { ascending: false });

  if (error) {
    console.error('Error fetching challenges:', error);
    return [];
  }

  return data || [];
}

/**
 * Récupère la période de début pour un type de défi
 */
function getPeriodStart(type: ChallengeType): string {
  const now = new Date();

  switch (type) {
    case 'daily':
      // Début de la journée
      return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0];

    case 'weekly':
      // Début de la semaine (lundi)
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Ajuster au lundi
      return new Date(now.getFullYear(), now.getMonth(), diff).toISOString().split('T')[0];

    case 'monthly':
      // Début du mois
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    case 'event':
      // Pour les événements, on utilise la date de début définie
      return now.toISOString().split('T')[0];
  }
}

/**
 * Récupère la progression d'un utilisateur sur tous les défis actifs
 */
export async function getUserChallengesProgress(userId: string): Promise<ChallengeWithProgress[]> {
  const supabase = createClientComponent();

  // Récupérer tous les défis actifs
  const challenges = await getActiveChallenges();

  // Récupérer la progression de l'utilisateur pour chaque type de défi
  const dailyPeriod = getPeriodStart('daily');
  const weeklyPeriod = getPeriodStart('weekly');
  const monthlyPeriod = getPeriodStart('monthly');

  const { data: userChallenges, error } = await supabase
    .from('user_challenges')
    .select('*')
    .eq('user_id', userId)
    .in('period_start', [dailyPeriod, weeklyPeriod, monthlyPeriod]);

  if (error) {
    console.error('Error fetching user challenges:', error);
    return challenges.map((challenge) => ({
      ...challenge,
      current_progress: 0,
      completed: false,
      progress_percentage: 0,
    }));
  }

  // Mapper les challenges avec leur progression
  const progressMap = new Map(
    (userChallenges || []).map((uc) => [uc.challenge_id, uc])
  );

  return challenges.map((challenge) => {
    const progress = progressMap.get(challenge.id);
    const currentProgress = progress?.current_progress || 0;
    const completed = progress?.completed || false;
    const progressPercentage = Math.min((currentProgress / challenge.target_value) * 100, 100);

    return {
      ...challenge,
      current_progress: currentProgress,
      completed,
      progress_percentage: Math.round(progressPercentage),
      completed_at: progress?.completed_at,
    };
  });
}

/**
 * Récupère uniquement les défis quotidiens avec progression
 */
export async function getDailyChallenges(userId: string): Promise<ChallengeWithProgress[]> {
  const allChallenges = await getUserChallengesProgress(userId);
  return allChallenges.filter((c) => c.type === 'daily');
}

/**
 * Récupère uniquement les défis hebdomadaires avec progression
 */
export async function getWeeklyChallenges(userId: string): Promise<ChallengeWithProgress[]> {
  const allChallenges = await getUserChallengesProgress(userId);
  return allChallenges.filter((c) => c.type === 'weekly');
}

/**
 * Récupère uniquement les défis mensuels avec progression
 */
export async function getMonthlyChallenges(userId: string): Promise<ChallengeWithProgress[]> {
  const allChallenges = await getUserChallengesProgress(userId);
  return allChallenges.filter((c) => c.type === 'monthly');
}

// =====================================================
// MISE À JOUR DE LA PROGRESSION
// =====================================================

/**
 * Met à jour la progression d'un utilisateur sur un défi
 */
export async function updateChallengeProgress(
  userId: string,
  challengeId: string,
  increment: number = 1
): Promise<UserChallenge | null> {
  const supabase = createClientComponent();

  // Récupérer le défi
  const { data: challenge, error: challengeError } = await supabase
    .from('challenges_definitions')
    .select('*')
    .eq('id', challengeId)
    .single();

  if (challengeError || !challenge) {
    console.error('Challenge not found:', challengeError);
    return null;
  }

  const periodStart = getPeriodStart(challenge.type);

  // Récupérer ou créer la progression
  const { data: existing } = await supabase
    .from('user_challenges')
    .select('*')
    .eq('user_id', userId)
    .eq('challenge_id', challengeId)
    .eq('period_start', periodStart)
    .single();

  let newProgress = (existing?.current_progress || 0) + increment;
  const wasCompleted = existing?.completed || false;
  const isNowCompleted = newProgress >= challenge.target_value;

  if (existing) {
    // Mettre à jour
    const { data, error } = await supabase
      .from('user_challenges')
      .update({
        current_progress: newProgress,
        completed: isNowCompleted,
        completed_at: isNowCompleted && !wasCompleted ? new Date().toISOString() : existing.completed_at,
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating challenge progress:', error);
      return null;
    }

    // Si vient d'être complété, attribuer les récompenses
    if (isNowCompleted && !wasCompleted) {
      await completeChallengeRewards(userId, challenge);
    }

    return data;
  } else {
    // Créer
    const { data, error } = await supabase
      .from('user_challenges')
      .insert({
        user_id: userId,
        challenge_id: challengeId,
        current_progress: newProgress,
        completed: isNowCompleted,
        completed_at: isNowCompleted ? new Date().toISOString() : null,
        period_start: periodStart,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating challenge progress:', error);
      return null;
    }

    // Si complété dès la première action, attribuer les récompenses
    if (isNowCompleted) {
      await completeChallengeRewards(userId, challenge);
    }

    return data;
  }
}

/**
 * Attribue les récompenses d'un défi complété
 */
async function completeChallengeRewards(userId: string, challenge: ChallengeDefinition): Promise<void> {
  // Attribuer XP
  if (challenge.xp_reward > 0) {
    await awardXP(userId, challenge.xp_reward, 'defi_complete', {
      challengeId: challenge.id,
      challengeName: challenge.name,
    });
  }

  // Attribuer jetons
  if (challenge.token_reward > 0) {
    const supabase = createClientComponent();
    await supabase.rpc('add_tokens', {
      p_user_id: userId,
      p_amount: challenge.token_reward,
    });
  }
}

// =====================================================
// HELPERS POUR ACTIONS SPÉCIFIQUES
// =====================================================

/**
 * Incrémente les défis liés aux calendriers
 */
export async function onCalendrierForChallenges(userId: string, count: number = 1): Promise<void> {
  const challenges = await getActiveChallenges();

  // Trouver tous les défis de type 'calendars'
  const calendarChallenges = challenges.filter((c) => c.target_type === 'calendars');

  for (const challenge of calendarChallenges) {
    await updateChallengeProgress(userId, challenge.id, count);
  }
}

/**
 * Incrémente les défis liés aux votes
 */
export async function onVoteForChallenges(userId: string): Promise<void> {
  const challenges = await getActiveChallenges();
  const voteChallenges = challenges.filter((c) => c.target_type === 'votes' || c.target_type === 'engagement');

  for (const challenge of voteChallenges) {
    await updateChallengeProgress(userId, challenge.id, 1);
  }
}

/**
 * Incrémente les défis liés aux likes
 */
export async function onLikeForChallenges(userId: string): Promise<void> {
  const challenges = await getActiveChallenges();
  const likeChallenges = challenges.filter((c) => c.target_type === 'likes' || c.target_type === 'engagement');

  for (const challenge of likeChallenges) {
    await updateChallengeProgress(userId, challenge.id, 1);
  }
}

/**
 * Incrémente les défis liés aux idées
 */
export async function onIdeaForChallenges(userId: string): Promise<void> {
  const challenges = await getActiveChallenges();
  const ideaChallenges = challenges.filter((c) => c.target_type === 'ideas');

  for (const challenge of ideaChallenges) {
    await updateChallengeProgress(userId, challenge.id, 1);
  }
}

/**
 * Incrémente les défis liés au montant collecté
 */
export async function onMontantForChallenges(userId: string, montant: number): Promise<void> {
  const challenges = await getActiveChallenges();
  const montantChallenges = challenges.filter((c) => c.target_type === 'montant');

  for (const challenge of montantChallenges) {
    await updateChallengeProgress(userId, challenge.id, montant);
  }
}

// =====================================================
// STATISTIQUES
// =====================================================

/**
 * Récupère le nombre de défis complétés par période
 */
export async function getCompletedChallengesCount(userId: string): Promise<{
  daily: number;
  weekly: number;
  monthly: number;
}> {
  const supabase = createClientComponent();

  const dailyPeriod = getPeriodStart('daily');
  const weeklyPeriod = getPeriodStart('weekly');
  const monthlyPeriod = getPeriodStart('monthly');

  const { data, error } = await supabase
    .from('user_challenges')
    .select('id, challenge:challenges_definitions(type)')
    .eq('user_id', userId)
    .eq('completed', true)
    .in('period_start', [dailyPeriod, weeklyPeriod, monthlyPeriod]);

  if (error) {
    console.error('Error fetching completed challenges:', error);
    return { daily: 0, weekly: 0, monthly: 0 };
  }

  const counts = {
    daily: 0,
    weekly: 0,
    monthly: 0,
  };

  (data || []).forEach((item: {challenge: {type: ChallengeType}}) => {
    const type = item.challenge?.type;
    if (type === 'daily') counts.daily++;
    if (type === 'weekly') counts.weekly++;
    if (type === 'monthly') counts.monthly++;
  });

  return counts;
}
