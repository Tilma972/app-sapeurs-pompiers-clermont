/**
 * Handler pour l'événement checkout.session.completed
 * Gère les paiements via Stripe Checkout (boutique, landing page, dons)
 */

import { NextResponse } from 'next/server'
import { createLogger } from '@/lib/log'
import type { StripeCheckoutSession, HandlerResult, SOURCES } from '../types'
import {
  parseBoutiqueItems,
  parseCalendarAccepted,
  normalizeSource,
  generateNotes,
} from '../validators'
import {
  transactionExists,
  createTransaction,
  insertOrderItems,
} from '../services/transaction'
import {
  sendBoutiqueConfirmationEmail,
  sendDonationConfirmationEmail,
} from '../services/email'
import { triggerFiscalReceipt, triggerInvoice } from '../services/n8n'

const log = createLogger('webhook/stripe/checkout-session')

/**
 * Traite un événement checkout.session.completed
 */
export async function handleCheckoutSession(
  session: StripeCheckoutSession
): Promise<HandlerResult> {
  const amount = (session.amount_total ?? 0) / 100
  const donorEmail = session.customer_details?.email ?? null
  const donorName =
    session.customer_details?.name ?? session.metadata?.customer_name ?? null

  // Parser les données des métadonnées
  const boutiqueItems = parseBoutiqueItems(session.metadata?.items)
  const calendarAccepted = parseCalendarAccepted(session.metadata?.calendar_given)
  const userId = session.metadata?.user_id ?? null
  const tourneeId = session.metadata?.tournee_id ?? null
  const source = normalizeSource(session.metadata?.source)

  log.info('📥 Traitement checkout.session.completed', {
    session_id: session.id,
    amount,
    source,
    items_count: boutiqueItems.length,
    has_email: !!donorEmail,
  })

  // ========================================================================
  // IDEMPOTENCE : Vérifier si déjà traité
  // ========================================================================
  const exists = await transactionExists(session.id)
  if (exists) {
    log.info('Transaction déjà traitée (idempotence)', { session_id: session.id })
    return {
      success: true,
      response: NextResponse.json({ received: true }),
    }
  }

  // ========================================================================
  // CRÉATION DE LA TRANSACTION
  // ========================================================================
  const isBoutique = source === ('boutique' as typeof SOURCES.BOUTIQUE)
  const notes = generateNotes(source, session.id)

  const result = await createTransaction({
    user_id: userId,
    tournee_id: tourneeId,
    amount,
    calendar_accepted: calendarAccepted,
    payment_method: 'carte',
    payment_status: 'completed',
    stripe_session_id: session.id,
    supporter_email: donorEmail,
    supporter_name: donorName,
    notes,
    source,
    order_status: isBoutique ? 'pending' : undefined,
  })

  if (!result.success || !result.transaction) {
    log.error('❌ Échec création transaction', {
      session_id: session.id,
      error: result.error,
    })
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Transaction creation failed', details: result.error },
        { status: 500 }
      ),
      error: result.error,
    }
  }

  const tx = result.transaction

  // ========================================================================
  // BOUTIQUE : Insertion des articles
  // ========================================================================
  if (isBoutique && boutiqueItems.length > 0) {
    await insertOrderItems(tx.id, boutiqueItems)
  }

  // ========================================================================
  // EMAIL DE CONFIRMATION
  // ========================================================================
  if (donorEmail) {
    if (isBoutique && boutiqueItems.length > 0) {
      await sendBoutiqueConfirmationEmail(tx, boutiqueItems, amount)
    } else {
      await sendDonationConfirmationEmail(tx, calendarAccepted)
    }
  }

  // ========================================================================
  // N8N : Reçu fiscal OU Facture
  // ========================================================================
  if (isBoutique) {
    // Facture pour les achats boutique
    const shippingAddress = session.metadata?.shipping_address ?? null
    await triggerInvoice({
      transaction: tx,
      boutiqueItems,
      shippingAddress,
    })
  } else {
    // Reçu fiscal pour les dons
    await triggerFiscalReceipt({
      transaction: tx,
      calendarAccepted,
      userId,
      tourneeId,
    })
  }

  // ========================================================================
  // LOG FINAL
  // ========================================================================
  if (source === 'landing_page_donation') {
    log.info('✅ Don landing page traité', {
      session_id: session.id,
      amount,
      email: donorEmail,
    })
  } else if (isBoutique) {
    log.info('✅ Commande boutique traitée avec facture', {
      session_id: session.id,
      amount,
      email: donorEmail,
      items_count: boutiqueItems.length,
    })
  } else {
    log.info('✅ Don terrain traité', {
      session_id: session.id,
      amount,
      email: donorEmail,
    })
  }

  return {
    success: true,
    response: NextResponse.json({ received: true }),
    transactionId: tx.id,
  }
}
