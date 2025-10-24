"use server"

import { getStripe } from "@/lib/stripe/client"

async function createSupabaseServerClient() {
  const { createClient } = await import("@/lib/supabase/server")
  return await createClient()
}

function resolveBaseUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
  if (!fromEnv) return "http://localhost:3000"
  if (fromEnv.startsWith("http")) return fromEnv
  return `https://${fromEnv}`
}

export async function createPaymentIntent(data: {
  amount: number
  calendarGiven: boolean
  tourneeId: string
}) {
  if (!data || typeof data.amount !== "number" || data.amount <= 0) {
    return { error: "Montant invalide" }
  }

  const stripe = getStripe()
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Authentification requise" }

  const pi = await stripe.paymentIntents.create({
    amount: Math.round(data.amount * 100),
    currency: 'eur',
    payment_method_types: ['card'],
    metadata: {
      tournee_id: data.tourneeId,
      calendar_given: String(!!data.calendarGiven),
      user_id: user.id,
    },
  })

  const base = resolveBaseUrl()
  return {
    url: `${base}/pay/${pi.client_secret}`,
    clientSecret: pi.client_secret,
  }
}
