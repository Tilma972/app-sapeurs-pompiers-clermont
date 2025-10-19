'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cloturerTourneeAvecRetribution } from '@/app/actions/retribution'

interface ModalClotureProps {
  tourneeId: string
  equipe: {
    pourcentage_minimum_pot: number
    pourcentage_recommande_pot?: number
  }
  onClose: () => void
}

export function TourneeClotureModal({ tourneeId, equipe, onClose }: ModalClotureProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [calendriers, setCalendriers] = useState(0)
  const [especes, setEspeces] = useState(0)
  const [cheques, setCheques] = useState(0)

  const minPot = equipe.pourcentage_minimum_pot || 0
  const recommandePot = equipe.pourcentage_recommande_pot ?? Math.max(30, minPot)
  const [pctPot, setPctPot] = useState(recommandePot)

  const total = Math.max(0, (especes || 0) + (cheques || 0))
  const montantAmicale = total * 0.7
  const montantPompier = total * 0.3
  const versPot = montantPompier * (pctPot / 100)
  const versPerso = montantPompier - versPot

  const isValid = total > 0 && calendriers > 0 && pctPot >= minPot

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return
    setIsSubmitting(true)
    try {
      await cloturerTourneeAvecRetribution({
        tourneeId,
        calendriersVendus: calendriers,
        montantTotal: total,
        pourcentagePot: pctPot,
      })
      toast.success(`🎉 Tournée clôturée ! ${versPerso.toFixed(2)}€ ajoutés à votre compte`, { duration: 5000 })
      onClose()
      router.push('/dashboard/mon-compte')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la clôture'
      toast.error(message, { duration: 4000 })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
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
              <Separator />
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
            <div className="space-y-4">
              <div>
                <Label>Répartition de vos {montantPompier.toFixed(2)}€</Label>
                <p className="text-sm text-muted-foreground">Choisissez le pourcentage à mettre dans le pot d&apos;équipe</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Vers pot d&apos;équipe</span>
                  <Badge variant="secondary">{pctPot}%</Badge>
                </div>
                <input
                  type="range"
                  min={minPot}
                  max={100}
                  step={5}
                  value={pctPot}
                  onChange={(e) => setPctPot(Number(e.target.value))}
                  className="w-full"
                />
                {minPot > 0 && (
                  <p className="text-xs text-muted-foreground">⚠️ Minimum requis par l&apos;équipe : {minPot}%</p>
                )}
              </div>
              <div className="bg-accent p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span>🤝 Pot d&apos;équipe</span>
                  <span className="font-semibold text-lg">{versPot.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>💵 Mon compte</span>
                  <span className="font-semibold text-lg">{versPerso.toFixed(2)}€</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Annuler</Button>
            <Button type="submit" disabled={!isValid || isSubmitting}>{isSubmitting ? 'Clôture en cours...' : 'Valider et clôturer'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
