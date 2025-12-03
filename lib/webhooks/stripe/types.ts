/**
 * Types partagés pour le traitement des webhooks Stripe
 * Centralise toutes les définitions pour une meilleure maintenabilité
 */

import { NextResponse } from 'next/server'

// ============================================================================
// TYPES STRIPE (objets reçus des webhooks)
// ============================================================================

export interface StripeCheckoutSession {
  id: string
  amount_total?: number | null
  customer_details?: {
    email?: string | null
    name?: string | null
  } | null
  metadata?: {
    tournee_id?: string
    calendar_given?: string
    user_id?: string
    source?: string
    items?: string // JSON string des articles boutique
    customer_name?: string
    shipping_address?: string
  }
}

export interface StripePaymentIntent {
  id: string
  amount: number
  payment_method?: string
  metadata?: Record<string, string | undefined>
  latest_charge?: string | null
  charges?: {
    data?: Array<{
      billing_details?: { name?: string | null; email?: string | null }
    }>
  }
}

export interface StripeCharge {
  id: string
  amount: number
  billing_details?: { name?: string | null; email?: string | null }
  payment_intent?: string | null
  metadata?: Record<string, string>
}

export interface StripeEvent {
  type: string
  data: {
    object: unknown
  }
}

// ============================================================================
// TYPES INTERNES (données extraites et normalisées)
// ============================================================================

export interface BoutiqueItem {
  id: string
  name: string
  qty: number
  price?: number
}

export interface ExtractedDonorInfo {
  email: string | null
  name: string | null
}

export interface TransactionInsertData {
  user_id: string | null
  tournee_id: string | null
  amount: number
  calendar_accepted: boolean
  payment_method: 'carte' | 'especes' | 'cheque'
  payment_status: 'completed' | 'pending' | 'failed'
  stripe_session_id: string
  supporter_email: string | null
  supporter_name: string | null
  notes: string
  source?: string
  order_status?: string
}

export interface TransactionRecord {
  id: string
  amount: number
  supporter_name: string | null
  supporter_email: string | null
}

export interface OrderItemInsert {
  transaction_id: string
  product_id: string
  name: string
  description: string | null
  quantity: number
  unit_price: number
  image_url: string | null
}

// ============================================================================
// TYPES DE CONTEXTE (passés entre les fonctions)
// ============================================================================

export interface CheckoutContext {
  session: StripeCheckoutSession
  amount: number
  donorEmail: string | null
  donorName: string | null
  boutiqueItems: BoutiqueItem[]
  calendarAccepted: boolean
  userId: string | null
  tourneeId: string | null
  source: 'boutique' | 'landing_page_donation' | 'terrain' | string
}

export interface PaymentIntentContext {
  paymentIntent: StripePaymentIntent
  amount: number
  donorEmail: string | null
  donorName: string | null
  calendarAccepted: boolean
  userId: string | null
  tourneeId: string | null
}

export interface ChargeContext {
  charge: StripeCharge
  amount: number
  donorEmail: string | null
  donorName: string | null
  calendarAccepted: boolean
  userId: string | null
  tourneeId: string | null
}

// ============================================================================
// TYPES DE RÉSULTAT
// ============================================================================

export interface HandlerResult {
  success: boolean
  response: NextResponse
  transactionId?: string
  error?: string
}

export type WebhookHandler = () => Promise<HandlerResult>

// ============================================================================
// CONSTANTES
// ============================================================================

export const SOURCES = {
  BOUTIQUE: 'boutique',
  LANDING_PAGE: 'landing_page_donation',
  TERRAIN: 'terrain',
} as const

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const

export const MIN_RECEIPT_AMOUNT = 6 // Montant minimum pour un reçu fiscal
