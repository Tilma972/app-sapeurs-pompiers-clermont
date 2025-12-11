// ============================================
// Server Actions - Événements
// Module Vie de Caserne
// ============================================

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type {
  CreateEventInput,
  UpdateParticipationInput,
  ActionResult,
  EventWithDetails,
  Event,
  EventParticipant,
  MoneyPot,
  Poll
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

// Helper pour convertir les dates venant de Supabase (string) en Date
function mapEventDates(event: any): Event {
  return {
    ...event,
    date: new Date(event.date),
    createdAt: new Date(event.createdAt),
    updatedAt: new Date(event.updatedAt),
  }
}

function mapParticipantDates(p: any): EventParticipant {
  return {
    ...p,
    createdAt: new Date(p.createdAt),
    updatedAt: new Date(p.updatedAt),
  }
}

function mapMoneyPotDates(mp: any): MoneyPot {
  return {
    ...mp,
    createdAt: new Date(mp.createdAt),
    updatedAt: new Date(mp.updatedAt),
  }
}

function mapPollDates(poll: any): Poll {
  return {
    ...poll,
    expiresAt: poll.expiresAt ? new Date(poll.expiresAt) : null,
    createdAt: new Date(poll.createdAt),
  }
}

/**
 * Créer un nouvel événement
 */
export async function createEvent(input: CreateEventInput): Promise<ActionResult<EventWithDetails>> {
  const supabase = await createClient()
  try {
    const user = await getCurrentUser()

    // 1. Créer l'événement
    const { data: eventData, error: eventError } = await supabase
      .from('associative_events')
      .insert({
        title: input.title,
        description: input.description,
        date: input.date.toISOString(),
        location: input.location,
        type: input.type,
        maxParticipants: input.maxParticipants,
        organizerId: user.id,
      })
      .select()
      .single()

    if (eventError || !eventData) throw new Error(eventError?.message || 'Erreur création événement')

    let moneyPotData = null

    // 2. Créer la cagnotte si demandé
    if (input.createMoneyPot) {
      const { data: mpData, error: mpError } = await supabase
        .from('associative_money_pots')
        .insert({
          title: input.moneyPotTitle || `Cagnotte - ${input.title}`,
          targetAmount: input.moneyPotTarget,
          eventId: eventData.id,
        })
        .select()
        .single()

      if (mpError) console.error('Erreur création cagnotte:', mpError)
      else moneyPotData = mpData
    }

    // Reconstruire l'objet complet
    const event = mapEventDates(eventData)
    const result: EventWithDetails = {
      ...event,
      participants: [],
      moneyPot: moneyPotData ? mapMoneyPotDates(moneyPotData) : null,
      polls: [],
    }

    revalidatePath('/associative')
    return { success: true, data: result }
  } catch (error) {
    console.error('Erreur création événement:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }
  }
}

/**
 * Récupérer tous les événements (avec pagination)
 */
export async function getEvents(options?: {
  page?: number
  pageSize?: number
  status?: 'DRAFT' | 'PLANNED' | 'COMPLETED' | 'CANCELLED'
  type?: 'AG' | 'SAINTE_BARBE' | 'REPAS_GARDE' | 'SPORT' | 'AUTRE'
  upcoming?: boolean
}) {
  const supabase = await createClient()
  const page = options?.page || 1
  const pageSize = options?.pageSize || 10
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('associative_events')
    .select(`
      *,
      participants:associative_event_participants(*),
      moneyPot:associative_money_pots(
        *,
        contributions:associative_contributions(*)
      ),
      polls:associative_polls(
        *,
        votes:associative_poll_votes(*)
      )
    `, { count: 'exact' })
    .order('date', { ascending: true })
    .range(from, to)

  if (options?.status) query = query.eq('status', options.status)
  if (options?.type) query = query.eq('type', options.type)
  if (options?.upcoming) {
    query = query.gte('date', new Date().toISOString())
    query = query.eq('status', 'PLANNED')
  }

  const { data, error, count } = await query

  if (error) {
    console.error('Erreur récupération événements:', error)
    return { items: [], total: 0, page, pageSize, hasMore: false }
  }

  const items = data.map((item: any) => ({
    ...mapEventDates(item),
    participants: (item.participants || []).map(mapParticipantDates),
    moneyPot: item.moneyPot ? {
      ...mapMoneyPotDates(item.moneyPot),
      contributions: item.moneyPot.contributions || [] // TODO: map contributions if needed
    } : null,
    polls: (item.polls || []).map((poll: any) => ({
      ...mapPollDates(poll),
      votes: poll.votes || []
    })),
    _count: {
      participants: item.participants?.length || 0
    }
  })) as EventWithDetails[]

  return {
    items,
    total: count || 0,
    page,
    pageSize,
    hasMore: (count || 0) > to + 1,
  }
}

/**
 * Récupérer un événement par ID
 */
export async function getEventById(eventId: string): Promise<EventWithDetails | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('associative_events')
    .select(`
      *,
      participants:associative_event_participants(*),
      moneyPot:associative_money_pots(
        *,
        contributions:associative_contributions(*)
      ),
      polls:associative_polls(
        *,
        votes:associative_poll_votes(*)
      )
    `)
    .eq('id', eventId)
    .single()

  if (error || !data) return null

  return {
    ...mapEventDates(data),
    participants: (data.participants || []).map(mapParticipantDates),
    moneyPot: data.moneyPot ? {
      ...mapMoneyPotDates(data.moneyPot),
      contributions: data.moneyPot.contributions || []
    } : null,
    polls: (data.polls || []).map((poll: any) => ({
      ...mapPollDates(poll),
      votes: poll.votes || []
    })),
  } as EventWithDetails
}

/**
 * Mettre à jour sa participation à un événement
 */
export async function updateParticipation(
  input: UpdateParticipationInput
): Promise<ActionResult> {
  const supabase = await createClient()
  try {
    const user = await getCurrentUser()

    // Vérifier si l'événement existe et n'est pas complet
    // On doit faire deux requêtes car Supabase n'a pas de "transaction" simple côté client JS pour ce check complexe
    // Ou on utilise une fonction RPC, mais ici on va faire simple pour l'instant

    const { data: event, error: eventError } = await supabase
      .from('associative_events')
      .select('maxParticipants')
      .eq('id', input.eventId)
      .single()

    if (eventError || !event) {
      return { success: false, error: 'Événement non trouvé' }
    }

    // Vérifier la limite de places si on s'inscrit comme PRESENT
    if (input.status === 'PRESENT' && event.maxParticipants) {
      // Vérifier ma participation actuelle
      const { data: myPart } = await supabase
        .from('associative_event_participants')
        .select('status')
        .eq('eventId', input.eventId)
        .eq('userId', user.id)
        .single()

      // Si on n'était pas déjà inscrit comme PRESENT
      if (!myPart || myPart.status !== 'PRESENT') {
        const { count } = await supabase
          .from('associative_event_participants')
          .select('*', { count: 'exact', head: true })
          .eq('eventId', input.eventId)
          .eq('status', 'PRESENT')

        if ((count || 0) >= event.maxParticipants) {
          return { success: false, error: 'Événement complet' }
        }
      }
    }

    // Upsert la participation
    const { error: upsertError } = await supabase
      .from('associative_event_participants')
      .upsert({
        eventId: input.eventId,
        userId: user.id,
        status: input.status,
        guests: input.guests || 0,
        updatedAt: new Date().toISOString(), // Force update timestamp
      }, { onConflict: 'eventId, userId' })

    if (upsertError) throw upsertError

    revalidatePath('/associative')

    return { success: true }
  } catch (error) {
    console.error('Erreur mise à jour participation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }
  }
}

/**
 * Annuler un événement (organisateur uniquement)
 */
export async function cancelEvent(eventId: string): Promise<ActionResult> {
  const supabase = await createClient()
  try {
    const user = await getCurrentUser()

    const { data: event } = await supabase
      .from('associative_events')
      .select('organizerId')
      .eq('id', eventId)
      .single()

    if (!event) {
      return { success: false, error: 'Événement non trouvé' }
    }

    if (event.organizerId !== user.id) {
      return { success: false, error: 'Non autorisé' }
    }

    const { error } = await supabase
      .from('associative_events')
      .update({ status: 'CANCELLED' })
      .eq('id', eventId)

    if (error) throw error

    revalidatePath('/associative')
    return { success: true }
  } catch (error) {
    console.error('Erreur annulation événement:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }
  }
}

/**
 * Récupérer les événements à venir pour l'utilisateur
 */
export async function getMyUpcomingEvents() {
  const supabase = await createClient()
  const user = await getCurrentUser()

  // Supabase ne permet pas facilement de faire des jointures inversées complexes en une seule requête simple
  // On va récupérer les participations puis les événements
  // Ou utiliser le filtrage sur les relations : .select('*, event:associative_events!inner(*)')

  const { data, error } = await supabase
    .from('associative_event_participants')
    .select(`
      event:associative_events!inner (
        *,
        participants:associative_event_participants(count)
      )
    `)
    .eq('userId', user.id)
    .eq('status', 'PRESENT')
    .gte('event.date', new Date().toISOString())
    .eq('event.status', 'PLANNED')
    .order('date', { foreignTable: 'event', ascending: true })

  if (error) {
    console.error('Erreur getMyUpcomingEvents:', error)
    return []
  }

  // Mapper le résultat
  return data.map((item: any) => {
    const event = item.event
    return {
      ...mapEventDates(event),
      _count: {
        participants: event.participants?.[0]?.count || 0
      }
    }
  })
}

/**
 * Obtenir les statistiques des événements
 */
export async function getEventsStats() {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const [upcomingResult, pastResult, participantsResult] = await Promise.all([
    supabase
      .from('associative_events')
      .select('*', { count: 'exact', head: true })
      .gte('date', now)
      .eq('status', 'PLANNED'),
    supabase
      .from('associative_events')
      .select('*', { count: 'exact', head: true })
      .lt('date', now),
    supabase
      .from('associative_event_participants')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'PRESENT')
  ])

  return {
    upcoming: upcomingResult.count || 0,
    past: pastResult.count || 0,
    totalParticipants: participantsResult.count || 0
  }
}
