// components/qr-code-modal.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
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
  const toastedRef = useRef(false)

  // Timer expiration
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

  // Realtime subscription avec logs
  useEffect(() => {
    if (!isOpen) {
      console.log('🔴 [QRCodeModal] Modal fermé, pas de subscription')
      return
    }
    
    console.log('🔵 [QRCodeModal] Setup realtime for intentId:', intentId)
    
    const supabase = createClient()
    const channel = supabase
      .channel(`donation_intent_${intentId}`)
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'donation_intents', 
          filter: `id=eq.${intentId}` 
        },
        (payload) => {
          console.log('🟢 [QRCodeModal] Realtime UPDATE reçu:', payload)
          
          const updated = payload.new as { 
            status?: string
            final_amount?: number | string
            donor_first_name?: string | null
            donor_last_name?: string | null
            donor_name_hint?: string | null
          }
          
          console.log('🟢 [QRCodeModal] Données parsed:', updated)
          
          if (updated?.status === 'completed') {
            console.log('✅ [QRCodeModal] Status = completed')
            setStatus('completed')
            
            // Convertir numeric/decimal (souvent string) en number
            const parsedAmount = typeof updated.final_amount === 'number'
              ? updated.final_amount
              : typeof updated.final_amount === 'string'
                ? parseFloat(updated.final_amount)
                : null

            if (parsedAmount != null && !Number.isNaN(parsedAmount)) {
              console.log('💰 [QRCodeModal] Montant reçu:', parsedAmount)
              setDonationAmount(parsedAmount)

              if (!toastedRef.current) {
                const generous = parsedAmount >= 20
                // Construire le nom du donateur
                const donorName = updated.donor_first_name
                  ? `${updated.donor_first_name} ${updated.donor_last_name || ''}`.trim()
                  : updated.donor_name_hint || 'Un donateur'
                console.log('🎉 [QRCodeModal] Lancement toast:', { generous, amount: parsedAmount, donorName })
                toast.success(
                  generous ? `🎉 Don généreux de ${donorName} : ${parsedAmount}€` : `✅ Don de ${donorName} : ${parsedAmount}€`,
                  { icon: generous ? '🎉' : '✅', duration: 7000 }
                )
                toastedRef.current = true
              }
            } else {
              console.warn('⚠️ [QRCodeModal] final_amount absent ou invalide:', updated.final_amount)
            }
          }
        }
      )
      .subscribe((status, err) => {
        console.log('🔵 [QRCodeModal] Channel status:', status)
        if (err) {
          console.error('❌ [QRCodeModal] Channel error:', err)
        }
      })
    
    return () => {
      console.log('🔴 [QRCodeModal] Cleanup realtime channel')
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
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
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
              <p className="text-sm text-muted-foreground mb-4">
                Le donateur scanne ce QR code et paie sur HelloAsso
              </p>
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
                <QRCode value={donationUrl} size={200} level="M" />
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-blue-800">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Expire dans : {formatTime(timeLeft)}</span>
                </div>
              </div>
            </div>
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
                {donationAmount && (
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    {donationAmount.toFixed(2)}€
                  </p>
                )}
                <p className="text-sm text-gray-600 mt-1">Le don a été confirmé</p>
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