// ============================================
// Server Actions - Cagnottes
// Module Vie de Caserne
// Intégration Stripe pour les contributions
// ============================================

'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe/client'
import type { 
  CreateMoneyPotInput, 
  ContributeToPotInput,
  ActionResult, 
  MoneyPotWithDetails,
  ContributionPaymentResult 
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
 * Créer une nouvelle cagnotte
 */
export async function createMoneyPot(
  input: CreateMoneyPotInput
): Promise<ActionResult<MoneyPotWithDetails>> {
  try {
    await getCurrentUser()

    const pot = await prisma.moneyPot.create({
      data: {
        title: input.title,
        description: input.description,
        targetAmount: input.targetAmount,
        eventId: input.eventId,
      },
      include: {
        event: true,
        contributions: true,
      }
    })

    revalidatePath('/dashboard/vie-caserne')
    return { success: true, data: pot }
  } catch (error) {
    console.error('Erreur création cagnotte:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    }
  }
}

/**
 * Récupérer toutes les cagnottes actives
 */
export async function getActiveMoneyPots(): Promise<MoneyPotWithDetails[]> {
  const pots = await prisma.moneyPot.findMany({
    where: { status: 'ACTIVE' },
    include: {
      event: true,
      contributions: {
        where: { status: 'COMPLETED' }
      },
      _count: {
        select: { contributions: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Calculer le total collecté pour chaque cagnotte
  return pots.map(pot => ({
    ...pot,
    totalCollected: pot.contributions.reduce(
      (sum, c) => sum + Number(c.amount), 
      0
    )
  }))
}

/**
 * Récupérer une cagnotte par ID
 */
export async function getMoneyPotById(potId: string): Promise<MoneyPotWithDetails | null> {
  const pot = await prisma.moneyPot.findUnique({
    where: { id: potId },
    include: {
      event: true,
      contributions: {
        where: { status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' }
      },
      _count: {
        select: { contributions: true }
      }
    }
  })

  if (!pot) return null

  return {
    ...pot,
    totalCollected: pot.contributions.reduce(
      (sum, c) => sum + Number(c.amount), 
      0
    )
  }
}

/**
 * ⭐ Contribuer à une cagnotte - Création PaymentIntent Stripe
 * 
 * Cette action :
 * 1. Vérifie que la cagnotte existe et est active
 * 2. Crée un enregistrement de contribution en statut PENDING
 * 3. Crée un PaymentIntent Stripe
 * 4. Retourne le clientSecret pour le paiement côté client
 */
export async function contributeToPot(
  input: ContributeToPotInput
): Promise<ContributionPaymentResult> {
  try {
    const user = await getCurrentUser()
    const stripe = getStripe()

    // 1. Vérifier que la cagnotte existe et est active
    const pot = await prisma.moneyPot.findUnique({
      where: { id: input.potId },
      include: { event: true }
    })

    if (!pot) {
      return { success: false, error: 'Cagnotte non trouvée' }
    }

    if (pot.status !== 'ACTIVE') {
      return { success: false, error: 'Cette cagnotte est clôturée' }
    }

    // Validation du montant (minimum 1€ = 100 centimes)
    if (input.amount < 100) {
      return { success: false, error: 'Le montant minimum est de 1€' }
    }

    // 2. Créer la contribution en base (statut PENDING)
    const contribution = await prisma.contribution.create({
      data: {
        moneyPotId: input.potId,
        userId: user.id,
        amount: input.amount / 100, // Convertir centimes en euros pour stockage
        message: input.message,
        isAnonymous: input.isAnonymous || false,
        status: 'PENDING',
      }
    })

    // 3. Créer le PaymentIntent Stripe
    const eventTitle = pot.event?.title || pot.title
    const paymentIntent = await stripe.paymentIntents.create({
      amount: input.amount, // Stripe attend des centimes
      currency: 'eur',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        type: 'cagnotte',
        potId: input.potId,
        potTitle: pot.title,
        contributionId: contribution.id,
        userId: user.id,
        isAnonymous: String(input.isAnonymous || false),
      },
      description: `Contribution cagnotte: ${eventTitle}`,
      // Optionnel: associer au customer Stripe si existant
      // customer: stripeCustomerId,
    })

    // 4. Mettre à jour la contribution avec l'ID Stripe
    await prisma.contribution.update({
      where: { id: contribution.id },
      data: { stripePaymentId: paymentIntent.id }
    })

    return {
      success: true,
      clientSecret: paymentIntent.client_secret!,
      contributionId: contribution.id,
    }
  } catch (error) {
    console.error('Erreur contribution cagnotte:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur lors du paiement' 
    }
  }
}

/**
 * Confirmer une contribution après paiement réussi
 * (Appelé par le webhook Stripe ou après confirmation client)
 */
export async function confirmContribution(
  contributionId: string,
  stripePaymentId: string
): Promise<ActionResult> {
  try {
    const contribution = await prisma.contribution.findUnique({
      where: { id: contributionId }
    })

    if (!contribution) {
      return { success: false, error: 'Contribution non trouvée' }
    }

    if (contribution.stripePaymentId !== stripePaymentId) {
      return { success: false, error: 'ID de paiement invalide' }
    }

    // Mettre à jour le statut
    await prisma.contribution.update({
      where: { id: contributionId },
      data: { status: 'COMPLETED' }
    })

    // Vérifier si l'objectif est atteint
    const pot = await prisma.moneyPot.findUnique({
      where: { id: contribution.moneyPotId },
      include: {
        contributions: {
          where: { status: 'COMPLETED' }
        }
      }
    })

    if (pot && pot.targetAmount) {
      const totalCollected = pot.contributions.reduce(
        (sum, c) => sum + Number(c.amount), 
        0
      )
      
      if (totalCollected >= Number(pot.targetAmount)) {
        await prisma.moneyPot.update({
          where: { id: pot.id },
          data: { status: 'COMPLETED' }
        })
      }
    }

    revalidatePath('/dashboard/vie-caserne')
    return { success: true }
  } catch (error) {
    console.error('Erreur confirmation contribution:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    }
  }
}

/**
 * Annuler une contribution (si paiement échoué)
 */
export async function cancelContribution(contributionId: string): Promise<ActionResult> {
  try {
    await prisma.contribution.update({
      where: { id: contributionId },
      data: { status: 'FAILED' }
    })

    return { success: true }
  } catch (error) {
    console.error('Erreur annulation contribution:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    }
  }
}

/**
 * Clôturer une cagnotte
 */
export async function closeMoneyPot(potId: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser()

    const pot = await prisma.moneyPot.findUnique({
      where: { id: potId },
      include: { event: true }
    })

    if (!pot) {
      return { success: false, error: 'Cagnotte non trouvée' }
    }

    // Vérifier que l'utilisateur est l'organisateur de l'événement associé
    if (pot.event && pot.event.organizerId !== user.id) {
      return { success: false, error: 'Non autorisé' }
    }

    await prisma.moneyPot.update({
      where: { id: potId },
      data: { status: 'CLOSED' }
    })

    revalidatePath('/dashboard/vie-caserne')
    return { success: true }
  } catch (error) {
    console.error('Erreur clôture cagnotte:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    }
  }
}

/**
 * Obtenir mes contributions
 */
export async function getMyContributions() {
  const user = await getCurrentUser()

  return prisma.contribution.findMany({
    where: { 
      userId: user.id,
      status: 'COMPLETED'
    },
    include: {
      moneyPot: {
        include: { event: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

/**
 * Statistiques des cagnottes
 */
export async function getMoneyPotsStats() {
  const [activePots, totalCollected, totalContributions] = await Promise.all([
    prisma.moneyPot.count({ where: { status: 'ACTIVE' } }),
    prisma.contribution.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true }
    }),
    prisma.contribution.count({ where: { status: 'COMPLETED' } })
  ])

  return {
    activePots,
    totalCollected: Number(totalCollected._sum.amount || 0),
    totalContributions,
  }
}
