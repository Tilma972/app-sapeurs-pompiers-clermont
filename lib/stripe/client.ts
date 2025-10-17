import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (_stripe) return _stripe
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('Stripe secret key is not set (STRIPE_SECRET_KEY)')
  }
  _stripe = new Stripe(key, { apiVersion: '2025-09-30.clover' })
  return _stripe
}
