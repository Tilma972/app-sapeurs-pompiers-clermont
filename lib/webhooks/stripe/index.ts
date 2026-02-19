/**
 * Routeur principal pour les webhooks Stripe
 * 
 * Architecture modulaire :
 * - Ce fichier route les événements vers les handlers appropriés
 * - Chaque handler est responsable d'un type d'événement
 * - Les services sont partagés entre les handlers
 * 
 * Structure :
 * lib/webhooks/stripe/
 * ├── index.ts              ← Ce fichier (routeur)
 * ├── types.ts              ← Types partagés
 * ├── validators.ts         ← Validation signature + parsing
 * ├── handlers/
 * │   ├── checkout-session.ts  ← checkout.session.completed
 * │   ├── payment-intent.ts    ← payment_intent.succeeded
 * │   └── charge-succeeded.ts  ← charge.succeeded
 * └── services/
 *     ├── transaction.ts    ← CRUD transactions
 *     ├── email.ts          ← Envoi emails
 *     └── n8n.ts            ← Appels N8N
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createLogger } from '@/lib/log'
import { validateStripeSignature } from './validators'
import { handleCheckoutSession } from './handlers/checkout-session'
import { handlePaymentIntent } from './handlers/payment-intent'
import { handleCharge } from './handlers/charge-succeeded'
import type {
  StripeCheckoutSession,
  StripePaymentIntent,
  StripeCharge,
  HandlerResult,
} from './types'

const log = createLogger('webhook/stripe')

/**
 * Point d'entrée principal pour les webhooks Stripe
 * Route vers le handler approprié en fonction du type d'événement
 */
export async function handleStripeWebhook(req: NextRequest): Promise<NextResponse> {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  // ========================================================================
  // VALIDATION DE LA SIGNATURE
  // ========================================================================
  const validation = validateStripeSignature(body, signature)
  if (!validation.success || !validation.event) {
    return NextResponse.json(
      { error: validation.error || 'Invalid signature' },
      { status: 400 }
    )
  }

  const event = validation.event
  const admin = createAdminClient()

  // ========================================================================
  // LOGGING DU WEBHOOK
  // On récupère l'ID du log inséré pour pouvoir le mettre à jour après traitement.
  // ========================================================================
  const { data: logEntry } = await admin
    .from('webhook_logs')
    .insert({
      source: 'stripe',
      payload: event as unknown as Record<string, unknown>,
      headers: { signature },
      status: 'received',
      event_type: event.type,
    })
    .select('id')
    .single()

  const logId: string | null = logEntry?.id ?? null

  // ========================================================================
  // ROUTAGE VERS LE HANDLER APPROPRIÉ
  // ========================================================================
  let result: HandlerResult

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        result = await handleCheckoutSession(
          event.data.object as StripeCheckoutSession
        )
        break

      case 'payment_intent.succeeded':
        result = await handlePaymentIntent(
          event.data.object as StripePaymentIntent
        )
        break

      case 'charge.succeeded':
        result = await handleCharge(event.data.object as StripeCharge)
        break

      default:
        // Événement non géré - on retourne success pour ne pas bloquer Stripe
        log.info('Événement Stripe non géré', { type: event.type })
        return NextResponse.json({ received: true })
    }

    // Mise à jour du log webhook avec le résultat (par ID, pas ORDER/LIMIT qui est invalide sur UPDATE)
    if (logId) {
      await admin
        .from('webhook_logs')
        .update({
          status: result.success ? 'processed' : 'error',
          error_message: result.error ?? null,
        })
        .eq('id', logId)
    }

    return result.response
  } catch (err) {
    const error = err as Error
    log.error('❌ Exception non gérée dans le webhook', {
      event_type: event.type,
      error: error.message,
      stack: error.stack,
    })

    // Log l'erreur mais retourne 200 pour éviter les retries infinis
    // (Stripe considère tout sauf 2xx comme un échec)
    await admin.from('webhook_logs').insert({
      source: 'stripe',
      event_type: event.type,
      payload: { error: error.message },
      status: 'error',
      error_message: error.message,
    })

    // On retourne quand même 200 pour éviter les retries Stripe
    // L'erreur est loggée pour investigation
    return NextResponse.json({ received: true, error: 'Internal error logged' })
  }
}

// ========================================================================
// EXPORTS
// ========================================================================

export type { HandlerResult } from './types'
export { validateStripeSignature } from './validators'
