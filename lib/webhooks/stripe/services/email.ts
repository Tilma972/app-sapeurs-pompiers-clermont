/**
 * Service d'envoi d'emails pour les webhooks
 * Centralise la logique d'envoi d'emails de confirmation
 */

import { sendEmail } from '@/lib/email/resend-client'
import { buildHtml, buildText } from '@/lib/email/receipt-templates'
import {
  buildBoutiqueSubject,
  buildBoutiqueHtml,
  buildBoutiqueText,
} from '@/lib/email/boutique-templates'
import { createAdminClient } from '@/lib/supabase/admin'
import { createLogger } from '@/lib/log'
import type { TransactionRecord, BoutiqueItem } from '../types'

const log = createLogger('webhook/stripe/email')

// ============================================================================
// TYPES
// ============================================================================

export interface EmailResult {
  success: boolean
  error?: string
}

interface BoutiqueEmailItem {
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
  imageUrl?: string
}

// ============================================================================
// EMAIL DE CONFIRMATION BOUTIQUE
// ============================================================================

/**
 * Envoie un email de confirmation style Shopify pour une commande boutique
 */
export async function sendBoutiqueConfirmationEmail(
  transaction: TransactionRecord,
  boutiqueItems: BoutiqueItem[],
  amount: number
): Promise<EmailResult> {
  if (!transaction.supporter_email) {
    return { success: false, error: 'No email address' }
  }

  try {
    const admin = createAdminClient()

    // Récupérer les prix depuis la DB pour les items
    const productIds = boutiqueItems.map((item) => item.id)
    const { data: products } = await admin
      .from('products')
      .select('id, price, image_url')
      .in('id', productIds)

    const productsMap = new Map(products?.map((p) => [p.id, p]) || [])

    const emailItems: BoutiqueEmailItem[] = boutiqueItems.map((item) => {
      const product = productsMap.get(item.id)
      const unitPrice = item.price || product?.price || 0
      return {
        name: item.name,
        quantity: item.qty,
        unitPrice,
        totalPrice: unitPrice * item.qty,
        imageUrl: product?.image_url || undefined,
      }
    })

    const emailParams = {
      customerName: transaction.supporter_name,
      customerEmail: transaction.supporter_email,
      orderNumber: transaction.id,
      items: emailItems,
      subtotal: amount,
      total: amount,
      orderDate: new Date(),
    }

    const subject = buildBoutiqueSubject(emailParams)
    const html = buildBoutiqueHtml(emailParams)
    const text = buildBoutiqueText(emailParams)

    await sendEmail({
      to: transaction.supporter_email,
      subject,
      html,
      text,
    })

    log.info('✅ Email boutique envoyé', {
      transaction_id: transaction.id,
      email: transaction.supporter_email,
      items_count: emailItems.length,
    })

    return { success: true }
  } catch (err) {
    const error = err as Error
    log.error('❌ Échec envoi email boutique', {
      transaction_id: transaction.id,
      error: error.message,
    })
    return { success: false, error: error.message }
  }
}

// ============================================================================
// EMAIL DE CONFIRMATION DON
// ============================================================================

/**
 * Envoie un email de confirmation pour un don (landing page ou terrain)
 */
export async function sendDonationConfirmationEmail(
  transaction: TransactionRecord,
  calendarAccepted: boolean
): Promise<EmailResult> {
  if (!transaction.supporter_email) {
    return { success: false, error: 'No email address' }
  }

  try {
    const emailType = calendarAccepted ? 'soutien' : 'fiscal'
    const subject = calendarAccepted
      ? `Merci pour votre soutien de ${transaction.amount.toFixed(2)}€`
      : `Merci pour votre don de ${transaction.amount.toFixed(2)}€`

    const html = buildHtml({
      supporterName: transaction.supporter_name,
      amount: transaction.amount,
      receiptNumber: null,
      transactionType: emailType,
    })

    const text = buildText({
      supporterName: transaction.supporter_name,
      amount: transaction.amount,
      receiptNumber: null,
      transactionType: emailType,
    })

    await sendEmail({
      to: transaction.supporter_email,
      subject,
      html,
      text,
    })

    log.info('✅ Email de confirmation envoyé', {
      transaction_id: transaction.id,
      email: transaction.supporter_email,
      type: emailType,
    })

    return { success: true }
  } catch (err) {
    const error = err as Error
    log.error('❌ Échec envoi email de confirmation', {
      transaction_id: transaction.id,
      error: error.message,
    })
    return { success: false, error: error.message }
  }
}

// ============================================================================
// EMAIL DE CONFIRMATION GÉNÉRIQUE (pour PI et Charge)
// ============================================================================

/**
 * Envoie un email de confirmation générique (utilisé pour payment_intent et charge)
 */
export async function sendGenericConfirmationEmail(
  email: string,
  name: string | null,
  amount: number,
  calendarAccepted: boolean,
  transactionId: string
): Promise<EmailResult> {
  try {
    const subject = calendarAccepted
      ? `Confirmation de votre soutien de ${amount.toFixed(2)}€`
      : `Confirmation de votre don de ${amount.toFixed(2)}€`

    const html = buildHtml({
      supporterName: name,
      amount,
      receiptNumber: null,
      transactionType: calendarAccepted ? 'soutien' : 'fiscal',
    })

    const text = buildText({
      supporterName: name,
      amount,
      receiptNumber: null,
      transactionType: calendarAccepted ? 'soutien' : 'fiscal',
    })

    await sendEmail({
      to: email,
      subject,
      html,
      text,
    })

    log.info('✅ Email de confirmation envoyé', {
      transaction_id: transactionId,
      email,
    })

    return { success: true }
  } catch (err) {
    const error = err as Error
    log.error('❌ Échec envoi email de confirmation', {
      transaction_id: transactionId,
      error: error.message,
    })
    return { success: false, error: error.message }
  }
}
