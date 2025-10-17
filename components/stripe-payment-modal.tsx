'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { stripePromise } from '@/lib/stripe/client-side'
import { Button } from '@/components/ui/button'
import QRCode from 'react-qr-code'

function StripePaymentForm({ amount, onSuccess }: { amount: number; onSuccess: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setIsLoading(true)
    setError(undefined)

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/don/success`,
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 p-3 rounded-lg">
        <p className="text-sm font-medium text-blue-900">Montant : {amount.toFixed(2)}€</p>
        <p className="text-xs text-blue-700 mt-1">
          Frais : {(amount * 0.014 + 0.25).toFixed(2)}€ • Reçu : {(amount - amount * 0.014 - 0.25).toFixed(2)}€
        </p>
      </div>

      <PaymentElement />

      {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</div>}

      <Button type="submit" disabled={!stripe || isLoading} className="w-full">
        {isLoading ? 'Traitement...' : `Payer ${amount}€`}
      </Button>

      <p className="text-xs text-center text-gray-500">
        Paiement sécurisé par Stripe • Apple Pay et Google Pay disponibles
      </p>
    </form>
  )
}

export function StripePaymentModal({
  isOpen,
  onClose,
  clientSecret,
  amount,
}: {
  isOpen: boolean
  onClose: () => void
  clientSecret: string
  amount: number
}) {
  const [paymentUrl, setPaymentUrl] = useState<string | undefined>()

  useEffect(() => {
    setPaymentUrl(`${window.location.origin}/pay/${clientSecret}`)
  }, [clientSecret])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Paiement par carte</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {paymentUrl && (
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
              <p className="text-sm text-gray-600 mb-3 text-center">Scanner pour payer sur mobile</p>
              <QRCode value={paymentUrl} size={200} className="mx-auto" />
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Ou payer directement</span>
            </div>
          </div>

          <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
            <StripePaymentForm
              amount={amount}
              onSuccess={() => {
                onClose()
                window.location.reload()
              }}
            />
          </Elements>
        </div>
      </DialogContent>
    </Dialog>
  )
}
