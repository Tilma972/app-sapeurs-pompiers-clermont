import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { createLogger } from '@/lib/log'

const log = createLogger('webhook/stripe')

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: unknown

  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    )
  } catch (err) {
    log.error('Signature Stripe invalide', { message: (err as Error)?.message })
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Log webhook
  await admin.from('webhook_logs').insert({
    source: 'stripe',
    payload: event as Record<string, unknown>,
    headers: { signature },
    status: 'received',
    event_type: (event as { type?: string }).type,
  })

  const e = event as { type: string; data: { object: unknown } }
  if (e.type === 'payment_intent.succeeded') {
    const paymentIntent = e.data.object as {
      id: string
      amount: number
      payment_method?: string
      metadata?: { intentId?: string }
    }
    const intentId = paymentIntent.metadata?.intentId as string | undefined

    log.info('Payment succeeded', { intentId, amount: paymentIntent.amount })

    const { data: intent } = await admin
      .from('donation_intents')
      .select('*')
      .eq('id', intentId)
      .single()

    if (!intent) {
      log.error('Intent introuvable', { intentId })
      return NextResponse.json({ received: true })
    }

    if (intent.status === 'completed') {
      log.warn('Intent déjà complétée', { intentId })
      return NextResponse.json({ received: true })
    }

    const finalAmount = paymentIntent.amount / 100

    // Récupérer les infos de facturation depuis le PaymentMethod
    let billingName: string | undefined
    let billingEmail: string | undefined
    try {
      const stripe = getStripe()
      if (paymentIntent.payment_method) {
        const pm = await stripe.paymentMethods.retrieve(paymentIntent.payment_method)
        const details = (pm as { billing_details?: { name?: string; email?: string } })?.billing_details
        billingName = details?.name || undefined
        billingEmail = details?.email || undefined
      }
    } catch (err) {
      log.warn('Impossible de récupérer les billing_details', { message: (err as Error)?.message })
    }

    const { data: transaction } = await admin
      .from('support_transactions')
      .insert({
        user_id: intent.sapeur_pompier_id,
        tournee_id: intent.tournee_id,
        amount: finalAmount,
        calendar_accepted: true,
        payment_method: 'carte',
        payment_status: 'completed',
        notes: `Stripe - ${paymentIntent.id}`,
        supporter_name: billingName,
        supporter_email: billingEmail,
      })
      .select()
      .single()

    await admin
      .from('donation_intents')
      .update({
        status: 'completed',
        final_amount: finalAmount,
        support_transaction_id: transaction?.id,
        donor_first_name: billingName ? billingName.split(' ').slice(0, -1).join(' ') || billingName : null,
        donor_last_name: billingName ? billingName.split(' ').slice(-1).join(' ') || null : null,
        donor_email: billingEmail ?? null,
      })
      .eq('id', intentId)

    log.info('✅ Don Stripe traité', { intentId, finalAmount })
  }

  return NextResponse.json({ received: true })
}
