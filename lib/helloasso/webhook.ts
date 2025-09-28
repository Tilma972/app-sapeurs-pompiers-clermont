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
  data: {
    order: {
      id: string
      date: string
      amount: { total: number }
      state: 'Authorized' | 'Processed'
      payer: { firstName: string; lastName: string; email: string }
    }
    metadata: Record<string, string>
  }
}
