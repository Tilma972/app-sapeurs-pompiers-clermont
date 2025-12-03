/**
 * Route API pour les webhooks Stripe
 * 
 * Ce fichier est volontairement minimaliste.
 * Toute la logique metier est dans lib/webhooks/stripe/
 */

import { NextRequest } from 'next/server'
import { handleStripeWebhook } from '@/lib/webhooks/stripe'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  return handleStripeWebhook(req)
}
