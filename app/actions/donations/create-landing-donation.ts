"use server"

import { getStripe } from "@/lib/stripe/client"
import { createLogger } from "@/lib/log"

const log = createLogger('actions/landing-donation')

function resolveBaseUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
  if (!fromEnv) return "http://localhost:3000"
  if (fromEnv.startsWith("http")) return fromEnv
  return `https://${fromEnv}`
}

export async function createLandingDonation(data: {
  amount: number
  donorEmail: string
  donorName?: string
}) {
  // Validation stricte
  if (!data || typeof data.amount !== "number" || data.amount <= 0) {
    log.warn('Montant invalide', { amount: data?.amount })
    return { error: "Montant invalide" }
  }

  if (data.amount > 10000) {
    log.warn('Montant trop élevé', { amount: data.amount })
    return { error: "Le montant maximum autorisé est de 10 000€" }
  }

  if (!data.donorEmail || !/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(data.donorEmail.trim())) {
    log.warn('Email invalide', { email: data.donorEmail })
    return { error: "Email invalide" }
  }

  const stripe = getStripe()
  const base = resolveBaseUrl()

  try {
    // Créer une session Checkout Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Don à l\'Amicale des Sapeurs-Pompiers',
            description: 'Don fiscal - Reçu fiscal envoyé par email',
            images: [`${base}/logo-amicale.png`],
          },
          unit_amount: Math.round(data.amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${base}/don-landing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/#contact`,
      customer_email: data.donorEmail,
      metadata: {
        source: 'landing_page_donation',
        calendar_given: 'false', // Don fiscal par défaut
        donor_name: data.donorName || '',
        donor_email: data.donorEmail,
        // PAS de tournee_id = isolation totale avec les tournées PWA
        // PAS de user_id = donation publique
      },
    })

    log.info('Checkout Session créée', { sessionId: session.id, amount: data.amount })

    return {
      url: session.url,
      sessionId: session.id,
    }
  } catch (error) {
    log.error('Erreur création Checkout Session', { message: (error as Error)?.message })
    return { error: "Erreur lors de la création du paiement. Veuillez réessayer." }
  }
}
