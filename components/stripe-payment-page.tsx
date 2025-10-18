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

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
          // Provide country explicitly since address collection is disabled in the Payment Element
          payment_method_data: {
            billing_details: {
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

export function StripePaymentPage({ clientSecret, intentId }: { clientSecret: string; intentId?: string }) {
  const [mounted, setMounted] = useState(false)
  // Donor info step: only when we know intentId
  const [step, setStep] = useState<'info' | 'payment'>(intentId ? 'info' : 'payment')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | undefined>()

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

  const handleSaveDonorInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!intentId) {
      setStep('payment')
      return
    }
    if (!firstName || !lastName || !email) {
      setSaveError('Veuillez renseigner prénom, nom et email.')
      return
    }
    setSaving(true)
    setSaveError(undefined)
    try {
      const res = await fetch(`/api/donations/${intentId}/donor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Impossible d’enregistrer les informations du donateur.')
      }
      setStep('payment')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue lors de l’enregistrement.'
      setSaveError(msg)
    } finally {
      setSaving(false)
    }
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

        {step === 'info' ? (
          <form onSubmit={handleSaveDonorInfo} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="Jean"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="Dupont"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                placeholder="jean.dupont@example.com"
              />
            </div>
            {saveError && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">{saveError}</div>
            )}
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Continuer vers le paiement'
              )}
            </Button>
          </form>
        ) : (
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
        )}

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
