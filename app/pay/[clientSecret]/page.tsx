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

  return <StripePaymentPage clientSecret={clientSecret} />
}

export const dynamic = 'force-dynamic'
