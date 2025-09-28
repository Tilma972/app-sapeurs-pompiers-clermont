import { NextRequest, NextResponse } from 'next/server'
import { verifyHelloAssoSignature, HelloAssoWebhookEvent } from '@/lib/helloasso/webhook'
import { createAdminClient } from '@/lib/supabase/admin'
import { createLogger } from '@/lib/log'

const log = createLogger('webhook/helloasso')

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('HelloAsso-Signature')
    const body = await req.text()

    if (!verifyHelloAssoSignature(body, signature)) {
      return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
    }

    const event: HelloAssoWebhookEvent = JSON.parse(body)
    log.info('Webhook HelloAsso reçu', { eventType: event.eventType })

    if (event.eventType === 'Order' && event.data.order.state === 'Authorized') {
      await handleOrderAuthorized(event)
    }

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
