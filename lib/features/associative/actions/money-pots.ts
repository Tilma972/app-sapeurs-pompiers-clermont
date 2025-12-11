// ============================================
// Server Actions - Cagnottes
// Module Vie de Caserne
// Intégration Stripe pour les contributions
// ============================================

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe/client'
import type {
  CreateMoneyPotInput,
  ContributeToPotInput,
  ActionResult,
  MoneyPotWithDetails,
  ContributionPaymentResult,
  MoneyPot,
  Contribution,
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

// Helpers pour convertir les dates
function mapMoneyPotDates(mp: any): MoneyPot {
  return {
    ...mp,
    createdAt: new Date(mp.createdAt),
    updatedAt: new Date(mp.updatedAt),
  }
}

function mapContributionDates(c: any): Contribution {
  return {
    ...c,
    createdAt: new Date(c.createdAt),
    updatedAt: new Date(c.updatedAt),
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
 * Créer une nouvelle cagnotte
 */
export async function createMoneyPot(
  input: CreateMoneyPotInput
): Promise<ActionResult<MoneyPotWithDetails>> {
  const supabase = await createClient()
  try {
    await getCurrentUser()

    const { data: potData, error } = await supabase
      .from('associative_money_pots')
      .insert({
        title: input.title,
        description: input.description,
        targetAmount: input.targetAmount,
        eventId: input.eventId,
      })
      .select(`
        *,
        event:associative_events(*)
      `)
      .single()

    if (error || !potData) throw new Error(error?.message || 'Erreur création cagnotte')

    const pot = mapMoneyPotDates(potData)
    const event = potData.event ? mapEventDates(potData.event) : null

    const result: MoneyPotWithDetails = {
      ...pot,
      event,
      contributions: [],
      _count: { contributions: 0 },
      totalCollected: 0
    }

    revalidatePath('/associative')
    return { success: true, data: result }
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
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('associative_money_pots')
    .select(`
      *,
      event:associative_events(*),
      contributions:associative_contributions(*)
    `)
    .eq('status', 'ACTIVE')
    .eq('contributions.status', 'COMPLETED')
    .order('createdAt', { ascending: false })

  if (error || !data) {
    console.error('Erreur récupération cagnottes:', error)
    return []
  }

  return data.map((pot: any) => {
    const contributions = (pot.contributions || []).map(mapContributionDates)
    return {
      ...mapMoneyPotDates(pot),
      event: pot.event ? mapEventDates(pot.event) : null,
      contributions,
      _count: {
        contributions: contributions.length
      },
      totalCollected: contributions.reduce(
        (sum: number, c: Contribution) => sum + Number(c.amount),
        0
      )
    }
  })
}

/**
 * Récupérer une cagnotte par ID
 */
export async function getMoneyPotById(potId: string): Promise<MoneyPotWithDetails | null> {
  const supabase = await createClient()

  const { data: pot, error } = await supabase
    .from('associative_money_pots')
    .select(`
      *,
      event:associative_events(*),
      contributions:associative_contributions(*)
    `)
    .eq('id', potId)
    .single()

  if (error || !pot) return null

  // Filtrer les contributions COMPLETED (Supabase ne permet pas de filtrer facilement dans le select imbriqué sur une relation one-to-many sans affecter le parent si on utilise !inner, mais ici c'est left join par défaut)
  // Cependant, le .select() ramène TOUTES les contributions si on ne filtre pas.
  // Pour filtrer les relations imbriquées, on peut utiliser des modifiers, mais c'est limité.
  // Le plus simple est de filtrer en JS ici car le volume de contributions n'est pas énorme.

  const completedContributions = (pot.contributions || [])
    .filter((c: any) => c.status === 'COMPLETED')
    .map(mapContributionDates)
    .sort((a: Contribution, b: Contribution) => b.createdAt.getTime() - a.createdAt.getTime())

  return {
    ...mapMoneyPotDates(pot),
    event: pot.event ? mapEventDates(pot.event) : null,
    contributions: completedContributions,
    _count: {
      contributions: completedContributions.length
    },
    totalCollected: completedContributions.reduce(
      (sum: number, c: Contribution) => sum + Number(c.amount),
      0
    )
  }
}

/**
 * ⭐ Contribuer à une cagnotte - Création PaymentIntent Stripe
 */
export async function contributeToPot(
  input: ContributeToPotInput
): Promise<ContributionPaymentResult> {
  const supabase = await createClient()
  try {
    const user = await getCurrentUser()
    const stripe = getStripe()

    // 1. Vérifier que la cagnotte existe et est active
    const { data: pot, error: potError } = await supabase
      .from('associative_money_pots')
      .select(`*, event:associative_events(*)`)
      .eq('id', input.potId)
      .single()

    if (potError || !pot) {
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
    const { data: contribution, error: contribError } = await supabase
      .from('associative_contributions')
      .insert({
        moneyPotId: input.potId,
        userId: user.id,
        amount: input.amount / 100, // Convertir centimes en euros pour stockage
        message: input.message,
        isAnonymous: input.isAnonymous || false,
        status: 'PENDING',
      })
      .select()
      .single()

    if (contribError || !contribution) throw new Error(contribError?.message || 'Erreur création contribution')

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
    })

    // 4. Mettre à jour la contribution avec l'ID Stripe
    await supabase
      .from('associative_contributions')
      .update({ stripePaymentId: paymentIntent.id })
      .eq('id', contribution.id)

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
 */
export async function confirmContribution(
  contributionId: string,
  stripePaymentId: string
): Promise<ActionResult> {
  const supabase = await createClient()
  try {
    const { data: contribution, error: contribError } = await supabase
      .from('associative_contributions')
      .select('*')
      .eq('id', contributionId)
      .single()

    if (contribError || !contribution) {
      return { success: false, error: 'Contribution non trouvée' }
    }

    if (contribution.stripePaymentId !== stripePaymentId) {
      return { success: false, error: 'ID de paiement invalide' }
    }

    // Mettre à jour le statut
    await supabase
      .from('associative_contributions')
      .update({ status: 'COMPLETED' })
      .eq('id', contributionId)

    // Vérifier si l'objectif est atteint
    const { data: pot } = await supabase
      .from('associative_money_pots')
      .select(`
        *,
        contributions:associative_contributions(*)
      `)
      .eq('id', contribution.moneyPotId)
      .single()

    if (pot && pot.targetAmount) {
      const completedContributions = (pot.contributions || []).filter((c: any) => c.status === 'COMPLETED')
      const totalCollected = completedContributions.reduce(
        (sum: number, c: any) => sum + Number(c.amount),
        0
      )

      if (totalCollected >= Number(pot.targetAmount)) {
        await supabase
          .from('associative_money_pots')
          .update({ status: 'COMPLETED' })
          .eq('id', pot.id)
      }
    }

    revalidatePath('/associative')
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
  const supabase = await createClient()
  try {
    await supabase
      .from('associative_contributions')
      .update({ status: 'FAILED' })
      .eq('id', contributionId)

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
  const supabase = await createClient()
  try {
    const user = await getCurrentUser()

    const { data: pot } = await supabase
      .from('associative_money_pots')
      .select(`*, event:associative_events(*)`)
      .eq('id', potId)
      .single()

    if (!pot) {
      return { success: false, error: 'Cagnotte non trouvée' }
    }

    // Vérifier que l'utilisateur est l'organisateur de l'événement associé
    if (pot.event && pot.event.organizerId !== user.id) {
      return { success: false, error: 'Non autorisé' }
    }

    await supabase
      .from('associative_money_pots')
      .update({ status: 'CLOSED' })
      .eq('id', potId)

    revalidatePath('/associative')
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
  const supabase = await createClient()
  const user = await getCurrentUser()

  const { data, error } = await supabase
    .from('associative_contributions')
    .select(`
      *,
      moneyPot:associative_money_pots(
        *,
        event:associative_events(*)
      )
    `)
    .eq('userId', user.id)
    .eq('status', 'COMPLETED')
    .order('createdAt', { ascending: false })

  if (error || !data) return []

  return data.map((c: any) => ({
    ...mapContributionDates(c),
    moneyPot: c.moneyPot ? {
      ...mapMoneyPotDates(c.moneyPot),
      event: c.moneyPot.event ? mapEventDates(c.moneyPot.event) : null
    } : null
  }))
}

/**
 * Statistiques des cagnottes
 */
export async function getMoneyPotsStats() {
  const supabase = await createClient()

  const [activePotsResult, contributionsResult] = await Promise.all([
    supabase
      .from('associative_money_pots')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ACTIVE'),
    supabase
      .from('associative_contributions')
      .select('amount')
      .eq('status', 'COMPLETED')
  ])

  const totalCollected = (contributionsResult.data || []).reduce(
    (sum, c) => sum + Number(c.amount),
    0
  )

  return {
    activePots: activePotsResult.count || 0,
    totalCollected,
    totalContributions: contributionsResult.data?.length || 0,
  }
}
