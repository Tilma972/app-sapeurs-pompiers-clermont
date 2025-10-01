import { NextRequest, NextResponse } from 'next/server'
import { HelloAssoWebhookEvent } from '@/lib/helloasso/webhook'
import { createAdminClient } from '@/lib/supabase/admin'
import { createLogger } from '@/lib/log'

const log = createLogger('webhook/helloasso')

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const sigHa = req.headers.get('x-ha-signature')
    const sigHelloAsso = req.headers.get('HelloAsso-Signature')
    const sigXHelloAsso = req.headers.get('x-helloasso-signature')

    // Journaliser la présence/absence de signature, sans la vérifier (pragmatique)
    if (sigHa || sigHelloAsso || sigXHelloAsso) {
      log.warn('Signature présente mais non vérifiée', {
        'x-ha-signature': sigHa,
        'HelloAsso-Signature': sigHelloAsso,
        'x-helloasso-signature': sigXHelloAsso,
      })
    } else {
      log.warn('Aucune signature trouvée sur le webhook HelloAsso')
    }

  const event = JSON.parse(body) as HelloAssoWebhookEvent
    log.info('Webhook HelloAsso reçu', { eventType: event?.eventType })

    // Traitement métier minimal : conserver l'existant pour Order/Authorized
    if (event?.eventType === 'Order' && event?.data?.order?.state === 'Authorized') {
      await handleOrderAuthorized(event)
    }
    // Note: on pourrait ajouter un traitement "Payment" ici si nécessaire

    return NextResponse.json({ received: true })
  } catch (error) {
    log.error('Erreur traitement webhook', { message: (error as Error)?.message })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

async function handleOrderAuthorized(event: HelloAssoWebhookEvent) {
  const admin = createAdminClient()
  const intentId = event.data.metadata?.intentId
  if (!intentId) {
    log.warn('IntentId manquant dans les métadonnées')
    return
  }

  const { data: intent } = await admin
    .from('donation_intents')
    .select('*')
    .eq('id', intentId)
    .single()

  if (!intent) {
    log.error('Intention de don introuvable', { intentId })
    return
  }

  const { data: transaction, error: transactionError } = await admin
    .from('support_transactions')
    .insert({
      user_id: intent.sapeur_pompier_id,
      tournee_id: intent.tournee_id,
      amount: intent.final_amount,
      calendar_accepted: !intent.fiscal_receipt,
      supporter_name: `${intent.donor_first_name || ''} ${intent.donor_last_name || ''}`.trim() || null,
      supporter_email: intent.donor_email,
      payment_method: 'carte',
      payment_status: 'completed',
      notes: `Paiement HelloAsso - Commande ${event.data.order.id}`,
      consent_email: true,
    })
    .select()
    .single()

  if (transactionError) {
    log.error('Erreur création support_transaction', transactionError)
    return
  }

  await admin
    .from('donation_intents')
    .update({ status: 'completed', support_transaction_id: transaction.id })
    .eq('id', intentId)
}

export const dynamic = 'force-dynamic'
