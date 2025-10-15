import { NextRequest, NextResponse } from 'next/server'
import { HelloAssoWebhookEvent } from '@/lib/helloasso/webhook'
import { createAdminClient } from '@/lib/supabase/admin'
import { createLogger } from '@/lib/log'

const log = createLogger('webhook/helloasso')

export async function POST(req: NextRequest) {
  const start = Date.now()
  const admin = createAdminClient()
  let webhookLogId: string | null = null
  let rawBody = ''

  try {
    rawBody = await req.text()
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

    // Créer un log initial
    const headersObj: Record<string, string> = {}
    req.headers.forEach((value, key) => { headersObj[key] = value })
    const parsed = JSON.parse(rawBody) as HelloAssoWebhookEvent
    log.info('Webhook HelloAsso reçu', { eventType: parsed?.eventType })

    const { data: logRow } = await admin
      .from('webhook_logs')
      .insert({
        source: 'helloasso',
        event_type: parsed?.eventType ?? 'unknown',
        payload: parsed as unknown as object,
        headers: headersObj,
        status: 'received',
      })
      .select('id')
      .single()
    webhookLogId = logRow?.id ?? null

    // Traitement métier
    if (parsed?.eventType === 'Order' && parsed?.data?.order?.state === 'Authorized') {
      await handleOrderAuthorized(parsed)
    }

    // Marquer comme traité
    if (webhookLogId) {
      await admin
        .from('webhook_logs')
        .update({ status: 'processed', processing_duration_ms: Date.now() - start })
        .eq('id', webhookLogId)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    const message = (error as Error)?.message ?? 'Unknown error'
    log.error('Erreur traitement webhook', { message })
    if (webhookLogId) {
      await admin
        .from('webhook_logs')
        .update({ status: 'error', error_message: message, processing_duration_ms: Date.now() - start })
        .eq('id', webhookLogId)
    } else if (rawBody) {
      try {
        await admin.from('webhook_logs').insert({ source: 'helloasso', payload: JSON.parse(rawBody), status: 'error', error_message: message })
      } catch (e) {
        log.error("Impossible de persister le log d'erreur", { message: (e as Error)?.message })
      }
    }
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

  // Récupérer infos réelles depuis l'événement HelloAsso
  const finalAmount = (event.data.order?.amount?.total ?? 0) / 100
  const donorFirstName = event.data.order?.payer?.firstName || intent.donor_first_name || null
  const donorLastName = event.data.order?.payer?.lastName || intent.donor_last_name || null
  const donorEmail = event.data.order?.payer?.email || intent.donor_email || null

  // Protection doublon
  if (intent.status === 'completed' && intent.support_transaction_id) {
    log.warn('Intent déjà traitée', { intentId })
    return
  }

  const { data: transaction, error: transactionError } = await admin
    .from('support_transactions')
    .insert({
      user_id: intent.sapeur_pompier_id,
      tournee_id: intent.tournee_id,
      amount: finalAmount || intent.final_amount,
      calendar_accepted: !intent.fiscal_receipt,
      supporter_name: `${donorFirstName || ''} ${donorLastName || ''}`.trim() || null,
      supporter_email: donorEmail,
      payment_method: 'carte',
      payment_status: 'completed',
      notes: `Paiement HelloAsso - Commande ${event.data.order.id}`,
      consent_email: true,
    })
    .select()
    .single()

  if (transactionError) {
    log.error('Erreur création support_transaction', transactionError)
    throw transactionError
  }

  const { error: intentUpdateError } = await admin
    .from('donation_intents')
    .update({
      status: 'completed',
      support_transaction_id: transaction.id,
      final_amount: finalAmount || intent.final_amount,
      donor_first_name: donorFirstName,
      donor_last_name: donorLastName,
      donor_email: donorEmail,
    })
    .eq('id', intentId)
  if (intentUpdateError) {
    log.error('Erreur update intent', intentUpdateError)
    throw intentUpdateError
  }
}

export const dynamic = 'force-dynamic'
