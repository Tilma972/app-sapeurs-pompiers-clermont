/**
 * Validation et parsing des webhooks Stripe
 * Gère la vérification de signature et l'extraction des données
 */

import { getStripe } from '@/lib/stripe/client'
import { createLogger } from '@/lib/log'
import type { StripeEvent, BoutiqueItem } from './types'

const log = createLogger('webhook/stripe/validators')

// ============================================================================
// VALIDATION DE SIGNATURE
// ============================================================================

export interface SignatureValidationResult {
  success: boolean
  event?: StripeEvent
  error?: string
}

/**
 * Valide la signature Stripe et parse l'événement
 */
export function validateStripeSignature(
  body: string,
  signature: string | null
): SignatureValidationResult {
  if (!signature) {
    return { success: false, error: 'Missing signature' }
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    log.error('STRIPE_WEBHOOK_SECRET non configuré')
    return { success: false, error: 'Webhook secret not configured' }
  }

  try {
    const stripe = getStripe()
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    return { success: true, event: event as unknown as StripeEvent }
  } catch (err) {
    const message = (err as Error)?.message || 'Unknown error'
    log.error('Signature Stripe invalide', { message })
    return { success: false, error: `Invalid signature: ${message}` }
  }
}

// ============================================================================
// EXTRACTION DES DONNÉES
// ============================================================================

/**
 * Parse les items boutique depuis les métadonnées
 */
export function parseBoutiqueItems(itemsJson: string | undefined): BoutiqueItem[] {
  if (!itemsJson) return []

  try {
    const items = JSON.parse(itemsJson) as BoutiqueItem[]
    log.info('📦 Items boutique parsés', { count: items.length })
    return items
  } catch (err) {
    log.warn('⚠️ Impossible de parser metadata.items', {
      raw: itemsJson,
      error: (err as Error).message,
    })
    return []
  }
}

/**
 * Extrait le boolean calendar_accepted depuis les métadonnées
 */
export function parseCalendarAccepted(value: string | undefined): boolean {
  return value === 'true'
}

/**
 * Normalise une source en valeur connue
 */
export function normalizeSource(source: string | undefined): string {
  const validSources = ['boutique', 'landing_page_donation', 'terrain']
  if (source && validSources.includes(source)) {
    return source
  }
  // Si pas de source valide, on considère que c'est la boutique par défaut
  return source || 'boutique'
}

/**
 * Génère les notes en fonction de la source
 */
export function generateNotes(source: string, stripeId: string): string {
  switch (source) {
    case 'landing_page_donation':
      return 'Don landing page (Stripe Checkout)'
    case 'boutique':
      return 'Boutique (Stripe Checkout)'
    default:
      return `Stripe - ${stripeId}`
  }
}
