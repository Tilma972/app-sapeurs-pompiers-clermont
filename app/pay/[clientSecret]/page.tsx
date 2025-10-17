import { notFound } from 'next/navigation'
import { StripePaymentPage } from '@/components/stripe-payment-page'

type Props = {
  params: Promise<{ clientSecret: string }>
}

export default async function PayPage({ params }: Props) {
  const { clientSecret } = await params

  if (!clientSecret || !clientSecret.startsWith('pi_')) {
    notFound()
  }
  // Récupérer l'intentId lié au PaymentIntent via Supabase
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  // Extraire l'identifiant du PaymentIntent du clientSecret
  const piId = clientSecret.split('_secret_')[0]

  const { data: intent } = await supabase
    .from('donation_intents')
    .select('id')
    .eq('stripe_payment_intent_id', piId)
    .single()

  return <StripePaymentPage clientSecret={clientSecret} intentId={intent?.id} />
}

export const dynamic = 'force-dynamic'
