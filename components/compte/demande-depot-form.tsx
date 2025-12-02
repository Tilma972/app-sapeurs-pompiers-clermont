'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { creerDemandeDepotAction } from '@/app/actions/depot-fonds'

interface DemandeDepotFormProps {
  montantDisponible: number
}

export function DemandeDepotForm({ montantDisponible }: DemandeDepotFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [montant, setMontant] = useState('')
  const [disponibilites, setDisponibilites] = useState('')
  const [notes, setNotes] = useState('')

  const montantNum = Number(montant) || 0
  const isValid = montantNum > 0 && montantNum <= montantDisponible

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isValid) {
      toast.error('Veuillez saisir un montant valide')
      return
    }

    setIsSubmitting(true)
    const toastId = toast.loading('Création de la demande...')

    try {
      const result = await creerDemandeDepotAction({
        montant_a_deposer: montantNum,
        disponibilites_proposees: disponibilites.trim() || undefined,
        notes_utilisateur: notes.trim() || undefined,
      })

      if (!result.ok) {
        toast.error(result.error || 'Erreur lors de la création', { id: toastId })
        return
      }

      toast.success('✅ Demande de dépôt créée ! Le trésorier a été notifié.', { id: toastId, duration: 5000 })

      // Rediriger vers la page mon compte
      setTimeout(() => {
        router.push('/mon-compte')
        router.refresh()
      }, 500)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la création'
      toast.error(message, { id: toastId })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMontantChange = (value: string) => {
    // Remplacer virgule par point
    let val = value.replace(',', '.')
    // Garder uniquement chiffres et point
    val = val.replace(/[^0-9.]/g, '')
    // Éviter plusieurs points
    const parts = val.split('.')
    if (parts.length > 2) {
      val = parts[0] + '.' + parts.slice(1).join('')
    }
    setMontant(val)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🏦 Demander un dépôt de fonds</CardTitle>
        <CardDescription>
          Organisez un rendez-vous avec le trésorier pour déposer les fonds collectés lors de vos tournées
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Montant disponible */}
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Montant non déposé</span>
              <span className="text-2xl font-bold">{montantDisponible.toFixed(2)}€</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total collecté lors de vos tournées non encore déposé
            </p>
          </div>

          {/* Montant à déposer */}
          <div className="space-y-2">
            <Label htmlFor="montant">Montant à déposer (€) *</Label>
            <Input
              id="montant"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={montant}
              onChange={(e) => handleMontantChange(e.target.value)}
              required
              disabled={montantDisponible <= 0}
            />
            {montantNum > montantDisponible && (
              <p className="text-sm text-destructive">
                Le montant ne peut pas dépasser {montantDisponible.toFixed(2)}€
              </p>
            )}
            {montantDisponible <= 0 && (
              <p className="text-sm text-muted-foreground">
                Vous n&apos;avez pas de fonds à déposer pour le moment
              </p>
            )}
          </div>

          {/* Disponibilités */}
          <div className="space-y-2">
            <Label htmlFor="disponibilites">Vos disponibilités</Label>
            <Textarea
              id="disponibilites"
              placeholder="Ex: Lundi 14h-17h, Mardi 9h-12h, Mercredi après 18h"
              value={disponibilites}
              onChange={(e) => setDisponibilites(e.target.value)}
              rows={3}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Indiquez vos créneaux de disponibilité pour organiser le rendez-vous
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes complémentaires (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Informations complémentaires..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              disabled={isSubmitting}
            />
          </div>

          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              💡 <strong>Le trésorier sera notifié par email</strong> de votre demande et vous contactera pour organiser le rendez-vous.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={!isValid || isSubmitting || montantDisponible <= 0}
          >
            {isSubmitting ? 'Envoi...' : 'Envoyer la demande'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
