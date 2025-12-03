/**
 * Handler pour l'événement charge.succeeded
 * Gère les paiements terrain via Charge (fallback pour billing_details complets)
 */

import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/client'
import { createLogger } from '@/lib/log'
import type { StripeCharge, HandlerResult } from '../types'
import { parseCalendarAccepted } from '../validators'
import { transactionExists, createTransaction } from '../services/transaction'
import { sendGenericConfirmationEmail } from '../services/email'
import { triggerFiscalReceipt } from '../services/n8n'

const log = createLogger('webhook/stripe/charge')

// ============================================================================
// EXTRACTION DES MÉTADONNÉES
// ============================================================================

interface ChargeMetadata {
  tourneeId: string | undefined
  userId: string | undefined
  calendarGiven: boolean
}

/**
 * Extrait les métadonnées depuis la charge ou le PaymentIntent associé
 */
async function extractMetadata(charge: StripeCharge): Promise<ChargeMetadata> {
  const metadata = charge.metadata || {}
  let tourneeId = metadata.tournee_id
  let userId = metadata.user_id
  let calendarGiven = parseCalendarAccepted(metadata.calendar_given)

  // Si metadata manquantes sur la charge, tenter de lire celles du PaymentIntent
  if ((!tourneeId || !userId) && charge.payment_intent) {
    try {
      const stripe = getStripe()
      const pi = await stripe.paymentIntents.retrieve(charge.payment_intent)
      const piMeta = (pi as { metadata?: Record<string, string> }).metadata || {}
      tourneeId = tourneeId || piMeta.tournee_id
      userId = userId || piMeta.user_id
      if (typeof piMeta.calendar_given === 'string') {
        calendarGiven = parseCalendarAccepted(piMeta.calendar_given)
      }
    } catch (err) {
      log.warn('Impossible de récupérer metadata depuis PI', {
        message: (err as Error)?.message,
        chargeId: charge.id,
      })
    }
  }

  return { tourneeId, userId, calendarGiven }
}

/**
 * Traite un événement charge.succeeded
 */
export async function handleCharge(charge: StripeCharge): Promise<HandlerResult> {
  const amount = charge.amount / 100
  const donorName = charge.billing_details?.name ?? undefined
  const donorEmail = charge.billing_details?.email ?? undefined

  log.info('📥 Traitement charge.succeeded', {
    charge_id: charge.id,
    amount,
    has_email: !!donorEmail,
    has_pi: !!charge.payment_intent,
  })

  // ========================================================================
  // EXTRACTION DES MÉTADONNÉES
  // ========================================================================
  const meta = await extractMetadata(charge)

  // Si pas de tournee_id ou user_id, c'est probablement pas un don terrain
  // On log et on retourne success (pour ne pas bloquer Stripe)
  if (!meta.tourneeId || !meta.userId) {
    log.warn('Metadata manquantes sur charge (probablement pas un don terrain)', {
      chargeId: charge.id,
      hasTournee: !!meta.tourneeId,
      hasUser: !!meta.userId,
    })
    return {
      success: true,
      response: NextResponse.json({ received: true }),
    }
  }

  // ========================================================================
  // IDEMPOTENCE : Vérifier si déjà traité
  // ========================================================================
  const piId = charge.payment_intent || charge.id
  const exists = await transactionExists(piId)
  if (exists) {
    log.info('Transaction déjà traitée (idempotence)', { piId })
    return {
      success: true,
      response: NextResponse.json({ received: true }),
    }
  }

  // ========================================================================
  // CRÉATION DE LA TRANSACTION
  // ========================================================================
  const result = await createTransaction({
    user_id: meta.userId,
    tournee_id: meta.tourneeId,
    amount,
    calendar_accepted: meta.calendarGiven,
    payment_method: 'carte',
    payment_status: 'completed',
    stripe_session_id: piId,
    supporter_email: donorEmail ?? null,
    supporter_name: donorName ?? null,
    notes: `Stripe Charge - ${charge.id}`,
    source: 'terrain',
  })

  if (!result.success || !result.transaction) {
    log.error('❌ Échec création transaction (Charge)', {
      charge_id: charge.id,
      error: result.error,
    })
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Database insertion failed', details: result.error },
        { status: 500 }
      ),
      error: result.error,
    }
  }

  const tx = result.transaction

  // ========================================================================
  // EMAIL DE CONFIRMATION
  // ========================================================================
  if (donorEmail) {
    await sendGenericConfirmationEmail(
      donorEmail,
      donorName ?? null,
      amount,
      meta.calendarGiven,
      tx.id
    )
  }

  // ========================================================================
  // N8N : Reçu fiscal
  // ========================================================================
  await triggerFiscalReceipt({
    transaction: tx,
    calendarAccepted: meta.calendarGiven,
    userId: meta.userId,
    tourneeId: meta.tourneeId,
  })

  log.info('✅ Don traité (charge.succeeded)', {
    charge_id: charge.id,
    amount,
    transaction_id: tx.id,
  })

  return {
    success: true,
    response: NextResponse.json({ received: true }),
    transactionId: tx.id,
  }
}
