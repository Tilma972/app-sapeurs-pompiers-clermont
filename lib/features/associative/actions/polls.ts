// ============================================
// Server Actions - Sondages & Votes
// Module Vie de Caserne
// ============================================

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type {
  CreatePollInput,
  VoteInput,
  ActionResult,
  PollWithVotes,
  PollOption,
  Poll,
  PollVote,
  Event
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

// Helpers
function mapPollDates(p: any): Poll {
  return {
    ...p,
    expiresAt: p.expiresAt ? new Date(p.expiresAt) : null,
    createdAt: new Date(p.createdAt),
  }
}

function mapVoteDates(v: any): PollVote {
  return {
    ...v,
    createdAt: new Date(v.createdAt),
  }
}

function mapEventDates(e: any): Event {
  return {
    ...e,
    date: new Date(e.date),
    createdAt: new Date(e.createdAt),
    updatedAt: new Date(e.updatedAt),
  }
}

/**
 * Créer un nouveau sondage
 */
export async function createPoll(
  input: CreatePollInput
): Promise<ActionResult<PollWithVotes>> {
  const supabase = await createClient()
  try {
    await getCurrentUser()

    const { data: poll, error } = await supabase
      .from('associative_polls')
      .insert({
        question: input.question,
        options: input.options, // JSONB handled automatically
        eventId: input.eventId,
        expiresAt: input.expiresAt ? input.expiresAt.toISOString() : null,
      })
      .select(`
        *,
        event:associative_events(*)
      `)
      .single()

    if (error || !poll) throw new Error(error?.message || 'Erreur création sondage')

    const result: PollWithVotes = {
      ...mapPollDates(poll),
      event: poll.event ? mapEventDates(poll.event) : null,
      votes: [],
      _count: { votes: 0 }
    }

    revalidatePath('/associative')
    return { success: true, data: result }
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
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('associative_polls')
    .select(`
      *,
      event:associative_events(*),
      votes:associative_poll_votes(*)
    `)
    .or(`expiresAt.is.null,expiresAt.gt.${now}`)
    .order('createdAt', { ascending: false })

  if (error || !data) return []

  return data.map((p: any) => ({
    ...mapPollDates(p),
    event: p.event ? mapEventDates(p.event) : null,
    votes: (p.votes || []).map(mapVoteDates),
    _count: {
      votes: (p.votes || []).length
    }
  }))
}

/**
 * Récupérer un sondage par ID avec résultats
 */
export async function getPollById(pollId: string): Promise<PollWithVotes | null> {
  const supabase = await createClient()

  const { data: poll, error } = await supabase
    .from('associative_polls')
    .select(`
      *,
      event:associative_events(*),
      votes:associative_poll_votes(*)
    `)
    .eq('id', pollId)
    .single()

  if (error || !poll) return null

  return {
    ...mapPollDates(poll),
    event: poll.event ? mapEventDates(poll.event) : null,
    votes: (poll.votes || []).map(mapVoteDates),
    _count: {
      votes: (poll.votes || []).length
    }
  }
}

/**
 * Calculer les résultats d'un sondage
 */
export async function getPollResults(pollId: string) {
  const supabase = await createClient()

  const { data: poll, error } = await supabase
    .from('associative_polls')
    .select(`
      *,
      votes:associative_poll_votes(*)
    `)
    .eq('id', pollId)
    .single()

  if (error || !poll) return null

  const options = poll.options as unknown as PollOption[]
  const votes = poll.votes || []
  const totalVotes = votes.length

  const results = options.map(option => {
    const voteCount = votes.filter((v: any) => v.optionId === option.id).length
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
  const supabase = await createClient()
  try {
    const user = await getCurrentUser()

    // Vérifier que le sondage existe et n'est pas expiré
    const { data: poll } = await supabase
      .from('associative_polls')
      .select('*')
      .eq('id', input.pollId)
      .single()

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

    // Upsert le vote (créer ou mettre à jour)
    const { error } = await supabase
      .from('associative_poll_votes')
      .upsert({
        pollId: input.pollId,
        userId: user.id,
        optionId: input.optionId,
      }, { onConflict: 'pollId, userId' })

    if (error) throw error

    revalidatePath('/associative')
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
  const supabase = await createClient()
  try {
    const user = await getCurrentUser()

    const { error } = await supabase
      .from('associative_poll_votes')
      .delete()
      .eq('pollId', pollId)
      .eq('userId', user.id)

    if (error) throw error

    revalidatePath('/associative')
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
  const supabase = await createClient()
  const user = await getCurrentUser()

  const { data: vote } = await supabase
    .from('associative_poll_votes')
    .select('optionId')
    .eq('pollId', pollId)
    .eq('userId', user.id)
    .single()

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
  const supabase = await createClient()
  try {
    await getCurrentUser()

    const { data: event } = await supabase
      .from('associative_events')
      .select('title')
      .eq('id', eventId)
      .single()

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

    const { data: poll, error } = await supabase
      .from('associative_polls')
      .insert({
        question: `Quelle date préférez-vous pour "${event.title}" ?`,
        options: options,
        eventId,
        expiresAt: expiresAt ? expiresAt.toISOString() : null,
      })
      .select(`
        *,
        event:associative_events(*),
        votes:associative_poll_votes(*)
      `)
      .single()

    if (error || !poll) throw new Error(error?.message || 'Erreur création sondage dates')

    const result: PollWithVotes = {
      ...mapPollDates(poll),
      event: poll.event ? mapEventDates(poll.event) : null,
      votes: [],
      _count: { votes: 0 }
    }

    revalidatePath('/associative')
    return { success: true, data: result }
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
  const supabase = await createClient()
  try {
    const { error } = await supabase
      .from('associative_polls')
      .update({ expiresAt: new Date().toISOString() })
      .eq('id', pollId)

    if (error) throw error

    revalidatePath('/associative')
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
  const supabase = await createClient()
  try {
    const { error } = await supabase
      .from('associative_polls')
      .delete()
      .eq('id', pollId)

    if (error) throw error

    revalidatePath('/associative')
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
  const supabase = await createClient()
  const now = new Date().toISOString()

  const [activeResult, totalResult, votesResult] = await Promise.all([
    supabase
      .from('associative_polls')
      .select('*', { count: 'exact', head: true })
      .or(`expiresAt.is.null,expiresAt.gt.${now}`),
    supabase
      .from('associative_polls')
      .select('*', { count: 'exact', head: true }),
    supabase
      .from('associative_poll_votes')
      .select('*', { count: 'exact', head: true })
  ])

  return {
    active: activeResult.count || 0,
    total: totalResult.count || 0,
    totalVotes: votesResult.count || 0
  }
}
