'use client'

import { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import QRCode from 'react-qr-code'
import { ExternalLink, Smartphone, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export function StripePaymentModal({
  isOpen,
  onClose,
  clientSecret,
  amount,
  intentId,
}: {
  isOpen: boolean
  onClose: () => void
  clientSecret: string
  amount: number
  intentId?: string
}) {
  const [paymentUrl, setPaymentUrl] = useState<string>()
  const [status, setStatus] = useState<'waiting' | 'completed'>('waiting')
  const [donationAmount, setDonationAmount] = useState<number | null>(null)
  const [donorDisplayName, setDonorDisplayName] = useState<string | null>(null)
  const toastedRef = useRef(false)

  useEffect(() => {
    setPaymentUrl(`${window.location.origin}/pay/${clientSecret}`)
  }, [clientSecret])

  // Realtime listener on donation_intents updates
  useEffect(() => {
    if (!isOpen || !intentId) return
    const supabase = createClient()
    const channel = supabase
      .channel(`donation_intent_stripe_${intentId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'donation_intents', filter: `id=eq.${intentId}` },
        (payload) => {
          const updated = payload.new as {
            status?: string
            final_amount?: number | string
            donor_first_name?: string
            donor_last_name?: string
            donor_name_hint?: string
          }
          if (updated?.status === 'completed') {
            setStatus('completed')
            const parsedAmount =
              typeof updated.final_amount === 'number'
                ? updated.final_amount
                : typeof updated.final_amount === 'string'
                ? parseFloat(updated.final_amount)
                : null

            const donorName = updated.donor_first_name
              ? `${updated.donor_first_name} ${updated.donor_last_name || ''}`.trim()
              : updated.donor_name_hint || 'Un donateur'

            setDonorDisplayName(donorName)
            if (parsedAmount != null && !Number.isNaN(parsedAmount)) {
              setDonationAmount(parsedAmount)
              if (!toastedRef.current) {
                const generous = parsedAmount >= 20
                toast.success(
                  generous
                    ? `🎉 Don généreux de ${donorName} : ${parsedAmount}€`
                    : `✅ Don de ${donorName} : ${parsedAmount}€`,
                  {
                    icon: generous ? '🎉' : '✅',
                    duration: 7000,
                    style: {
                      background: generous ? '#10b981' : '#3b82f6',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '16px',
                    },
                  }
                )
                toastedRef.current = true
                setTimeout(() => {
                  window.location.reload()
                }, 3000)
              }
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isOpen, intentId])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {status === 'waiting' ? 'QR Code de paiement' : 'Paiement réussi !'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {status === 'waiting' && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl text-center">
              <p className="text-sm text-gray-600 mb-1">Montant du don</p>
              <p className="text-4xl font-bold text-blue-900">{amount.toFixed(2)}€</p>
              <p className="text-xs text-gray-500 mt-2">
                Reçu par l&apos;association : {(amount - amount * 0.014 - 0.25).toFixed(2)}€
              </p>
            </div>
          )}

          {/* QR Code */}
          {status === 'waiting' && paymentUrl && (
            <div className="bg-white p-6 rounded-xl border-2 border-gray-200 shadow-sm">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Smartphone className="h-5 w-5 text-blue-600" />
                <p className="font-medium text-gray-700">Présentez ce QR au donateur</p>
              </div>
              <QRCode value={paymentUrl} size={240} className="mx-auto" level="M" />
            </div>
          )}

          {/* Instructions */}
          {status === 'waiting' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-900">
              <span className="font-semibold">📱 Instructions :</span>
              <br />
              Le donateur scanne ce QR code avec son téléphone pour payer en toute autonomie.
            </p>
          </div>
          )}

          {/* Lien de secours (optionnel) */}
          {status === 'waiting' && paymentUrl && (
            <details className="text-center">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                Lien de paiement (si scan impossible)
              </summary>
              <a
                href={paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="h-3 w-3" />
                Ouvrir dans un nouvel onglet
              </a>
            </details>
          )}

          {status === 'completed' && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-800">
                  {donationAmount && donationAmount >= 20 ? '🎉 Don généreux reçu !' : 'Paiement reçu !'}
                </h3>
                {donorDisplayName && (
                  <p className="text-lg font-medium text-gray-700 mt-1">Par {donorDisplayName}</p>
                )}
                {donationAmount && (
                  <p className="text-2xl font-bold text-green-600 mt-2">{donationAmount.toFixed(2)}€</p>
                )}
                <p className="text-sm text-gray-600 mt-1">Le don a été confirmé</p>
              </div>
            </div>
          )}

          {/* Bouton fermer */}
          <Button onClick={onClose} variant={status === 'completed' ? 'default' : 'outline'} className="w-full">
            {status === 'completed' ? 'Parfait !' : 'Fermer'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
