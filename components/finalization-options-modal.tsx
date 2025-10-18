'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { QrCode, Mail, Info } from 'lucide-react'
import QRCodeComponent from 'react-qr-code'
import { createFinalizationToken } from '@/app/actions/finalization-token'
import toast from 'react-hot-toast'

export function FinalizationOptionsModal({ 
  isOpen, 
  onClose,
  transactionId,
  amount,
  taxDeduction
}: {
  isOpen: boolean
  onClose: () => void
  transactionId: string
  amount: number
  taxDeduction: number
}) {
  const [mode, setMode] = useState<'choice' | 'qr' | 'email'>('choice')
  const [email, setEmail] = useState('')
  const [finalizationUrl, setFinalizationUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleGenerateQR = async () => {
    setIsLoading(true)
    try {
      const result = await createFinalizationToken({ transactionId })
      if (result.success && result.url) {
        setFinalizationUrl(result.url)
        setMode('qr')
      } else {
        toast.error(result.error || 'Erreur génération QR')
      }
    } catch {
      toast.error('Erreur serveur')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendEmail = async () => {
    if (!email || !email.trim()) {
      toast.error('Veuillez saisir un email')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Email invalide')
      return
    }

    setIsLoading(true)
    try {
      const result = await createFinalizationToken({ transactionId, email })
      if (result.success) {
        toast.success('✉️ Email envoyé avec succès !', {
          duration: 4000,
          style: { background: '#10b981', color: 'white', fontWeight: 'bold' }
        })
        onClose()
      } else {
        toast.error(result.error || 'Erreur envoi email')
      }
    } catch {
      toast.error('Erreur serveur')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setMode('choice')
    setEmail('')
    setFinalizationUrl(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">Finalisation du reçu fiscal</DialogTitle>
        </DialogHeader>

        {mode === 'choice' && (
          <div className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <Info className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <p className="font-semibold text-green-900">Don de {amount}€</p>
                <p className="text-sm text-green-700">Déduction fiscale : {taxDeduction}€ (66%)</p>
              </AlertDescription>
            </Alert>

            <p className="text-sm text-gray-600">Le donateur doit finaliser ses coordonnées (nom, prénom, adresse) pour recevoir son reçu fiscal officiel.</p>

            <Button onClick={handleGenerateQR} className="w-full h-auto py-4 flex-col gap-2" size="lg" disabled={isLoading}>
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                <span className="font-semibold">Générer QR de finalisation</span>
              </div>
              <span className="text-xs font-normal opacity-90">Recommandé - Le donateur scanne avec son téléphone</span>
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Ou</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Envoyer le lien par email</Label>
              <div className="flex gap-2">
                <Input id="email" type="email" placeholder="jean.dupont@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Button onClick={handleSendEmail} disabled={isLoading || !email} size="icon">
                  <Mail className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Si le donateur ne peut pas scanner le QR</p>
            </div>
          </div>
        )}

        {mode === 'qr' && finalizationUrl && (
          <div className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-900">Présentez ce QR code au donateur pour qu&apos;il finalise ses coordonnées sur son téléphone</AlertDescription>
            </Alert>

            <div className="bg-white p-6 rounded-lg border-2 border-gray-200 flex justify-center">
              <QRCodeComponent value={finalizationUrl} size={240} level="M" />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium text-gray-900">⏱️ Validité : 48 heures</p>
              <p className="text-xs text-gray-600">Le donateur recevra son reçu fiscal par email après avoir complété le formulaire</p>
            </div>

            <Button onClick={handleClose} variant="outline" className="w-full">Fermer</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
