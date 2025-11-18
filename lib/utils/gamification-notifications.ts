"use client"

import { toast } from "sonner"

/**
 * Affiche une notification pour l'attribution d'XP
 */
export function notifyXpGained(amount: number, reason: string) {
  toast.success(`+${amount} XP`, {
    description: getXpReasonLabel(reason),
    duration: 3000,
  })
}

/**
 * Affiche une notification pour un level-up
 */
export function notifyLevelUp(newLevel: number, tokensEarned: number) {
  toast.success(`🎉 Niveau ${newLevel} !`, {
    description: tokensEarned > 0
      ? `Félicitations ! Tu as gagné ${tokensEarned} jetons bonus !`
      : `Félicitations ! Continue comme ça !`,
    duration: 5000,
  })
}

/**
 * Affiche une notification pour un badge débloqué
 */
export function notifyBadgeUnlocked(badgeName: string, badgeIcon: string, xpReward: number) {
  toast.success(`${badgeIcon} Badge débloqué !`, {
    description: `${badgeName} (+${xpReward} XP)`,
    duration: 5000,
  })
}

/**
 * Affiche une notification pour un défi complété
 */
export function notifyChallengeCompleted(challengeName: string, xpReward: number, tokenReward: number) {
  const rewards = []
  if (xpReward > 0) rewards.push(`${xpReward} XP`)
  if (tokenReward > 0) rewards.push(`${tokenReward} jetons`)

  toast.success(`✅ Défi complété !`, {
    description: `${challengeName} - Récompense : ${rewards.join(' + ')}`,
    duration: 5000,
  })
}

/**
 * Affiche une notification pour un nouveau streak
 */
export function notifyStreak(days: number) {
  const milestones = [3, 7, 14, 30, 50, 100]
  const isMilestone = milestones.includes(days)

  if (isMilestone) {
    toast.success(`🔥 ${days} jours de suite !`, {
      description: `Incroyable ! Continue ta série !`,
      duration: 5000,
    })
  }
}

/**
 * Labels pour les raisons d'XP
 */
function getXpReasonLabel(reason: string): string {
  const labels: Record<string, string> = {
    'calendrier_distribue': 'Calendrier distribué',
    'calendriers_distribues': 'Calendriers distribués',
    'montant_collecte': 'Collecte de fonds',
    'vote_idee': 'Vote sur une idée',
    'like_photo': 'Like d\'une photo',
    'idee_postee': 'Idée publiée',
    'commentaire_poste': 'Commentaire publié',
    'badge_unlock': 'Badge débloqué',
    'challenge_completed': 'Défi terminé',
    'daily_login': 'Connexion quotidienne',
  }

  return labels[reason] || 'Action accomplie'
}
