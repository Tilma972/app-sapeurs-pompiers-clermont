'use server'

import { stripe } from '@/lib/stripe/client'
import { createLogger } from '@/lib/log'

async function createSupabaseServerClient() {
  const { createClient } = await import('@/lib/supabase/server')
  return await createClient()
}

const log = createLogger('actions/stripe-payment')

export async function createStripePaymentIntent(data: {
  tourneeId: string
  amount: number // en euros
}) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: 'Non authentifié' }
  }

  try {
    const { data: intent, error: intentError } = await supabase
      .from('donation_intents')
      .insert({
        tournee_id: data.tourneeId,
        sapeur_pompier_id: user.id,
        expected_amount: data.amount,
        status: 'waiting_donor',
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      })
      .select()
      .single()

    if (intentError || !intent) {
      log.error('Erreur création intention', intentError)
      return { success: false, error: 'Erreur création intention' }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(data.amount * 100),
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
      metadata: {
        intentId: intent.id,
        tourneeId: data.tourneeId,
      },
    })

    await supabase
      .from('donation_intents')
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq('id', intent.id)

    log.info('PaymentIntent Stripe créé', {
      intentId: intent.id,
      paymentIntentId: paymentIntent.id,
      amount: data.amount,
    })

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      intentId: intent.id,
    }
  } catch (error) {
    log.error('Erreur Stripe', { message: (error as Error)?.message })
    return { success: false, error: 'Erreur lors de la création du paiement' }
  }
}
