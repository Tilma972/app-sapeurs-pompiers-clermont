'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { cloturerTourneeAvecRetribution } from '@/app/actions/retribution'
import { createClient } from '@/lib/supabase/client'

interface ModalClotureProps {
  tourneeId: string
  trigger?: React.ReactNode
  onClose?: () => void
}

export function TourneeClotureModal({ tourneeId, trigger, onClose }: ModalClotureProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Stats des transactions carte bleue (en lecture seule)
  const [calendriersCarteBleue, setCalendriersCarteBleue] = useState(0)
  const [montantCarteBleue, setMontantCarteBleue] = useState(0)

  const [calendriers, setCalendriers] = useState('')
  const [especes, setEspeces] = useState('')
  const [cheques, setCheques] = useState('')

  const calendriersNum = Number(calendriers) || 0
  const especesNum = Number(especes) || 0
  const chequesNum = Number(cheques) || 0

  // TOTAL = Carte bleue + Espèces + Chèques
  const totalCalendriers = calendriersCarteBleue + calendriersNum
  const total = Math.max(0, montantCarteBleue + especesNum + chequesNum)
  const montantAmicale = total * 0.7
  const montantPompier = total * 0.3
  // Accepter la clôture même sans vente (tournée infructueuse)
  const isValid = totalCalendriers >= 0 && total >= 0

  // Récupérer les transactions carte bleue au chargement du modal
  useEffect(() => {
    if (!open) return

    async function fetchTransactionsCarte() {
      setIsLoading(true)
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('tournee_summary')
          .select('calendars_distributed, montant_total')
          .eq('tournee_id', tourneeId)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Erreur récupération transactions carte:', error)
        }

        setCalendriersCarteBleue(data?.calendars_distributed || 0)
        setMontantCarteBleue(data?.montant_total || 0)
      } catch (err) {
        console.error('Erreur:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransactionsCarte()
  }, [open, tourneeId])

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
    if (totalCalendriers === 0 && total === 0) {
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
        calendriersVendus: totalCalendriers,  // Total incluant carte bleue
        montantTotal: total,                   // Total incluant carte bleue
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
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>🏁 Clôturer ma tournée</DialogTitle>
          <DialogDescription>Saisissez le bilan de votre collecte</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-6 pr-1">
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground text-sm">Chargement...</div>
          ) : (
            <div className="space-y-4">
              {/* Afficher les transactions carte bleue si présentes */}
              {(calendriersCarteBleue > 0 || montantCarteBleue > 0) && (
                <div className="bg-blue-50 dark:bg-blue-950/30 p-2.5 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-900 dark:text-blue-100 font-medium">💳 Carte bleue</span>
                    <span className="text-blue-700 dark:text-blue-300">{calendriersCarteBleue} cal. · {montantCarteBleue.toFixed(2)}€</span>
                  </div>
                </div>
              )}

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

              <div className="grid grid-cols-2 gap-2">
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
            </div>
          )}

          {total > 0 && (
            <div className="bg-muted p-3 rounded-lg space-y-1.5">
              <div className="flex justify-between font-semibold text-sm">
                <span>Total collecté</span>
                <span>{total.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Amicale (70%)</span>
                <span>{montantAmicale.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between text-xs font-medium">
                <span>Vous (30%)</span>
                <span>{montantPompier.toFixed(2)}€</span>
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                Réparti selon vos préférences pot/perso
              </p>
            </div>
          )}

          {total > 0 && (
            <div className="space-y-2">
              <Label className="text-sm">Répartition de vos {montantPompier.toFixed(2)}€</Label>
              <p className="text-xs text-muted-foreground">Répartition automatique selon vos préférences et le minimum d&apos;équipe.</p>
            </div>
          )}

          <DialogFooter className="flex-shrink-0 gap-2 pt-4 pb-safe sticky bottom-0 bg-background border-t mt-6">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>Annuler</Button>
            <Button type="submit" disabled={!isValid || isSubmitting}>{isSubmitting ? 'Clôture...' : 'Clôturer'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
