// ============================================
// Webhook Stripe - Cagnottes
// Gère les confirmations de paiement
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/admin'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_CAGNOTTE

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: 'Missing signature or webhook secret' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  // Utiliser le client admin pour contourner les RLS (car pas de session utilisateur ici)
  const supabase = createAdminClient()

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        // Vérifier que c'est bien un paiement de cagnotte
        if (paymentIntent.metadata.type !== 'cagnotte') {
          break
        }

        const contributionId = paymentIntent.metadata.contributionId

        if (!contributionId) {
          console.error('Missing contributionId in metadata')
          break
        }

        // Mettre à jour la contribution
        const { error: updateError } = await supabase
          .from('associative_contributions')
          .update({
            status: 'COMPLETED',
            stripePaymentId: paymentIntent.id,
          })
          .eq('id', contributionId)

        if (updateError) {
          console.error('Error updating contribution:', updateError)
          break
        }

        // Vérifier si l'objectif de la cagnotte est atteint
        const { data: contribution } = await supabase
          .from('associative_contributions')
          .select(`
            moneyPotId,
            moneyPot:associative_money_pots(targetAmount)
          `)
          .eq('id', contributionId)
          .single()

        if (contribution) {
          // Supabase JS client can sometimes return an array for nested relations depending on inference
          // Safe access to handle both object and array
          const moneyPot = Array.isArray(contribution.moneyPot)
            ? contribution.moneyPot[0]
            : contribution.moneyPot

          if (moneyPot?.targetAmount) {
            // Calculer le total collecté
            const { data: contributions } = await supabase
              .from('associative_contributions')
              .select('amount')
              .eq('moneyPotId', contribution.moneyPotId)
              .eq('status', 'COMPLETED')

            const total = (contributions || []).reduce(
              (sum, c: any) => sum + Number(c.amount),
              0
            )

            const target = Number(moneyPot.targetAmount)

            if (total >= target) {
              await supabase
                .from('associative_money_pots')
                .update({ status: 'COMPLETED' })
                .eq('id', contribution.moneyPotId)
            }
          }
        }

        console.log(`✅ Contribution ${contributionId} confirmée`)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        if (paymentIntent.metadata.type !== 'cagnotte') {
          break
        }

        const contributionId = paymentIntent.metadata.contributionId

        if (contributionId) {
          await supabase
            .from('associative_contributions')
            .update({ status: 'FAILED' })
            .eq('id', contributionId)

          console.log(`❌ Contribution ${contributionId} échouée`)
        }
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        const paymentIntentId = charge.payment_intent as string

        if (!paymentIntentId) break

        // Trouver la contribution associée
        const { data: contribution } = await supabase
          .from('associative_contributions')
          .select('id')
          .eq('stripePaymentId', paymentIntentId)
          .single()

        if (contribution) {
          await supabase
            .from('associative_contributions')
            .update({ status: 'REFUNDED' })
            .eq('id', contribution.id)

          console.log(`🔄 Contribution ${contribution.id} remboursée`)
        }
        break
      }

      default:
        // Événement non géré
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
