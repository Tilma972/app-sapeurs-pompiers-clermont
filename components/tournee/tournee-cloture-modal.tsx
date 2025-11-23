'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
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

  const [calendriers, setCalendriers] = useState(0)
  const [especes, setEspeces] = useState(0)
  const [cheques, setCheques] = useState(0)

  const total = Math.max(0, (especes || 0) + (cheques || 0))
  const montantAmicale = total * 0.7
  const montantPompier = total * 0.3
  // Accepter la clôture même sans vente (tournée infructueuse)
  const isValid = calendriers >= 0 && total >= 0

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen && onClose) {
      onClose()
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Si aucune vente, demander confirmation
    if (calendriers === 0 && total === 0) {
      const confirm = window.confirm(
        '⚠️ Aucune vente enregistrée.\n\nVoulez-vous vraiment clôturer cette tournée sans calendriers ni montant ?'
      )
      if (!confirm) return
    }

    if (!isValid) return
    setIsSubmitting(true)
    try {
      const res = await cloturerTourneeAvecRetribution({
        tourneeId,
        calendriersVendus: calendriers,
        montantTotal: total,
      })
      if (!res?.ok) {
        toast.error(res?.error || 'Erreur lors de la clôture', { duration: 4000 })
        return
      }
      toast.success(`🎉 Tournée clôturée ! ${total > 0 ? 'Répartition effectuée selon vos préférences.' : ''}`, { duration: 5000 })
      handleOpenChange(false)
      router.push('/calendriers')
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la clôture'
      toast.error(message, { duration: 4000 })
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
              <Input id="calendriers" type="number" min={0} value={calendriers} onChange={(e) => setCalendriers(Number(e.target.value))} required />
            </div>

            <div>
              <Label htmlFor="especes">Espèces (€)</Label>
              <Input id="especes" type="number" step="0.01" min={0} value={especes} onChange={(e) => setEspeces(Number(e.target.value))} required />
            </div>

            <div>
              <Label htmlFor="cheques">Montant chèques (€)</Label>
              <Input id="cheques" type="number" step="0.01" min={0} value={cheques} onChange={(e) => setCheques(Number(e.target.value))} />
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
