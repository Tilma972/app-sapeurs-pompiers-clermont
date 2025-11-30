'use client'

import { useEffect, useState } from 'react'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { stripePromise } from '@/lib/stripe/client-side'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2 } from 'lucide-react'

function PaymentForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [donorName, setDonorName] = useState('')
  const [donorEmail, setDonorEmail] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setIsLoading(true)
    setError(undefined)

    const returnUrl = `${window.location.origin}/don/success`

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
          // Provide country explicitly since address collection is disabled in the Payment Element
          payment_method_data: {
            billing_details: {
              name: donorName || undefined,
              email: donorEmail || undefined,
              address: { country: 'FR' },
            },
          },
        },
      })

      if (result.error) {
        setError(result.error.message)
      } else {
        onSuccess()
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue lors de la confirmation du paiement.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
          <input
            type="text"
            value={donorName}
            onChange={(e) => setDonorName(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            placeholder="Jean Dupont"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={donorEmail}
            onChange={(e) => setDonorEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            placeholder="jean.dupont@example.com"
          />
        </div>
      </div>
      <PaymentElement
        options={{
          layout: 'tabs',
          fields: {
            billingDetails: {
              name: 'auto',
              email: 'auto',
              phone: 'auto',
              address: 'auto',
            },
          },
          // Card-only server config; Apple Pay / Google Pay stay available via Payment Request if enabled on the account/device
          paymentMethodOrder: ['card'],
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

function PaymentAmountDisplay({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe()
  const [amount, setAmount] = useState<number | null>(null)
  const [calendarGiven, setCalendarGiven] = useState<boolean>(false)

  useEffect(() => {
    if (!stripe || !clientSecret) return

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      if (paymentIntent && paymentIntent.amount) {
        setAmount(paymentIntent.amount / 100) // Convert cents to euros
        setCalendarGiven(paymentIntent.metadata?.calendar_given === 'true')
      }
    }).catch((err) => {
      console.error('Error retrieving payment intent:', err)
    })
  }, [stripe, clientSecret])

  if (amount === null) {
    return (
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl p-6 mb-6 text-center">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-lg font-semibold">Chargement du montant...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl p-6 mb-6">
      <div className="text-center">
        <p className="text-sm font-medium mb-2 opacity-90">
          {calendarGiven ? 'Montant de votre soutien' : 'Montant de votre don'}
        </p>
        <p className="text-5xl font-bold mb-2">{amount.toFixed(2)} €</p>
        {!calendarGiven && amount >= 6 && (
          <p className="text-sm opacity-90">
            ✅ Reçu fiscal éligible à 66% de réduction d&apos;impôts
          </p>
        )}
        {calendarGiven && (
          <p className="text-sm opacity-90">
            📅 Avec calendrier
          </p>
        )}
      </div>
    </div>
  )
}

export function StripePaymentPage({ clientSecret }: { clientSecret: string }) {
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

  // Donor info is collected directly in PaymentForm and passed in billing_details.

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
          <PaymentAmountDisplay clientSecret={clientSecret} />
          <PaymentForm onSuccess={() => { /* Redirect handled by Stripe */ }} />
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
