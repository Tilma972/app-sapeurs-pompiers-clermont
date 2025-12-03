/**
 * Service de gestion des transactions
 * Centralise toutes les opérations CRUD sur support_transactions et order_items
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { createLogger } from '@/lib/log'
import type {
  TransactionInsertData,
  TransactionRecord,
  OrderItemInsert,
  BoutiqueItem,
} from '../types'

const log = createLogger('webhook/stripe/transaction')

// ============================================================================
// VÉRIFICATION D'IDEMPOTENCE
// ============================================================================

/**
 * Vérifie si une transaction existe déjà avec ce stripe_session_id
 */
export async function transactionExists(stripeSessionId: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data: existing } = await admin
    .from('support_transactions')
    .select('id')
    .eq('stripe_session_id', stripeSessionId)
    .maybeSingle()

  return !!existing
}

// ============================================================================
// CRÉATION DE TRANSACTION
// ============================================================================

export interface CreateTransactionResult {
  success: boolean
  transaction?: TransactionRecord
  error?: string
}

/**
 * Crée une nouvelle transaction dans la base de données
 */
export async function createTransaction(
  data: TransactionInsertData
): Promise<CreateTransactionResult> {
  const admin = createAdminClient()

  try {
    const { data: tx, error: insertError } = await admin
      .from('support_transactions')
      .insert(data)
      .select('id, amount, supporter_name, supporter_email')
      .single()

    if (insertError) {
      log.error('❌ Échec insertion support_transactions', {
        stripe_session_id: data.stripe_session_id,
        error: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
      })
      return { success: false, error: insertError.message }
    }

    if (!tx) {
      log.error('❌ Transaction non créée', { stripe_session_id: data.stripe_session_id })
      return { success: false, error: 'Transaction not created' }
    }

    log.info('✅ Transaction créée', {
      transaction_id: tx.id,
      stripe_session_id: data.stripe_session_id,
      amount: data.amount,
      source: data.source,
    })

    return { success: true, transaction: tx }
  } catch (err) {
    const error = err as Error
    log.error('❌ Exception création transaction', {
      stripe_session_id: data.stripe_session_id,
      error: error.message,
    })
    return { success: false, error: error.message }
  }
}

// ============================================================================
// GESTION DES ARTICLES BOUTIQUE
// ============================================================================

/**
 * Insère les articles d'une commande boutique
 */
export async function insertOrderItems(
  transactionId: string,
  boutiqueItems: BoutiqueItem[]
): Promise<boolean> {
  if (boutiqueItems.length === 0) return true

  const admin = createAdminClient()

  try {
    // Récupérer les infos produits depuis la DB
    const productIds = boutiqueItems.map((item) => item.id)
    const { data: products } = await admin
      .from('products')
      .select('id, name, price, image_url, description')
      .in('id', productIds)

    const productsMap = new Map(products?.map((p) => [p.id, p]) || [])

    // Préparer les items à insérer
    const orderItemsToInsert: OrderItemInsert[] = boutiqueItems.map((item) => {
      const product = productsMap.get(item.id)
      return {
        transaction_id: transactionId,
        product_id: item.id,
        name: item.name || product?.name || 'Produit inconnu',
        description: product?.description || null,
        quantity: item.qty,
        unit_price: item.price || product?.price || 0,
        image_url: product?.image_url || null,
      }
    })

    const { error: itemsError } = await admin.from('order_items').insert(orderItemsToInsert)

    if (itemsError) {
      log.error('❌ Échec insertion order_items', {
        transaction_id: transactionId,
        error: itemsError.message,
        items_count: orderItemsToInsert.length,
      })
      return false
    }

    log.info('✅ Articles boutique enregistrés', {
      transaction_id: transactionId,
      items_count: orderItemsToInsert.length,
    })

    // Créer l'entrée initiale dans order_status_history
    await admin.from('order_status_history').insert({
      transaction_id: transactionId,
      status: 'pending',
      notes: 'Commande créée via Stripe Checkout',
    })

    return true
  } catch (err) {
    log.error('❌ Exception insertion articles boutique', {
      transaction_id: transactionId,
      error: (err as Error).message,
    })
    return false
  }
}

// ============================================================================
// MISE À JOUR DE TRANSACTION
// ============================================================================

/**
 * Met à jour les champs de facture d'une transaction
 */
export async function updateInvoiceFields(
  transactionId: string,
  invoiceNumber: string,
  invoiceUrl?: string
): Promise<boolean> {
  const admin = createAdminClient()

  try {
    const { error } = await admin
      .from('support_transactions')
      .update({
        invoice_number: invoiceNumber,
        invoice_url: invoiceUrl || null,
        invoice_generated_at: new Date().toISOString(),
      })
      .eq('id', transactionId)

    if (error) {
      log.error('❌ Échec mise à jour facture', {
        transaction_id: transactionId,
        error: error.message,
      })
      return false
    }

    return true
  } catch (err) {
    log.error('❌ Exception mise à jour facture', {
      transaction_id: transactionId,
      error: (err as Error).message,
    })
    return false
  }
}

/**
 * Génère un numéro de facture via la fonction PostgreSQL
 */
export async function generateInvoiceNumber(): Promise<string> {
  const admin = createAdminClient()

  try {
    const { data: invoiceData } = await admin.rpc('generate_invoice_number').single()
    const invoiceNumber =
      (invoiceData as { invoice_number?: string } | null)?.invoice_number ||
      `FAC-${Date.now()}`
    return invoiceNumber
  } catch {
    // Fallback si la fonction n'existe pas encore
    return `FAC-${Date.now()}`
  }
}
