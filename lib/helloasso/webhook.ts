import crypto from 'crypto'
import { createLogger } from '@/lib/log'

const log = createLogger('helloasso/webhook')

export function verifyHelloAssoSignature(payload: string, signature: string | null): boolean {
  if (!signature) {
    log.warn('Signature HelloAsso manquante')
    return false
  }
  const secret = process.env.HELLOASSO_WEBHOOK_SECRET as string
  const expected = crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    log.warn('Signature HelloAsso invalide')
    return false
  }
}

export interface HelloAssoWebhookEvent {
  eventType: 'Order' | 'Payment'
  status?: 'received' | 'processed' | string
  metadata?: Record<string, string>
  data: {
    id?: string
    // Possible overall state for Payment events
    state?: string
    // Total amount for Payment events (in cents)
    amount?: number | string
    // Payments list with state and amount in cents
    payments?: Array<{
      id?: string
      state?: string
      amount?: number
    }>
    // Items list may have states like "Processed"
    items?: Array<{
      state?: string
    }>
    // Payer information at data level
    payer?: { firstName?: string; lastName?: string; email?: string }
    // Optional legacy order shape (not used for state now)
    order?: {
      id?: string
      date?: string
      amount?: { total?: number }
      state?: string
      payer?: { firstName?: string; lastName?: string; email?: string }
    }
    // Metadata sometimes nested here
    metadata?: Record<string, string>
  }
}
