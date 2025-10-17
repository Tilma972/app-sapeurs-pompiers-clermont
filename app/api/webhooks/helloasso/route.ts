// app/api/webhooks/helloasso/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { HelloAssoWebhookEvent } from '@/lib/helloasso/webhook'
import { createLogger } from '@/lib/log'

const log = createLogger('webhook/helloasso')

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  const admin = createAdminClient()
  
  let webhookLogId: string | null = null

  try {
    const body = await req.text()
    const headers: Record<string, string> = {}
    req.headers.forEach((value, key) => {
      headers[key] = value
    })

  const event = JSON.parse(body) as HelloAssoWebhookEvent
    
    log.info('Webhook HelloAsso reçu', { eventType: event?.eventType })

    // Logger le webhook
    const { data: webhookLog } = await admin
      .from('webhook_logs')
      .insert({
        source: 'helloasso',
        payload: event,
        headers: headers,
        status: 'received',
        event_type: event?.eventType || 'unknown',
      })
      .select('id')
      .single()

    webhookLogId = webhookLog?.id || null

    // ✅ CORRECTION : Traiter Order avec paiements Authorized
    if (event?.eventType === 'Order' || event?.eventType === 'Payment') {
      const authorized = event.data?.payments?.some((p) => p?.state === 'Authorized')
      if (authorized) {
        await handleOrderAuthorized(event)
      } else {
        log.info(`${event.eventType} reçu sans paiement Authorized`)
      }
    }

    // Marquer comme traité
    if (webhookLogId) {
      await admin
        .from('webhook_logs')
        .update({ 
          status: 'processed',
          processing_duration_ms: Date.now() - startTime,
        })
        .eq('id', webhookLogId)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    const errorMessage = (error as Error)?.message || 'Unknown error'
    log.error('Erreur traitement webhook', { message: errorMessage })

    if (webhookLogId) {
      await admin
        .from('webhook_logs')
        .update({ 
          status: 'error',
          error_message: errorMessage,
          processing_duration_ms: Date.now() - startTime,
        })
        .eq('id', webhookLogId)
    }

    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

async function handleOrderAuthorized(event: HelloAssoWebhookEvent) {
  const admin = createAdminClient()
  
  // ✅ CORRECTION : metadata au niveau racine
  const intentId = event.metadata?.intentId
  
  if (!intentId) {
    log.warn('IntentId manquant dans metadata')
    return
  }

  const payment = event.data?.payments?.[0]
  log.info('Traitement Order/Payment', { 
    intentId,
    orderId: event.data?.id,
    paymentId: payment?.id,
    paymentState: payment?.state,
  })

  const { data: intent } = await admin
    .from('donation_intents')
    .select('*')
    .eq('id', intentId)
    .single()

  if (!intent) {
    log.error('Intent introuvable', { intentId })
    return
  }

  // Protection doublon
  if (intent.status === 'completed') {
    log.warn('Intent déjà complétée', { intentId })
    return
  }

  // ✅ CORRECTION : Montant directement dans data.amount.total
  const amountCents = typeof payment?.amount === 'string' ? parseFloat(payment.amount) : payment?.amount
  const finalAmount = ((amountCents != null ? amountCents : 0) as number) / 100
  
  // ✅ CORRECTION : Infos donateur directement dans data.payer
  const donorFirstName = event.data.payer?.firstName || ''
  const donorLastName = event.data.payer?.lastName || ''
  const donorEmail = event.data.payer?.email || ''

  log.info('Création transaction', { finalAmount, donorFirstName, donorLastName })

  // Créer transaction
  const { data: transaction, error: transactionError } = await admin
    .from('support_transactions')
    .insert({
      user_id: intent.sapeur_pompier_id,
      tournee_id: intent.tournee_id,
      amount: finalAmount,
      calendar_accepted: true,
      supporter_name: `${donorFirstName} ${donorLastName}`.trim(),
      supporter_email: donorEmail,
      payment_method: 'carte',
      payment_status: 'completed',
  notes: `HelloAsso - Order ${event.data?.id ?? ''} | Payment ${payment?.id ?? ''}`,
      consent_email: true,
    })
    .select()
    .single()

  if (transactionError) {
    log.error('Erreur création transaction', transactionError)
    throw transactionError
  }

  log.info('Transaction créée', { transactionId: transaction.id })

  // Mettre à jour intent
  const { error: updateError } = await admin
    .from('donation_intents')
    .update({ 
      status: 'completed',
      final_amount: finalAmount,
      donor_first_name: donorFirstName,
      donor_last_name: donorLastName,
      donor_email: donorEmail,
      support_transaction_id: transaction.id,
    })
    .eq('id', intentId)

  if (updateError) {
    log.error('Erreur update intent', updateError)
    throw updateError
  }

  log.info('✅ Don traité avec succès', { intentId, finalAmount })
}

export const dynamic = 'force-dynamic'