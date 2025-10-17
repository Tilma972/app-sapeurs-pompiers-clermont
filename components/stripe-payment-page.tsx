'use client'

import { useEffect, useState } from 'react'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { stripePromise } from '@/lib/stripe/client-side'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2 } from 'lucide-react'

function PaymentForm({ onSuccess, intentId }: { onSuccess: () => void; intentId?: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setIsLoading(true)
    setError(undefined)

    const returnUrl = intentId
      ? `${window.location.origin}/don/success?intent=${intentId}`
      : `${window.location.origin}/don/success`

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
    })

    if (submitError) {
      setError(submitError.message)
      setIsLoading(false)
    } else {
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        options={{
          layout: 'tabs',
          fields: {
            billingDetails: {
              name: 'auto',
              email: 'auto',
              phone: 'auto',
              address: 'never',
            },
          },
        }}
      />

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">⚠️ {error}</div>
      )}

      <Button type="submit" disabled={!stripe || isLoading} className="w-full h-12 text-base" size="lg">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Traitement...
          </>
        ) : (
          <>
            <CheckCircle className="mr-2 h-5 w-5" />
            Confirmer le don
          </>
        )}
      </Button>

      <div className="text-center space-y-2">
        <p className="text-xs text-gray-500">🔒 Paiement sécurisé par Stripe</p>
        <p className="text-xs text-gray-400">Apple Pay et Google Pay disponibles</p>
      </div>
    </form>
  )
}

export function StripePaymentPage({ clientSecret, intentId }: { clientSecret: string; intentId?: string }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600 mt-4">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl">🚒</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Don aux Sapeurs-Pompiers</h1>
          <p className="text-gray-600 text-sm">Clermont-l&apos;Hérault</p>
        </div>

        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: { theme: 'stripe', variables: { colorPrimary: '#3b82f6', borderRadius: '8px' } },
            loader: 'auto',
          }}
        >
          <PaymentForm onSuccess={() => { /* Redirect handled by Stripe */ }} intentId={intentId} />
        </Elements>

        <div className="mt-6 pt-6 border-t text-center">
          <p className="text-xs text-gray-500">
            Les frais de transaction (1,4% + 0,25€) sont prélevés automatiquement.
            <br />
            Vous ne payez que le montant affiché.
          </p>
        </div>
      </div>
    </div>
  )
}
