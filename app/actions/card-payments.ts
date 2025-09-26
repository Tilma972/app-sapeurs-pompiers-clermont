'use server'

import { redirect } from 'next/navigation'
import Stripe from 'stripe'
import { createLogger } from '@/lib/log'

async function createSupabaseServerClient() {
  const { createClient } = await import('@/lib/supabase/server')
  return await createClient()
}

export async function createCheckoutSession(tourneeId: string, amount: number) {
  const log = createLogger('actions/card-payments')
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  if (!tourneeId || !amount || amount <= 0) {
    return { success: false, error: 'Paramètres invalides' }
  }

  // Verify tournee ownership and active status
  const { data: tournee, error: tourneeErr } = await supabase
    .from('tournees')
    .select('id, user_id, statut')
    .eq('id', tourneeId)
    .eq('user_id', user.id)
    .single()

  if (tourneeErr || !tournee) {
    log.error('Tournee non trouvée ou non autorisée', { tourneeId })
    return { success: false, error: 'Tournée introuvable' }
  }

  try {
    // Insert pending card_payment (use service role via server)
    const { data: payment, error: insertErr } = await supabase
      .from('card_payments')
      .insert({ tournee_id: tourneeId, amount, status: 'pending' })
      .select()
      .single()

    if (insertErr || !payment) {
      log.error('Erreur insert card_payment', insertErr)
      return { success: false, error: 'Création paiement échouée' }
    }

    const stripeSecret = process.env.STRIPE_SECRET_KEY
    if (!stripeSecret) {
      log.error('STRIPE_SECRET_KEY manquant')
      return { success: false, error: 'Configuration Stripe manquante' }
    }
    const stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' })

    const origin = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || 'http://localhost:3000'
    const successUrl = `${origin}/dashboard/ma-tournee?payment=success`
    const cancelUrl = `${origin}/dashboard/ma-tournee?payment=cancelled`

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: { name: 'Don Calendrier' },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        card_payment_id: payment.id,
        tournee_id: tourneeId,
      },
    })

    if (!session.url) {
      return { success: false, error: 'URL de session indisponible' }
    }

    return { success: true, url: session.url, paymentId: payment.id }
  } catch (e) {
    log.error('Erreur Stripe', { message: (e as Error)?.message })
    return { success: false, error: 'Erreur Stripe' }
  }
}
