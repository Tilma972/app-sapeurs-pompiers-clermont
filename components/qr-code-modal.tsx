'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import QRCode from 'react-qr-code'
import { Check, Clock, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface QRCodeModalProps {
  isOpen: boolean
  onClose: () => void
  intentId: string
  donationUrl: string
  expiresAt: string
}

export function QRCodeModal({ isOpen, onClose, intentId, donationUrl, expiresAt }: QRCodeModalProps) {
  const [status, setStatus] = useState<'waiting' | 'completed' | 'expired'>('waiting')
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [donationAmount, setDonationAmount] = useState<number | null>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime()
      const expiry = new Date(expiresAt).getTime()
      const diff = expiry - now
      if (diff <= 0) {
        setStatus('expired')
        setTimeLeft(0)
      } else {
        setTimeLeft(Math.floor(diff / 1000))
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])

  useEffect(() => {
    if (!isOpen) return
    const supabase = createClient()
    const channel = supabase
      .channel('donation_intents')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'donation_intents', filter: `id=eq.${intentId}` },
        (payload) => {
          const updated = (payload as unknown as { new?: { status?: string; final_amount?: number } })?.new
          if (updated?.status === 'completed') {
            setStatus('completed')
            if (typeof updated.final_amount === 'number') {
              setDonationAmount(updated.final_amount)
              const generous = updated.final_amount >= 20
              toast.success(generous ? `Don généreux reçu : ${updated.final_amount}€` : `Don reçu : ${updated.final_amount}€`, {
                icon: generous ? '🎉' : '✅',
                duration: 5000,
              })
            }
          }
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [isOpen, intentId])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleClose = () => {
    if (status === 'completed') {
      window.location.reload()
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {status === 'waiting' && 'En attente du paiement'}
            {status === 'completed' && 'Paiement réussi !'}
            {status === 'expired' && 'QR Code expiré'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {status === 'waiting' && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">Le donateur scanne ce QR code et choisit son montant</p>
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
                <QRCode value={donationUrl} size={200} level="M" />
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-blue-800">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Expire dans : {formatTime(timeLeft)}</span>
                </div>
                <p className="text-xs text-blue-600 mt-2">Le donateur choisira le montant en toute intimité</p>
              </div>
            </div>
          )}

          {status === 'completed' && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-800">{donationAmount && donationAmount >= 20 ? '🎉 Don généreux reçu !' : 'Paiement reçu !'}</h3>
                {donationAmount && (
                  <p className="text-2xl font-bold text-green-600 mt-2">{donationAmount.toFixed(2)}€</p>
                )}
                <p className="text-sm text-gray-600 mt-1">Le don a été confirmé par HelloAsso</p>
              </div>
            </div>
          )}

          {status === 'expired' && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <X className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-800">QR Code expiré</h3>
                <p className="text-sm text-gray-600">Veuillez générer un nouveau QR code</p>
              </div>
            </div>
          )}

          <div className="flex justify-center gap-2">
            <Button onClick={handleClose} variant={status === 'completed' ? 'default' : 'outline'}>
              {status === 'completed' ? 'Parfait !' : 'Fermer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
