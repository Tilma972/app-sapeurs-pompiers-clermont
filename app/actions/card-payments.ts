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
      .insert({ tournee_id: tourneeId, amount, status: 'pending', provider: 'stripe' })
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

// HelloAsso checkout creation (OAuth Client Credentials -> create checkout/payment intent)
export async function createHelloAssoCheckout(tourneeId: string, amount: number) {
  const log = createLogger('actions/card-payments:helloasso')
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  if (!tourneeId || !amount || amount <= 0) {
    return { success: false, error: 'Paramètres invalides' }
  }

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

  const clientId = process.env.HELLOASSO_CLIENT_ID
  const clientSecret = process.env.HELLOASSO_CLIENT_SECRET
  const orgSlug = process.env.HELLOASSO_ORG_SLUG
  const formSlug = process.env.HELLOASSO_FORM_SLUG
  const baseUrl = process.env.HELLOASSO_BASE_URL || 'https://api.helloasso.com'

  if (!clientId || !clientSecret || !orgSlug || !formSlug) {
    log.error('Configuration HelloAsso incomplète')
    return { success: false, error: 'Configuration HelloAsso manquante' }
  }

  try {
    // Insert a pending payment row first
    const { data: payment, error: insertErr } = await supabase
      .from('card_payments')
      .insert({ tournee_id: tourneeId, amount, status: 'pending', provider: 'helloasso' })
      .select()
      .single()

    if (insertErr || !payment) {
      log.error('Erreur insert card_payment (HelloAsso)', insertErr)
      return { success: false, error: 'Création paiement échouée' }
    }

    // OAuth token
    const tokenRes = await fetch(`${baseUrl}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'api' // typical HelloAsso scope; adjust if needed
      })
    })
    if (!tokenRes.ok) {
      log.error('HelloAsso token failure', { status: tokenRes.status })
      return { success: false, error: 'HelloAsso indisponible (token)' }
    }
    const tokenJson = await tokenRes.json() as { access_token: string }
    const accessToken = tokenJson.access_token

    // Create checkout-intent (endpoint may vary by API version; using v5 as example)
    // Here we prepare a minimal fixed-amount payment link for a donation form
    const createRes = await fetch(`${baseUrl}/v5/organizations/${orgSlug}/forms/${formSlug}/checkout-intents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // cents
        state: payment.id, // to correlate in webhook if supported
        // Optional: success/cancel URLs
      })
    })
    if (!createRes.ok) {
      const text = await createRes.text()
      log.error('HelloAsso checkout create failure', { status: createRes.status, text })
      return { success: false, error: 'Création HelloAsso échouée' }
    }
    const intent = await createRes.json() as { id?: string; url?: string }
    const checkoutUrl = intent.url || null
    const externalId = intent.id || null

    if (!checkoutUrl) {
      return { success: false, error: 'URL de paiement indisponible' }
    }

    // Store external identifiers
    await supabase
      .from('card_payments')
      .update({ external_payment_id: externalId, external_checkout_url: checkoutUrl })
      .eq('id', payment.id)

    return { success: true, url: checkoutUrl, paymentId: payment.id }
  } catch (e) {
    log.error('Erreur HelloAsso', { message: (e as Error)?.message })
    return { success: false, error: 'Erreur HelloAsso' }
  }
}
