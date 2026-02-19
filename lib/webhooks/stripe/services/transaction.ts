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
// RÉCUPÉRATION DES ARTICLES PANIER (pending_cart_sessions)
// ============================================================================

/**
 * Récupère les articles boutique depuis pending_cart_sessions (source de vérité).
 * Contourne la limite 500 chars/champ des metadata Stripe.
 * Retourne [] si introuvable (le handler doit gérer ce cas).
 */
export async function fetchPendingCartItems(stripeSessionId: string): Promise<BoutiqueItem[]> {
  const admin = createAdminClient()

  try {
    const { data, error } = await admin
      .from('pending_cart_sessions')
      .select('items')
      .eq('stripe_session_id', stripeSessionId)
      .maybeSingle()

    if (error || !data?.items) {
      log.warn('⚠️ pending_cart_sessions introuvable pour session', {
        stripe_session_id: stripeSessionId,
      })
      return []
    }

    const items = data.items as BoutiqueItem[]
    log.info('📦 Articles récupérés depuis pending_cart_sessions', {
      stripe_session_id: stripeSessionId,
      count: items.length,
    })
    return items
  } catch (err) {
    log.error('❌ Erreur fetchPendingCartItems', {
      stripe_session_id: stripeSessionId,
      error: (err as Error).message,
    })
    return []
  }
}

/**
 * Supprime la session temporaire après traitement réussi
 */
async function cleanupPendingCartSession(stripeSessionId: string): Promise<void> {
  const admin = createAdminClient()
  await admin
    .from('pending_cart_sessions')
    .delete()
    .eq('stripe_session_id', stripeSessionId)
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
 * Insère les articles d'une commande boutique et décrémente le stock.
 * Retourne true ssi l'insertion order_items réussit (stock best-effort).
 */
export async function insertOrderItems(
  transactionId: string,
  boutiqueItems: BoutiqueItem[],
  stripeSessionId?: string
): Promise<boolean> {
  if (boutiqueItems.length === 0) return true

  const admin = createAdminClient()

  try {
    // Récupérer les infos produits depuis la DB (stock inclus pour décrémentation)
    const productIds = boutiqueItems.map((item) => item.id)
    const { data: products } = await admin
      .from('products')
      .select('id, name, price, image_url, description, stock')
      .in('id', productIds)

    const productsMap = new Map(products?.map((p) => [p.id, p]) || [])

    // Préparer les items à insérer.
    // Priorité au prix issu de pending_cart_sessions (prix réel facturé par Stripe).
    const orderItemsToInsert: OrderItemInsert[] = boutiqueItems.map((item) => {
      const product = productsMap.get(item.id)
      return {
        transaction_id: transactionId,
        product_id: item.id,
        name: item.name || product?.name || 'Produit inconnu',
        description: product?.description || null,
        quantity: item.qty,
        unit_price: item.price ?? product?.price ?? 0,
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

    // -----------------------------------------------------------------------
    // DÉCRÉMENTATION DU STOCK
    // Chaque produit vendu voit son stock diminuer du nombre d'unités achetées.
    // Le statut (in_stock / low_stock / out_of_stock) est mis à jour en conséquence.
    // Les erreurs de stock ne bloquent pas : order_items est déjà persisté.
    // -----------------------------------------------------------------------
    const stockErrors: string[] = []
    for (const item of boutiqueItems) {
      const product = productsMap.get(item.id)
      if (!product) continue

      const newStock = Math.max(0, product.stock - item.qty)
      const newStatus =
        newStock === 0 ? 'out_of_stock' : newStock < 10 ? 'low_stock' : 'in_stock'

      const { error: stockError } = await admin
        .from('products')
        .update({ stock: newStock, status: newStatus })
        .eq('id', item.id)

      if (stockError) {
        stockErrors.push(`produit ${item.id}: ${stockError.message}`)
      }
    }

    if (stockErrors.length > 0) {
      log.error('⚠️ Erreurs partielles décrémentation stock (commande enregistrée)', {
        transaction_id: transactionId,
        errors: stockErrors,
      })
    } else {
      log.info('✅ Stock décrémenté', {
        transaction_id: transactionId,
        products_updated: boutiqueItems.length,
      })
    }

    // Créer l'entrée initiale dans order_status_history
    await admin.from('order_status_history').insert({
      transaction_id: transactionId,
      status: 'pending',
      notes: 'Commande créée via Stripe Checkout',
    })

    // Nettoyer la session temporaire après traitement réussi
    if (stripeSessionId) {
      await cleanupPendingCartSession(stripeSessionId)
    }

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
