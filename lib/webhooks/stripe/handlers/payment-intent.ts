/**
 * Handler pour l'événement payment_intent.succeeded
 * Gère les paiements terrain via PaymentIntent (QR code)
 */

import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/client'
import { createLogger } from '@/lib/log'
import type { StripePaymentIntent, HandlerResult } from '../types'
import { parseCalendarAccepted } from '../validators'
import { transactionExists, createTransaction } from '../services/transaction'
import { sendGenericConfirmationEmail } from '../services/email'
import { triggerFiscalReceipt } from '../services/n8n'

const log = createLogger('webhook/stripe/payment-intent')

// ============================================================================
// EXTRACTION DES BILLING DETAILS
// ============================================================================

interface BillingDetails {
  name: string | undefined
  email: string | undefined
}

/**
 * Extrait les informations de facturation depuis le PaymentIntent
 * Tente plusieurs sources: charges, payment_method, latest_charge
 */
async function extractBillingDetails(
  paymentIntent: StripePaymentIntent
): Promise<BillingDetails> {
  let billingName: string | undefined
  let billingEmail: string | undefined

  // 1. Essayer depuis charges.data
  const charge = paymentIntent.charges?.data?.[0]
  const chargeDetails = charge?.billing_details
  if (chargeDetails) {
    billingName = chargeDetails.name ?? undefined
    billingEmail = chargeDetails.email ?? undefined
  }

  // 2. Si pas trouvé, essayer depuis payment_method
  if (!billingName && !billingEmail && paymentIntent.payment_method) {
    try {
      const stripe = getStripe()
      const pm = await stripe.paymentMethods.retrieve(paymentIntent.payment_method)
      const details = (pm as { billing_details?: { name?: string | null; email?: string | null } })
        ?.billing_details
      billingName = details?.name ?? undefined
      billingEmail = details?.email ?? undefined
    } catch (err) {
      log.warn('Impossible de récupérer billing_details via PaymentMethod', {
        message: (err as Error)?.message,
      })
    }
  }

  // 3. Si toujours pas trouvé, essayer depuis latest_charge
  if (!billingName && !billingEmail && paymentIntent.latest_charge) {
    try {
      const stripe = getStripe()
      const ch = await stripe.charges.retrieve(paymentIntent.latest_charge)
      const bd = (ch as { billing_details?: { name?: string | null; email?: string | null } })
        .billing_details
      billingName = bd?.name ?? undefined
      billingEmail = bd?.email ?? undefined
    } catch (err) {
      log.warn('Impossible de récupérer latest_charge', {
        message: (err as Error)?.message,
      })
    }
  }

  return { name: billingName, email: billingEmail }
}

/**
 * Traite un événement payment_intent.succeeded
 */
export async function handlePaymentIntent(
  paymentIntent: StripePaymentIntent
): Promise<HandlerResult> {
  const meta = (paymentIntent.metadata || {}) as {
    tournee_id?: string
    calendar_given?: string
    user_id?: string
    donor_name?: string
    donor_email?: string
  }

  const amount = paymentIntent.amount / 100
  const calendarAccepted = parseCalendarAccepted(meta.calendar_given)
  const userId = meta.user_id ?? null
  const tourneeId = meta.tournee_id ?? null

  log.info('📥 Traitement payment_intent.succeeded', {
    payment_intent_id: paymentIntent.id,
    amount,
    has_tournee: !!tourneeId,
    has_user: !!userId,
  })

  // ========================================================================
  // IDEMPOTENCE : Vérifier si déjà traité
  // ========================================================================
  const exists = await transactionExists(paymentIntent.id)
  if (exists) {
    log.info('Transaction déjà traitée (idempotence)', {
      payment_intent_id: paymentIntent.id,
    })
    return {
      success: true,
      response: NextResponse.json({ received: true }),
    }
  }

  // ========================================================================
  // EXTRACTION DES INFORMATIONS CLIENT
  // ========================================================================
  const billing = await extractBillingDetails(paymentIntent)
  const effectiveName = meta.donor_name ?? billing.name ?? null
  const effectiveEmail = meta.donor_email ?? billing.email ?? null

  // ========================================================================
  // CRÉATION DE LA TRANSACTION
  // ========================================================================
  const result = await createTransaction({
    user_id: userId,
    tournee_id: tourneeId,
    amount,
    calendar_accepted: calendarAccepted,
    payment_method: 'carte',
    payment_status: 'completed',
    stripe_session_id: paymentIntent.id,
    supporter_email: effectiveEmail,
    supporter_name: effectiveName,
    notes: `Stripe PI - ${paymentIntent.id}`,
    source: 'terrain',
  })

  if (!result.success || !result.transaction) {
    log.error('❌ Échec création transaction (PI)', {
      payment_intent_id: paymentIntent.id,
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
  if (effectiveEmail) {
    await sendGenericConfirmationEmail(
      effectiveEmail,
      effectiveName,
      amount,
      calendarAccepted,
      tx.id
    )
  }

  // ========================================================================
  // N8N : Reçu fiscal
  // ========================================================================
  await triggerFiscalReceipt({
    transaction: tx,
    calendarAccepted,
    userId,
    tourneeId,
  })

  log.info('✅ Don Stripe (PI) traité', {
    payment_intent_id: paymentIntent.id,
    amount,
    transaction_id: tx.id,
  })

  return {
    success: true,
    response: NextResponse.json({ received: true }),
    transactionId: tx.id,
  }
}
