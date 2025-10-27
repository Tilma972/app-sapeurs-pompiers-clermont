import { notFound, redirect } from 'next/navigation'
import { StripePaymentPage } from '@/components/stripe-payment-page'

type Props = {
  params: Promise<{ clientSecret: string }>
}

export default async function PayPage({ params }: Props) {
  const { clientSecret } = await params

  // Support both PaymentIntent (pi_) and Checkout Session (cs_)
  if (!clientSecret) {
    notFound()
  }

  // If Checkout Session, immediately redirect to Stripe Checkout URL
  if (clientSecret.startsWith('cs_')) {
    const { getStripe } = await import('@/lib/stripe/client')
    const stripe = getStripe()
    try {
      const session = await stripe.checkout.sessions.retrieve(clientSecret)
      if (!session.url) {
        notFound()
      }
      redirect(session.url)
    } catch {
      notFound()
    }
  }

  // If PaymentIntent, continue with payment element page
  if (!clientSecret.startsWith('pi_')) {
    notFound()
  }
  return <StripePaymentPage clientSecret={clientSecret} />
}

export const dynamic = 'force-dynamic'
