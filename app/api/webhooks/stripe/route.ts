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
      latest_charge?: string | null
      charges?: {
        data?: Array<{
          billing_details?: { name?: string | null; email?: string | null }
        }>
      }
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

    // Récupérer les infos de facturation (priorité au Charge -> billing_details, fallback PaymentMethod)
    let billingName: string | undefined
    let billingEmail: string | undefined

    const charge = paymentIntent.charges?.data?.[0]
    const chargeDetails = charge?.billing_details as { name?: string | null; email?: string | null } | undefined
    if (chargeDetails) {
      billingName = chargeDetails.name ?? undefined
      billingEmail = chargeDetails.email ?? undefined
    }

    if (!billingName && !billingEmail) {
      try {
        const stripe = getStripe()
        if (paymentIntent.payment_method) {
          const pm = await stripe.paymentMethods.retrieve(paymentIntent.payment_method)
          const details = (pm as { billing_details?: { name?: string | null; email?: string | null } })?.billing_details
          billingName = details?.name ?? undefined
          billingEmail = details?.email ?? undefined
        }
      } catch (err) {
        log.warn('Impossible de récupérer les billing_details via PaymentMethod', { message: (err as Error)?.message })
      }
    }

    // Dernier fallback: récupérer le dernier charge complet si disponible
    if ((!billingName && !billingEmail) && paymentIntent.latest_charge) {
      try {
        const stripe = getStripe()
        const ch = await stripe.charges.retrieve(paymentIntent.latest_charge)
        const bd = (ch as { billing_details?: { name?: string | null; email?: string | null } }).billing_details
        billingName = bd?.name ?? billingName
        billingEmail = bd?.email ?? billingEmail
      } catch (err) {
        log.warn('Impossible de récupérer latest_charge', { message: (err as Error)?.message })
      }
    }

    // Parse prénom/nom à partir du nom complet
    let donorFirstName: string | null = null
    let donorLastName: string | null = null
    if (billingName) {
      const parts = billingName.trim().split(/\s+/)
      if (parts.length === 1) {
        donorFirstName = parts[0]
      } else if (parts.length >= 2) {
        donorFirstName = parts[0]
        donorLastName = parts.slice(1).join(' ')
      }
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
        donor_first_name: donorFirstName,
        donor_last_name: donorLastName,
        donor_email: billingEmail ?? null,
      })
      .eq('id', intentId)

    log.info('✅ Don Stripe traité', { intentId, finalAmount })
  }

  // Alternative: traiter directement le charge avec ses billing_details complets
  if (e.type === 'charge.succeeded') {
    const charge = e.data.object as {
      id: string
      amount: number
      billing_details?: { name?: string | null; email?: string | null }
      payment_intent?: string | null
    }

    const stripe = getStripe()
    type PartialPI = { id: string; amount: number; metadata?: { intentId?: string } }
    let pi: PartialPI | null = null

    try {
      if (charge.payment_intent) {
        const fullPi = await stripe.paymentIntents.retrieve(charge.payment_intent)
        const partial: PartialPI = {
          id: (fullPi as { id: string }).id,
          amount: (fullPi as { amount: number }).amount,
          metadata: (fullPi as { metadata?: { intentId?: string } }).metadata,
        }
        pi = partial
      }
    } catch (err) {
      log.warn('Impossible de récupérer PaymentIntent depuis charge', { message: (err as Error)?.message })
    }

    const intentId = pi?.metadata?.intentId as string | undefined
    if (!intentId) {
      log.error('IntentId manquant sur charge.succeeded')
      return NextResponse.json({ received: true })
    }

    const admin = createAdminClient()
    const { data: intent } = await admin
      .from('donation_intents')
      .select('*')
      .eq('id', intentId)
      .single()

    if (!intent) {
      log.error('Intent introuvable (charge.succeeded)', { intentId })
      return NextResponse.json({ received: true })
    }

    if (intent.status === 'completed') {
      log.warn('Intent déjà complétée (charge.succeeded)', { intentId })
      return NextResponse.json({ received: true })
    }

    const finalAmount = charge.amount / 100
    const billingName = charge.billing_details?.name ?? undefined
    const billingEmail = charge.billing_details?.email ?? undefined

    let donorFirstName: string | null = null
    let donorLastName: string | null = null
    if (billingName) {
      const parts = billingName.trim().split(/\s+/)
      if (parts.length === 1) donorFirstName = parts[0]
      else if (parts.length >= 2) {
        donorFirstName = parts[0]
        donorLastName = parts.slice(1).join(' ')
      }
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
        notes: `Stripe Charge - ${charge.id}`,
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
        donor_first_name: donorFirstName,
        donor_last_name: donorLastName,
        donor_email: billingEmail ?? null,
      })
      .eq('id', intentId)

    log.info('✅ Don Stripe traité (charge.succeeded)', { intentId, finalAmount })
  }

  return NextResponse.json({ received: true })
}
