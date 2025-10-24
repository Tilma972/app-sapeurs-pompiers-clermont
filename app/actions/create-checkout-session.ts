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

export async function createCheckoutSession(data: {
  amount: number
  calendarGiven: boolean
  tourneeId: string
}) {
  if (!data || typeof data.amount !== "number" || data.amount <= 0) {
    return { error: "Montant invalide" }
  }

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Authentification requise" }

  const stripe = getStripe()
  const base = resolveBaseUrl()

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          unit_amount: Math.round(data.amount * 100),
          product_data: {
            name: "Soutien aux Sapeurs-Pompiers",
            description: data.calendarGiven ? "Avec calendrier" : "Sans calendrier",
          },
        },
        quantity: 1,
      },
    ],
    customer_email: undefined,
    metadata: {
      tournee_id: data.tourneeId,
      calendar_given: String(!!data.calendarGiven),
      user_id: user.id,
    },
    success_url: `${base}/merci`,
    cancel_url: `${base}/dashboard/ma-tournee`,
  })

  return { url: session.url }
}
