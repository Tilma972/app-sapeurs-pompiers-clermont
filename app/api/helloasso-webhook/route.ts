import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

function verifySignature(secret: string, payload: string, signature: string | null): boolean {
  if (!signature) return false
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payload, 'utf8')
  const digest = hmac.digest('hex')
  // HelloAsso typically sends signature as hex; adjust if prefixed like sha256=...
  const sig = signature.replace(/^sha256=/, '')
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(sig))
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.HELLOASSO_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'HELLOASSO_WEBHOOK_SECRET manquant' }, { status: 500 })
  }

  const signature = req.headers.get('x-helloasso-signature')
  const body = await req.text()

  if (!verifySignature(secret, body, signature)) {
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  const event = JSON.parse(body) as {
    eventType?: string
    data?: { id?: string; state?: string; status?: string }
  }

  const admin = createAdminClient()
  const status = event.data?.status || ''
  const extId = event.data?.id || null
  const state = event.data?.state || null

  // Try to match by state first (we stored payment.id there); fallback to external id
  if (state) {
    await admin
      .from('card_payments')
      .update({ status: status === 'succeeded' || status === 'paid' ? 'succeeded' : status === 'failed' ? 'failed' : 'succeeded', external_payment_id: extId })
      .eq('id', state)
  } else if (extId) {
    await admin
      .from('card_payments')
      .update({ status: status === 'succeeded' || status === 'paid' ? 'succeeded' : status === 'failed' ? 'failed' : 'succeeded' })
      .eq('external_payment_id', extId)
  }

  return NextResponse.json({ received: true })
}

export const dynamic = 'force-dynamic'