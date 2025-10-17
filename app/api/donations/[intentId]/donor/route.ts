import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe/client'
import { createLogger } from '@/lib/log'

const log = createLogger('api/donations/[intentId]/donor')

export async function POST(req: Request) {
  try {
    const url = new URL(req.url)
    const parts = url.pathname.split('/').filter(Boolean)
    // Expecting path like: /api/donations/{intentId}/donor
    const donationsIdx = parts.findIndex((p) => p === 'donations')
    const intentId = donationsIdx >= 0 ? parts[donationsIdx + 1] : undefined
    const body = await req.json().catch(() => ({}))
    const { firstName, lastName, email, finalAmount } = body as {
      firstName?: string
      lastName?: string
      email?: string
      finalAmount?: number
    }

    if (!intentId) {
      return NextResponse.json({ error: 'Missing intentId' }, { status: 400 })
    }
    if (!firstName || !lastName || !email) {
      return NextResponse.json({ error: 'Missing donor fields' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: intent, error: fetchError } = await admin
      .from('donation_intents')
      .select('id, status, stripe_payment_intent_id')
      .eq('id', intentId)
      .single()

    if (fetchError || !intent) {
      log.error('Intent introuvable', { intentId, fetchError })
      return NextResponse.json({ error: 'Intent not found' }, { status: 404 })
    }

    if (intent.status !== 'waiting_donor') {
      log.warn('Intent déjà traitée', { intentId, status: intent.status })
      return NextResponse.json({ error: 'Intent already processed' }, { status: 409 })
    }

    // Update Stripe PI metadata (and amount if provided and PI is not confirmed)
    try {
      const stripe = getStripe()
      const update: Parameters<typeof stripe.paymentIntents.update>[1] = {
        metadata: {
          intentId,
          donor_name: `${firstName} ${lastName}`,
          donor_email: email,
        },
      }
      if (typeof finalAmount === 'number' && Number.isFinite(finalAmount) && finalAmount > 0) {
        update.amount = Math.round(finalAmount * 100)
      }
      await stripe.paymentIntents.update(intent.stripe_payment_intent_id as string, update)
    } catch (err) {
      log.warn('Stripe PI update failed (metadata/amount)', { message: (err as Error)?.message, intentId })
    }

    // Update DB with donor info (source of truth)
    const { error: updateError } = await admin
      .from('donation_intents')
      .update({
        donor_first_name: firstName,
        donor_last_name: lastName,
        donor_email: email,
        ...(typeof finalAmount === 'number' && Number.isFinite(finalAmount) && finalAmount > 0
          ? { final_amount: finalAmount }
          : {}),
      })
      .eq('id', intentId)
      .eq('status', 'waiting_donor')

    if (updateError) {
      log.error('Erreur MAJ donation_intents', { intentId, updateError })
      return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
    }

    log.info('Donor info stored', { intentId, email })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error)?.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}
