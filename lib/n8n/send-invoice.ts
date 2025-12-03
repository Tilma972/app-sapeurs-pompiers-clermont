import { createAdminClient } from '@/lib/supabase/admin'
import { createLogger } from '@/lib/log'

const log = createLogger('n8n/send-invoice')

export interface InvoiceItem {
  name: string
  quantity: number
  unit_price: number
  total_price?: number
  image_url?: string
}

export interface N8nInvoicePayload {
  transaction_id: string
  invoice_number: string
  order_date: string
  amount: number
  items: InvoiceItem[]
  customer: {
    name: string | null
    email: string
    address?: string | null
  }
  // Infos association (émetteur)
  association: {
    name: string
    address: string
    siret?: string
    email: string
  }
}

/**
 * Envoie un appel au webhook n8n pour générer une facture PDF boutique
 * Workflow séparé des reçus fiscaux
 */
export async function sendToN8nInvoice(data: N8nInvoicePayload): Promise<void> {
  const admin = createAdminClient()
  
  // URL du webhook facture (différent des reçus fiscaux)
  let webhookUrl = process.env.N8N_INVOICE_WEBHOOK_URL

  // Fallback sur la DB si pas de variable d'environnement
  if (!webhookUrl) {
    try {
      const { data: setting } = await admin
        .from('n8n_settings')
        .select('value')
        .eq('key', 'invoice_webhook_url')
        .maybeSingle()

      webhookUrl = setting?.value
    } catch (err) {
      log.warn('Erreur récupération invoice_webhook_url', { error: (err as Error).message })
    }
  }

  // URL par défaut (à configurer dans n8n)
  if (!webhookUrl) {
    webhookUrl = 'https://n8n.dsolution-ia.fr/webhook/invoice-pdf'
    log.info("Utilisation de l'URL facture n8n par défaut", { url: webhookUrl })
  }

  // Construction du payload
  const payload = {
    event: 'invoice.generate',
    transaction_id: data.transaction_id,
    invoice_number: data.invoice_number,
    order_date: data.order_date,
    amount_total: data.amount,
    
    // Détail des articles
    items: data.items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price || (item.unit_price * item.quantity),
      image_url: item.image_url
    })),
    
    // Client (destinataire facture)
    customer: {
      name: data.customer.name || 'Client',
      email: data.customer.email,
      address: data.customer.address || null
    },
    
    // Association (émetteur facture)
    association: {
      name: data.association.name,
      address: data.association.address,
      siret: data.association.siret,
      email: data.association.email
    },
    
    // Pas de TVA (association 1901)
    tax_rate: 0,
    tax_amount: 0,
    is_tax_exempt: true,
    tax_exempt_reason: 'Association loi 1901 - Exonérée de TVA',
    
    // Métadonnées
    generated_at: new Date().toISOString(),
    source: 'boutique_webhook'
  }

  log.info('📤 Envoi facture vers n8n', {
    transaction_id: data.transaction_id,
    invoice_number: data.invoice_number,
    amount: data.amount,
    items_count: data.items.length,
    webhook_url: webhookUrl
  })

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s pour PDF

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`n8n HTTP ${response.status}: ${errorText}`)
      }

      log.info('✅ n8n a accepté la requête facture', {
        transaction_id: data.transaction_id,
        invoice_number: data.invoice_number,
        status: response.status
      })

      // Trace succès
      await admin.from('webhook_logs').insert({
        source: 'boutique_invoice_to_n8n',
        event_type: 'invoice.generate',
        payload: payload as unknown as Record<string, unknown>,
        status: 'sent'
      })

    } finally {
      clearTimeout(timeoutId)
    }

  } catch (err) {
    const error = err as Error
    const isTimeout = error.name === 'AbortError'

    log.error(isTimeout ? '⏳ Timeout appel n8n facture' : '❌ Échec appel n8n facture', {
      transaction_id: data.transaction_id,
      invoice_number: data.invoice_number,
      error: error.message,
      webhook_url: webhookUrl
    })

    // Trace erreur
    await admin.from('webhook_logs').insert({
      source: 'boutique_invoice_to_n8n',
      event_type: 'invoice.generate',
      payload: payload as unknown as Record<string, unknown>,
      status: 'error',
      error_message: error.message
    })

    // Re-throw pour retry éventuel
    throw error
  }
}

/**
 * Infos de l'association pour les factures
 * À personnaliser selon vos données
 */
export function getAssociationInfo() {
  return {
    name: "Amicale des Sapeurs-Pompiers de Clermont l'Hérault",
    address: "Centre de Secours, Avenue Georges Clemenceau, 34800 Clermont l'Hérault",
    siret: process.env.ASSOCIATION_SIRET || undefined,
    email: process.env.ASSOCIATION_EMAIL || "contact@pompiers34800.com"
  }
}

/**
 * Renvoie une facture existante pour une transaction boutique
 * Utilisé depuis l'admin quand un client dit ne pas avoir reçu sa facture
 */
export async function resendInvoice(transactionId: string): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient()
  
  try {
    // Récupérer la transaction avec ses order_items
    const { data: tx, error: txError } = await admin
      .from('support_transactions')
      .select(`
        id,
        amount,
        supporter_name,
        supporter_email,
        invoice_number,
        created_at,
        source
      `)
      .eq('id', transactionId)
      .single()

    if (txError || !tx) {
      return { success: false, error: 'Transaction non trouvée' }
    }

    if (tx.source !== 'boutique') {
      return { success: false, error: 'Cette transaction n\'est pas une commande boutique' }
    }

    if (!tx.supporter_email) {
      return { success: false, error: 'Pas d\'email associé à cette transaction' }
    }

    // Récupérer les articles de la commande
    const { data: orderItems, error: itemsError } = await admin
      .from('order_items')
      .select(`
        quantity,
        unit_price,
        total_price,
        products (
          id,
          name,
          image_url
        )
      `)
      .eq('transaction_id', transactionId)

    if (itemsError) {
      log.error('Erreur récupération order_items', { error: itemsError.message })
      return { success: false, error: 'Erreur récupération articles' }
    }

    // Construire les items pour la facture
    const invoiceItems: InvoiceItem[] = (orderItems || []).map(item => ({
      name: (item.products as { name?: string } | null)?.name || 'Article',
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      image_url: (item.products as { image_url?: string } | null)?.image_url || undefined
    }))

    // Générer un nouveau numéro de facture si nécessaire
    let invoiceNumber = tx.invoice_number
    if (!invoiceNumber) {
      const { data: invoiceData } = await admin.rpc('generate_invoice_number').single()
      invoiceNumber = (invoiceData as { invoice_number?: string } | null)?.invoice_number || `FAC-${Date.now()}`
      
      // Sauvegarder le numéro
      await admin
        .from('support_transactions')
        .update({ invoice_number: invoiceNumber })
        .eq('id', transactionId)
    }

    // Envoyer à N8N
    await sendToN8nInvoice({
      transaction_id: tx.id,
      invoice_number: invoiceNumber,
      order_date: tx.created_at || new Date().toISOString(),
      amount: tx.amount,
      items: invoiceItems,
      customer: {
        name: tx.supporter_name,
        email: tx.supporter_email,
        address: null // TODO: récupérer depuis shipping_address
      },
      association: getAssociationInfo()
    })

    log.info('✅ Facture renvoyée avec succès', {
      transaction_id: transactionId,
      invoice_number: invoiceNumber,
      email: tx.supporter_email
    })

    return { success: true }

  } catch (err) {
    const error = err as Error
    log.error('❌ Échec renvoi facture', {
      transaction_id: transactionId,
      error: error.message
    })
    return { success: false, error: error.message }
  }
}
