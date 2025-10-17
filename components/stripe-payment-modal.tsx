'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import QRCode from 'react-qr-code'
import { ExternalLink, Smartphone } from 'lucide-react'

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
  const [paymentUrl, setPaymentUrl] = useState<string>()

  useEffect(() => {
    setPaymentUrl(`${window.location.origin}/pay/${clientSecret}`)
  }, [clientSecret])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">QR Code de paiement</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Montant en évidence */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl text-center">
            <p className="text-sm text-gray-600 mb-1">Montant du don</p>
            <p className="text-4xl font-bold text-blue-900">{amount.toFixed(2)}€</p>
            <p className="text-xs text-gray-500 mt-2">
              Reçu par l&apos;association : {(amount - amount * 0.014 - 0.25).toFixed(2)}€
            </p>
          </div>

          {/* QR Code */}
          {paymentUrl && (
            <div className="bg-white p-6 rounded-xl border-2 border-gray-200 shadow-sm">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Smartphone className="h-5 w-5 text-blue-600" />
                <p className="font-medium text-gray-700">Présentez ce QR au donateur</p>
              </div>
              <QRCode value={paymentUrl} size={240} className="mx-auto" level="M" />
            </div>
          )}

          {/* Instructions */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-900">
              <span className="font-semibold">📱 Instructions :</span>
              <br />
              Le donateur scanne ce QR code avec son téléphone pour payer en toute autonomie.
            </p>
          </div>

          {/* Lien de secours (optionnel) */}
          {paymentUrl && (
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

          {/* Bouton fermer */}
          <Button onClick={onClose} variant="outline" className="w-full">
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
