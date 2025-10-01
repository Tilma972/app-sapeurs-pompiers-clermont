'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Euro, User, Mail } from 'lucide-react'
import { createHelloAssoCheckout } from '@/app/actions/helloasso-checkout'

interface DonorFormProps {
  intentId: string
  expectedAmount?: number
  donorNameHint?: string | null
}

const quickAmounts = [10, 20, 50, 100]

export function DonorForm({ intentId, expectedAmount, donorNameHint }: DonorFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    amount: (expectedAmount ?? 0) > 0 ? String(expectedAmount) : '',
    firstName: '',
    lastName: donorNameHint ? donorNameHint.split(' ')[0] || '' : '',
    email: '',
    fiscalReceipt: false,
  })

  const handleAmountSelect = (amount: number) => {
    setFormData(prev => ({ ...prev, amount: amount.toString() }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const result = await createHelloAssoCheckout({
        intentId,
        amount: parseFloat(formData.amount),
        donor: { firstName: formData.firstName, lastName: formData.lastName, email: formData.email },
        fiscalReceipt: formData.fiscalReceipt,
      })
      if (result.success && result.checkoutUrl) {
        window.location.href = result.checkoutUrl
      } else {
        alert(result.error || 'Erreur lors de la création du paiement')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Une erreur est survenue')
      setIsLoading(false)
    }
  }

  const amountNumber = parseFloat(formData.amount) || 0
  const isFormValid = amountNumber > 0 && formData.firstName && formData.lastName && formData.email

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        <Label className="text-sm font-medium">Montant du don</Label>
        <div className="grid grid-cols-2 gap-2">
          {quickAmounts.map((amount) => (
            <Button key={amount} type="button" variant={formData.amount === amount.toString() ? 'default' : 'outline'} onClick={() => handleAmountSelect(amount)} className="h-12">
              {amount}€
            </Button>
          ))}
        </div>
        <div className="relative">
          <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input type="number" value={formData.amount} onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))} placeholder="Montant personnalisé" className="pl-10" min="1" step="0.5" />
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium">Vos informations</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input type="text" value={formData.firstName} onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))} placeholder="Prénom" className="pl-10" required />
          </div>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input type="text" value={formData.lastName} onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))} placeholder="Nom" className="pl-10" required />
          </div>
        </div>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} placeholder="Email" className="pl-10" required />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-start space-x-2">
          <Checkbox id="fiscalReceipt" checked={formData.fiscalReceipt} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, fiscalReceipt: checked as boolean }))} />
          <div className="space-y-1">
            <label htmlFor="fiscalReceipt" className="text-sm font-medium cursor-pointer">Je souhaite un reçu fiscal</label>
            <p className="text-xs text-gray-500">
              {formData.fiscalReceipt && amountNumber > 0 && (
                <>Déduction d&apos;impôt : {Math.round(amountNumber * 0.66 * 100) / 100}€</>
              )}
            </p>
          </div>
        </div>
      </div>

      {amountNumber > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex justify-between items-center">
            <span className="font-medium">Don : {amountNumber}€</span>
            {formData.fiscalReceipt && <span className="text-sm text-blue-600">Coût réel : {Math.round((amountNumber * 0.34) * 100) / 100}€</span>}
          </div>
        </div>
      )}

      <Button type="submit" disabled={!isFormValid || isLoading} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg">
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            Redirection...
          </>
        ) : (
          `Donner ${amountNumber}€`
        )}
      </Button>
      <p className="text-xs text-center text-gray-500">Vous serez redirigé vers HelloAsso pour finaliser le paiement sécurisé</p>
    </form>
  )
}
