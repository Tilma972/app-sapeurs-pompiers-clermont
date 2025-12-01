import { createAdminClient } from '@/lib/supabase/admin'
import { createLogger } from '@/lib/log'

const log = createLogger('n8n/send-receipt')

export interface N8nReceiptPayload {
  transaction_id: string
  amount: number
  calendar_accepted: boolean
  donor_email: string
  donor_name: string | null
  receipt_number?: string | null
  created_at?: string
  donor_first_name?: string | null
  donor_last_name?: string | null
  donor_address?: string | null
  donor_zip?: string | null
  donor_city?: string | null
  payment_method?: string
  user_id?: string | null
  tournee_id?: string | null
  source?: string // Ajouté pour gérer 'stripe' ou 'manual'
}

/**
 * Envoie un appel direct au webhook n8n pour générer un reçu fiscal PDF
 */
export async function sendToN8n(data: N8nReceiptPayload): Promise<void> {
  const admin = createAdminClient()
  let webhookUrl = process.env.N8N_WEBHOOK_URL

  // 1. Récupération URL (Env -> DB -> Default)
  if (!webhookUrl) {
    try {
      const { data: setting, error } = await admin
        .from('n8n_settings') // Vérifiez que c'est bien le nom de votre table
        .select('value')
        .eq('key', 'webhook_url')
        .maybeSingle()

      if (error) {
        log.warn('Impossible de récupérer n8n_webhook_url depuis la DB', { error: error.message })
      }
      webhookUrl = setting?.value
    } catch (err) {
      log.warn('Erreur récupération n8n_webhook_url', { error: (err as Error).message })
    }
  }

  if (!webhookUrl) {
    webhookUrl = 'https://n8n.dsolution-ia.fr/webhook/receipt-pdf'
    log.info("Utilisation de l'URL n8n par défaut", { url: webhookUrl })
  }

  // 2. Calculs fiscaux
  const calendarValue = 1.33
  const deductibleAmount = data.calendar_accepted
    ? Math.round((data.amount - calendarValue) * 100) / 100
    : data.amount

  const taxReduction = Math.round(deductibleAmount * 0.66 * 100) / 100

  // 3. Construction payload
  const payload = {
    event: 'receipt.generate',
    transaction_id: data.transaction_id,
    receipt_number: data.receipt_number,
    amount: data.amount,
    payment_method: data.payment_method || 'carte',
    calendar_accepted: data.calendar_accepted,
    calendar_value: calendarValue,
    created_at: data.created_at || new Date().toISOString(),
    donor: {
      email: data.donor_email,
      name: data.donor_name,
      first_name: data.donor_first_name,
      last_name: data.donor_last_name,
      address: data.donor_address,
      zip: data.donor_zip,
      city: data.donor_city
    },
    user_id: data.user_id,
    tournee_id: data.tournee_id,
    deductible_amount: deductibleAmount,
    tax_reduction: taxReduction,
    // Utilise la source passée ou par défaut 'stripe_webhook_direct'
    source: data.source || 'stripe_webhook_direct' 
  }

  log.info('📤 Envoi vers n8n', {
    transaction_id: data.transaction_id,
    amount: data.amount,
    source: payload.source,
    webhook_url: webhookUrl
  })

  try {
    // 4. Appel HTTP avec Timeout sécurisé
    // Utilisation d'AbotController pour compatibilité Node.js < 18 si besoin
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s

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

      // On peut ignorer le json result si on n'en fait rien, pour éviter erreur de parsing si vide
      // const result = await response.json().catch(() => ({})) 
      
      log.info('✅ n8n a accepté la requête', {
        transaction_id: data.transaction_id,
        status: response.status
      })

      // Trace succès
      await admin.from('webhook_logs').insert({
        source: 'stripe_webhook_to_n8n',
        event_type: 'receipt.generate',
        payload: payload as unknown as Record<string, unknown>,
        status: 'sent'
      })

    } finally {
      clearTimeout(timeoutId) // Nettoyage timeout
    }

  } catch (err) {
    const error = err as Error
    const isTimeout = error.name === 'AbortError'

    log.error(isTimeout ? '⏳ Timeout appel n8n' : '❌ Échec appel n8n', {
      transaction_id: data.transaction_id,
      error: error.message,
      webhook_url: webhookUrl
    })

    // Trace erreur
    await admin.from('webhook_logs').insert({
      source: 'stripe_webhook_to_n8n',
      event_type: 'receipt.generate',
      payload: payload as unknown as Record<string, unknown>,
      status: 'error',
      error_message: error.message
    })

    // Re-throw pour Stripe Retry
    throw error
  }
}
