// ============================================
// Webhook Stripe - Cagnottes
// Gère les confirmations de paiement
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe/client'
import prisma from '@/lib/prisma'

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
        await prisma.contribution.update({
          where: { id: contributionId },
          data: { 
            status: 'COMPLETED',
            stripePaymentId: paymentIntent.id,
          }
        })

        // Vérifier si l'objectif de la cagnotte est atteint
        const contribution = await prisma.contribution.findUnique({
          where: { id: contributionId },
          include: { moneyPot: true }
        })

        if (contribution?.moneyPot?.targetAmount) {
          const totalCollected = await prisma.contribution.aggregate({
            where: { 
              moneyPotId: contribution.moneyPotId,
              status: 'COMPLETED'
            },
            _sum: { amount: true }
          })

          const total = Number(totalCollected._sum.amount || 0)
          const target = Number(contribution.moneyPot.targetAmount)

          if (total >= target) {
            await prisma.moneyPot.update({
              where: { id: contribution.moneyPotId },
              data: { status: 'COMPLETED' }
            })
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
          await prisma.contribution.update({
            where: { id: contributionId },
            data: { status: 'FAILED' }
          })
          console.log(`❌ Contribution ${contributionId} échouée`)
        }
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        const paymentIntentId = charge.payment_intent as string

        if (!paymentIntentId) break

        // Trouver la contribution associée
        const contribution = await prisma.contribution.findFirst({
          where: { stripePaymentId: paymentIntentId }
        })

        if (contribution) {
          await prisma.contribution.update({
            where: { id: contribution.id },
            data: { status: 'REFUNDED' }
          })
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
