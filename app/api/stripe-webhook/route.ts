import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripeSecret || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe non configuré' }, { status: 500 })
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' })
  const signature = req.headers.get('stripe-signature') as string
  const body = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const cardPaymentId = (session.metadata?.card_payment_id as string) || null
    const paymentIntentId = session.payment_intent as string | null
    if (cardPaymentId) {
      const admin = createAdminClient()
      await admin
        .from('card_payments')
        .update({ status: 'succeeded', stripe_payment_intent_id: paymentIntentId || null })
        .eq('id', cardPaymentId)
    }
  }

  return NextResponse.json({ received: true })
}

export const dynamic = 'force-dynamic'