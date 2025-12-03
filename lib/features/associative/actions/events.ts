// ============================================
// Server Actions - Événements
// Module Vie de Caserne
// ============================================

'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import type { 
  CreateEventInput, 
  UpdateParticipationInput, 
  ActionResult, 
  EventWithDetails 
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
 * Créer un nouvel événement
 */
export async function createEvent(input: CreateEventInput): Promise<ActionResult<EventWithDetails>> {
  try {
    const user = await getCurrentUser()

    const event = await prisma.event.create({
      data: {
        title: input.title,
        description: input.description,
        date: input.date,
        location: input.location,
        type: input.type,
        maxParticipants: input.maxParticipants,
        organizerId: user.id,
        // Créer une cagnotte associée si demandé
        ...(input.createMoneyPot && {
          moneyPot: {
            create: {
              title: input.moneyPotTitle || `Cagnotte - ${input.title}`,
              targetAmount: input.moneyPotTarget,
            }
          }
        })
      },
      include: {
        participants: true,
        moneyPot: true,
        polls: true,
      }
    })

    revalidatePath('/dashboard/vie-caserne')
    return { success: true, data: event }
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
  const page = options?.page || 1
  const pageSize = options?.pageSize || 10
  const skip = (page - 1) * pageSize

  const where = {
    ...(options?.status && { status: options.status }),
    ...(options?.type && { type: options.type }),
    ...(options?.upcoming && { 
      date: { gte: new Date() },
      status: 'PLANNED' as const
    }),
  }

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      include: {
        participants: true,
        moneyPot: {
          include: {
            contributions: true,
          }
        },
        polls: {
          include: {
            votes: true,
          }
        },
        _count: {
          select: { participants: true }
        }
      },
      orderBy: { date: 'asc' },
      skip,
      take: pageSize,
    }),
    prisma.event.count({ where })
  ])

  return {
    items: events,
    total,
    page,
    pageSize,
    hasMore: skip + events.length < total,
  }
}

/**
 * Récupérer un événement par ID
 */
export async function getEventById(eventId: string): Promise<EventWithDetails | null> {
  return prisma.event.findUnique({
    where: { id: eventId },
    include: {
      participants: true,
      moneyPot: {
        include: {
          contributions: true,
        }
      },
      polls: {
        include: {
          votes: true,
        }
      },
    }
  })
}

/**
 * Mettre à jour sa participation à un événement
 */
export async function updateParticipation(
  input: UpdateParticipationInput
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser()

    // Vérifier si l'événement existe et n'est pas complet
    const event = await prisma.event.findUnique({
      where: { id: input.eventId },
      include: {
        _count: { select: { participants: true } }
      }
    })

    if (!event) {
      return { success: false, error: 'Événement non trouvé' }
    }

    // Vérifier la limite de places si on s'inscrit comme PRESENT
    if (input.status === 'PRESENT' && event.maxParticipants) {
      const existingParticipation = await prisma.eventParticipant.findUnique({
        where: {
          eventId_userId: {
            eventId: input.eventId,
            userId: user.id,
          }
        }
      })

      // Si on n'était pas déjà inscrit comme PRESENT, vérifier les places
      if (!existingParticipation || existingParticipation.status !== 'PRESENT') {
        const currentPresent = await prisma.eventParticipant.count({
          where: {
            eventId: input.eventId,
            status: 'PRESENT',
          }
        })

        if (currentPresent >= event.maxParticipants) {
          return { success: false, error: 'Événement complet' }
        }
      }
    }

    // Upsert la participation
    await prisma.eventParticipant.upsert({
      where: {
        eventId_userId: {
          eventId: input.eventId,
          userId: user.id,
        }
      },
      update: {
        status: input.status,
        guests: input.guests || 0,
      },
      create: {
        eventId: input.eventId,
        userId: user.id,
        status: input.status,
        guests: input.guests || 0,
      }
    })

    revalidatePath('/dashboard/vie-caserne')
    revalidatePath(`/dashboard/vie-caserne/events/${input.eventId}`)
    
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
  try {
    const user = await getCurrentUser()

    const event = await prisma.event.findUnique({
      where: { id: eventId }
    })

    if (!event) {
      return { success: false, error: 'Événement non trouvé' }
    }

    if (event.organizerId !== user.id) {
      return { success: false, error: 'Non autorisé' }
    }

    await prisma.event.update({
      where: { id: eventId },
      data: { status: 'CANCELLED' }
    })

    revalidatePath('/dashboard/vie-caserne')
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
  const user = await getCurrentUser()

  const participations = await prisma.eventParticipant.findMany({
    where: {
      userId: user.id,
      status: 'PRESENT',
      event: {
        date: { gte: new Date() },
        status: 'PLANNED',
      }
    },
    include: {
      event: {
        include: {
          _count: { select: { participants: true } }
        }
      }
    },
    orderBy: {
      event: { date: 'asc' }
    }
  })

  return participations.map(p => p.event)
}

/**
 * Obtenir les statistiques des événements
 */
export async function getEventsStats() {
  const now = new Date()
  
  const [upcoming, past, totalParticipants] = await Promise.all([
    prisma.event.count({
      where: { date: { gte: now }, status: 'PLANNED' }
    }),
    prisma.event.count({
      where: { date: { lt: now } }
    }),
    prisma.eventParticipant.count({
      where: { status: 'PRESENT' }
    })
  ])

  return { upcoming, past, totalParticipants }
}
