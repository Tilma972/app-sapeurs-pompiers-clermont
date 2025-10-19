'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import { completeDonation } from '@/app/actions/complete-donation'
import toast from 'react-hot-toast'

type DonorCompletionFormProps = { token: string; transaction: { id: string; amount: number; supporter_email?: string | null } }
export function DonorCompletionForm({ token, transaction }: DonorCompletionFormProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: transaction.supporter_email || '',
    addressLine1: '',
    postalCode: '',
    city: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const deduction = Math.round((transaction.amount || 0) * 0.66)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validations côté client
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.postalCode || !formData.city) {
      toast.error('Veuillez remplir tous les champs requis')
      return
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    if (!emailOk) {
      toast.error("Email invalide. Exemple: jean.dupont@email.com")
      return
    }
    const postalOk = /^\d{5}$/.test(formData.postalCode.trim())
    if (!postalOk) {
      toast.error("Code postal invalide (format attendu: 5 chiffres)")
      return
    }

    setIsSubmitting(true)

    const result = await completeDonation({
      token,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      addressLine1: formData.addressLine1,
      postalCode: formData.postalCode,
      city: formData.city,
    })

    if (result.success) {
      toast.success('Merci, votre reçu va vous être envoyé par email')
      window.location.href = '/don-finalise'
    } else {
      toast.error(result.error || 'Erreur')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-xl p-6">
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">🚒</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Finalisez votre don</h1>
        <p className="text-gray-600">Pour recevoir votre reçu fiscal</p>
      </div>

      <Alert className="bg-green-50 border-green-200 mb-6">
        <div>
          <p className="font-semibold text-green-900">💰 Montant de votre don : {transaction.amount}€</p>
          <p className="text-sm text-green-700 mt-1">Déduction d&apos;impôt : {deduction}€ (66%)</p>
        </div>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">Prénom *</Label>
            <Input id="firstName" required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} placeholder="Jean" />
          </div>
          <div>
            <Label htmlFor="lastName">Nom *</Label>
            <Input id="lastName" required value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} placeholder="Dupont" />
          </div>
        </div>
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input id="email" type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="jean.dupont@example.com" />
        </div>
        <div>
          <Label htmlFor="addressLine1">Adresse (ligne 1)</Label>
          <Input id="addressLine1" value={formData.addressLine1} onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })} placeholder="12 rue Exemple" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="postalCode">Code postal *</Label>
            <Input id="postalCode" required value={formData.postalCode} onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })} placeholder="75001" />
          </div>
          <div>
            <Label htmlFor="city">Ville *</Label>
            <Input id="city" required value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="Paris" />
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting} aria-busy={isSubmitting} aria-live="polite">
          {isSubmitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Envoi en cours...</>) : 'Recevoir mon reçu fiscal'}
        </Button>
      </form>
      <p className="text-xs text-gray-500 text-center mt-6">En finalisant, vous confirmez l’exactitude de vos informations. Besoin d’aide ? Contactez l’association si nécessaire.</p>
    </div>
  )
}
