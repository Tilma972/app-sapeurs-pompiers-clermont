'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { cloturerTourneeAvecRetribution } from '@/app/actions/retribution'

interface ModalClotureProps {
  tourneeId: string
  trigger?: React.ReactNode
  onClose?: () => void
}

export function TourneeClotureModal({ tourneeId, trigger, onClose }: ModalClotureProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [calendriers, setCalendriers] = useState('')
  const [especes, setEspeces] = useState('')
  const [cheques, setCheques] = useState('')

  const calendriersNum = Number(calendriers) || 0
  const especesNum = Number(especes) || 0
  const chequesNum = Number(cheques) || 0
  const total = Math.max(0, especesNum + chequesNum)
  const montantAmicale = total * 0.7
  const montantPompier = total * 0.3
  // Accepter la clôture même sans vente (tournée infructueuse)
  const isValid = calendriersNum >= 0 && total >= 0

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen && onClose) {
      onClose()
    }
  }

  // Helper pour gérer les inputs numériques (remplace virgule par point)
  const handleNumberInput = (value: string, setter: (v: string) => void) => {
    // Remplacer virgule par point
    let val = value.replace(',', '.')
    // Garder uniquement chiffres et point
    val = val.replace(/[^0-9.]/g, '')
    // Éviter plusieurs points
    const parts = val.split('.')
    if (parts.length > 2) {
      val = parts[0] + '.' + parts.slice(1).join('')
    }
    setter(val)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Si aucune vente, demander confirmation
    if (calendriersNum === 0 && total === 0) {
      const confirm = window.confirm(
        '⚠️ Aucune vente enregistrée.\n\nVoulez-vous vraiment clôturer cette tournée sans calendriers ni montant ?'
      )
      if (!confirm) return
    }

    if (!isValid) return
    setIsSubmitting(true)
    const toastId = toast.loading('Clôture en cours...')

    try {
      const res = await cloturerTourneeAvecRetribution({
        tourneeId,
        calendriersVendus: calendriersNum,
        montantTotal: total,
      })

      if (!res?.ok) {
        toast.error(res?.error || 'Erreur lors de la clôture', { id: toastId, duration: 4000 })
        return
      }

      toast.success(`🎉 Tournée clôturée ! ${total > 0 ? 'Répartition effectuée.' : ''}`, { id: toastId, duration: 5000 })
      handleOpenChange(false)
      router.push('/calendriers')
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la clôture'
      toast.error(message, { id: toastId, duration: 4000 })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>🏁 Clôturer ma tournée</DialogTitle>
          <DialogDescription>Saisissez le bilan de votre collecte</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="calendriers">Calendriers vendus</Label>
              <Input
                id="calendriers"
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={calendriers}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '')
                  setCalendriers(val)
                }}
                required
              />
            </div>

            <div>
              <Label htmlFor="especes">Espèces (€)</Label>
              <Input
                id="especes"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={especes}
                onChange={(e) => handleNumberInput(e.target.value, setEspeces)}
                required
              />
            </div>

            <div>
              <Label htmlFor="cheques">Montant chèques (€)</Label>
              <Input
                id="cheques"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={cheques}
                onChange={(e) => handleNumberInput(e.target.value, setCheques)}
              />
            </div>
          </div>

          {total > 0 && (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between font-semibold">
                <span>Total collecté</span>
                <span>{total.toFixed(2)}€</span>
              </div>
              <div className="h-px bg-border my-2" />
              <div className="flex justify-between text-sm">
                <span>→ Amicale (70%)</span>
                <span>{montantAmicale.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span>→ Pompier (30%)</span>
                <span>{montantPompier.toFixed(2)}€</span>
              </div>
            </div>
          )}

          {total > 0 && (
            <div className="space-y-3">
              <div>
                <Label>Répartition de vos {montantPompier.toFixed(2)}€</Label>
                <p className="text-sm text-muted-foreground">
                  La part pompier (30%) sera répartie automatiquement entre votre compte et le pot d&apos;équipe
                  selon vos préférences et le minimum imposé par l&apos;équipe.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>Annuler</Button>
            <Button type="submit" disabled={!isValid || isSubmitting}>{isSubmitting ? 'Clôture en cours...' : 'Valider et clôturer'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
