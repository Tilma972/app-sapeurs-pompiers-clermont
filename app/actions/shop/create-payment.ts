"use server"

import { getStripe } from "@/lib/stripe/client"

function resolveBaseUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
  if (!fromEnv) return "http://localhost:3000"
  if (fromEnv.startsWith("http")) return fromEnv
  return `https://${fromEnv}`
}

export type ShopCartItem = {
  id: string
  name: string
  price: number
  quantity: number
}

export async function createShopPayment(data: {
  items: ShopCartItem[]
  customerEmail?: string
  customerName?: string
}) {
  if (!data?.items || data.items.length === 0) {
    return { error: "Panier vide" }
  }

  const totalAmount = data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  
  if (totalAmount <= 0) {
    return { error: "Montant invalide" }
  }

  const stripe = getStripe()
  const base = resolveBaseUrl()

  try {
    // Créer une session Checkout pour une meilleure UX
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: data.items.map(item => ({
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.name,
            description: `Boutique Amicale SP Clermont l'Hérault`,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `${base}/boutique/merci?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/boutique`,
      customer_email: data.customerEmail,
      metadata: {
        source: 'boutique',
        customer_name: data.customerName || '',
        items: JSON.stringify(data.items.map(i => ({ id: i.id, name: i.name, qty: i.quantity }))),
      },
    })

    return {
      url: session.url,
      sessionId: session.id,
    }
  } catch (error) {
    console.error('Erreur création session Stripe:', error)
    return { error: "Erreur lors de la création du paiement" }
  }
}
