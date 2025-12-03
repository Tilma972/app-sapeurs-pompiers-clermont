// ============================================
// Server Actions - Sondages & Votes
// Module Vie de Caserne
// ============================================

'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import type { 
  CreatePollInput, 
  VoteInput,
  ActionResult, 
  PollWithVotes,
  PollOption
} from '../types'

/**
 * Récupère l'utilisateur connecté
 */
async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw new Error('Non authentifié')
  }
  return user
}

/**
 * Créer un nouveau sondage
 */
export async function createPoll(
  input: CreatePollInput
): Promise<ActionResult<PollWithVotes>> {
  try {
    await getCurrentUser()

    const poll = await prisma.poll.create({
      data: {
        question: input.question,
        options: input.options as object,
        eventId: input.eventId,
        expiresAt: input.expiresAt,
      },
      include: {
        event: true,
        votes: true,
      }
    })

    revalidatePath('/dashboard/vie-caserne')
    return { success: true, data: poll }
  } catch (error) {
    console.error('Erreur création sondage:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    }
  }
}

/**
 * Récupérer tous les sondages actifs
 */
export async function getActivePolls(): Promise<PollWithVotes[]> {
  const now = new Date()

  return prisma.poll.findMany({
    where: {
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } }
      ]
    },
    include: {
      event: true,
      votes: true,
      _count: { select: { votes: true } }
    },
    orderBy: { createdAt: 'desc' }
  })
}

/**
 * Récupérer un sondage par ID avec résultats
 */
export async function getPollById(pollId: string): Promise<PollWithVotes | null> {
  return prisma.poll.findUnique({
    where: { id: pollId },
    include: {
      event: true,
      votes: true,
      _count: { select: { votes: true } }
    }
  })
}

/**
 * Calculer les résultats d'un sondage
 */
export async function getPollResults(pollId: string) {
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: { votes: true }
  })

  if (!poll) return null

  const options = poll.options as unknown as PollOption[]
  const totalVotes = poll.votes.length

  const results = options.map(option => {
    const voteCount = poll.votes.filter(v => v.optionId === option.id).length
    return {
      optionId: option.id,
      label: option.label,
      votes: voteCount,
      percentage: totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0
    }
  })

  return {
    pollId: poll.id,
    question: poll.question,
    totalVotes,
    results,
    isExpired: poll.expiresAt ? new Date(poll.expiresAt) < new Date() : false
  }
}

/**
 * Voter dans un sondage
 */
export async function vote(input: VoteInput): Promise<ActionResult> {
  try {
    const user = await getCurrentUser()

    // Vérifier que le sondage existe et n'est pas expiré
    const poll = await prisma.poll.findUnique({
      where: { id: input.pollId }
    })

    if (!poll) {
      return { success: false, error: 'Sondage non trouvé' }
    }

    if (poll.expiresAt && new Date(poll.expiresAt) < new Date()) {
      return { success: false, error: 'Ce sondage est terminé' }
    }

    // Vérifier que l'option existe
    const options = poll.options as unknown as PollOption[]
    if (!options.some(o => o.id === input.optionId)) {
      return { success: false, error: 'Option invalide' }
    }

    // Vérifier si l'utilisateur a déjà voté
    const existingVote = await prisma.pollVote.findUnique({
      where: {
        pollId_userId: {
          pollId: input.pollId,
          userId: user.id,
        }
      }
    })

    if (existingVote) {
      // Mettre à jour le vote existant
      await prisma.pollVote.update({
        where: { id: existingVote.id },
        data: { optionId: input.optionId }
      })
    } else {
      // Créer un nouveau vote
      await prisma.pollVote.create({
        data: {
          pollId: input.pollId,
          userId: user.id,
          optionId: input.optionId,
        }
      })
    }

    revalidatePath('/dashboard/vie-caserne')
    return { success: true }
  } catch (error) {
    console.error('Erreur vote:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    }
  }
}

/**
 * Retirer son vote
 */
export async function removeVote(pollId: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser()

    await prisma.pollVote.deleteMany({
      where: {
        pollId,
        userId: user.id,
      }
    })

    revalidatePath('/dashboard/vie-caserne')
    return { success: true }
  } catch (error) {
    console.error('Erreur suppression vote:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    }
  }
}

/**
 * Vérifier si l'utilisateur a voté
 */
export async function hasUserVoted(pollId: string): Promise<string | null> {
  const user = await getCurrentUser()

  const vote = await prisma.pollVote.findUnique({
    where: {
      pollId_userId: {
        pollId,
        userId: user.id,
      }
    }
  })

  return vote?.optionId || null
}

/**
 * Créer un sondage de dates pour un événement
 */
export async function createDatePoll(
  eventId: string,
  dates: Date[],
  expiresAt?: Date
): Promise<ActionResult<PollWithVotes>> {
  try {
    await getCurrentUser()

    const event = await prisma.event.findUnique({
      where: { id: eventId }
    })

    if (!event) {
      return { success: false, error: 'Événement non trouvé' }
    }

    const options: PollOption[] = dates.map((date, index) => ({
      id: `date_${index}`,
      label: new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date)
    }))

    const poll = await prisma.poll.create({
      data: {
        question: `Quelle date préférez-vous pour "${event.title}" ?`,
        options: options as object,
        eventId,
        expiresAt,
      },
      include: {
        event: true,
        votes: true,
      }
    })

    revalidatePath('/dashboard/vie-caserne')
    return { success: true, data: poll }
  } catch (error) {
    console.error('Erreur création sondage dates:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    }
  }
}

/**
 * Clôturer un sondage
 */
export async function closePoll(pollId: string): Promise<ActionResult> {
  try {
    await prisma.poll.update({
      where: { id: pollId },
      data: { expiresAt: new Date() }
    })

    revalidatePath('/dashboard/vie-caserne')
    return { success: true }
  } catch (error) {
    console.error('Erreur clôture sondage:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    }
  }
}

/**
 * Supprimer un sondage
 */
export async function deletePoll(pollId: string): Promise<ActionResult> {
  try {
    await prisma.poll.delete({
      where: { id: pollId }
    })

    revalidatePath('/dashboard/vie-caserne')
    return { success: true }
  } catch (error) {
    console.error('Erreur suppression sondage:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    }
  }
}

/**
 * Statistiques des sondages
 */
export async function getPollsStats() {
  const now = new Date()

  const [active, total, totalVotes] = await Promise.all([
    prisma.poll.count({
      where: {
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } }
        ]
      }
    }),
    prisma.poll.count(),
    prisma.pollVote.count()
  ])

  return { active, total, totalVotes }
}
