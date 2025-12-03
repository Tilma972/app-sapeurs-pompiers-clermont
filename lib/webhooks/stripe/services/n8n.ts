/**
 * Service d'appel aux webhooks N8N
 * Centralise les appels pour génération de reçus fiscaux et factures
 */

import { sendToN8n } from '@/lib/n8n/send-receipt'
import { sendToN8nInvoice, getAssociationInfo } from '@/lib/n8n/send-invoice'
import { createAdminClient } from '@/lib/supabase/admin'
import { createLogger } from '@/lib/log'
import type { TransactionRecord, BoutiqueItem, MIN_RECEIPT_AMOUNT } from '../types'

const log = createLogger('webhook/stripe/n8n')

// ============================================================================
// TYPES
// ============================================================================

export interface N8nResult {
  success: boolean
  error?: string
}

// ============================================================================
// REÇU FISCAL
// ============================================================================

export interface FiscalReceiptParams {
  transaction: TransactionRecord
  calendarAccepted: boolean
  userId: string | null
  tourneeId: string | null
}

/**
 * Déclenche la génération d'un reçu fiscal via N8N
 * Condition: montant >= 6€ et email présent
 */
export async function triggerFiscalReceipt(params: FiscalReceiptParams): Promise<N8nResult> {
  const { transaction, calendarAccepted, userId, tourneeId } = params
  const minAmount: typeof MIN_RECEIPT_AMOUNT = 6

  // Vérifications préalables
  if (transaction.amount < minAmount) {
    log.info('Montant insuffisant pour reçu fiscal', {
      transaction_id: transaction.id,
      amount: transaction.amount,
      min: minAmount,
    })
    return { success: true } // Pas une erreur, juste pas de reçu
  }

  if (!transaction.supporter_email) {
    log.info('Pas d\'email pour reçu fiscal', { transaction_id: transaction.id })
    return { success: true } // Pas une erreur, juste pas de reçu
  }

  try {
    log.info('🚀 Appel N8N pour génération reçu fiscal...', {
      transaction_id: transaction.id,
      amount: transaction.amount,
      calendar_accepted: calendarAccepted,
    })

    await sendToN8n({
      transaction_id: transaction.id,
      amount: transaction.amount,
      calendar_accepted: calendarAccepted,
      donor_email: transaction.supporter_email,
      donor_name: transaction.supporter_name,
      payment_method: 'carte',
      user_id: userId,
      tournee_id: tourneeId,
      created_at: new Date().toISOString(),
    })

    log.info('✅ N8N reçu fiscal déclenché avec succès', {
      transaction_id: transaction.id,
    })

    return { success: true }
  } catch (err) {
    const error = err as Error
    log.error('❌ Échec appel N8N reçu fiscal', {
      transaction_id: transaction.id,
      error: error.message,
    })
    // On ne bloque pas le webhook - l'erreur est loggée
    return { success: false, error: error.message }
  }
}

// ============================================================================
// FACTURE BOUTIQUE
// ============================================================================

export interface InvoiceParams {
  transaction: TransactionRecord
  boutiqueItems: BoutiqueItem[]
  shippingAddress?: string | null
}

/**
 * Déclenche la génération d'une facture boutique via N8N
 */
export async function triggerInvoice(params: InvoiceParams): Promise<N8nResult> {
  const { transaction, boutiqueItems, shippingAddress } = params

  if (boutiqueItems.length === 0) {
    log.info('Pas d\'articles pour facture', { transaction_id: transaction.id })
    return { success: true }
  }

  if (!transaction.supporter_email) {
    log.info('Pas d\'email pour facture', { transaction_id: transaction.id })
    return { success: true }
  }

  const admin = createAdminClient()

  try {
    log.info('🧾 Génération facture boutique via N8N...', {
      transaction_id: transaction.id,
      amount: transaction.amount,
      items_count: boutiqueItems.length,
    })

    // Récupérer les détails produits pour la facture
    const productIds = boutiqueItems.map((item) => item.id)
    const { data: products } = await admin
      .from('products')
      .select('id, price, name')
      .in('id', productIds)

    const productsMap = new Map(products?.map((p) => [p.id, p]) || [])

    const invoiceItems = boutiqueItems.map((item) => {
      const product = productsMap.get(item.id)
      const unitPrice = item.price || product?.price || 0
      return {
        name: item.name || product?.name || 'Article',
        quantity: item.qty,
        unit_price: unitPrice,
        total_price: unitPrice * item.qty,
      }
    })

    // Générer le numéro de facture
    let invoiceNumber: string
    try {
      const { data: invoiceData } = await admin.rpc('generate_invoice_number').single()
      invoiceNumber =
        (invoiceData as { invoice_number?: string } | null)?.invoice_number ||
        `FAC-${Date.now()}`
    } catch {
      invoiceNumber = `FAC-${Date.now()}`
    }

    await sendToN8nInvoice({
      transaction_id: transaction.id,
      invoice_number: invoiceNumber,
      order_date: new Date().toISOString(),
      amount: transaction.amount,
      items: invoiceItems,
      customer: {
        name: transaction.supporter_name,
        email: transaction.supporter_email,
        address: shippingAddress || null,
      },
      association: getAssociationInfo(),
    })

    log.info('✅ N8N facture déclenché avec succès', {
      transaction_id: transaction.id,
      invoice_number: invoiceNumber,
    })

    return { success: true }
  } catch (err) {
    const error = err as Error
    log.error('❌ Échec génération facture boutique', {
      transaction_id: transaction.id,
      error: error.message,
    })
    // On ne bloque pas le webhook
    return { success: false, error: error.message }
  }
}
