'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
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
    try {
      const res = await cloturerTourneeAvecRetribution({
        tourneeId,
        calendriersVendus: totalCalendriers,  // Total incluant carte bleue
        montantTotal: total,                   // Total incluant carte bleue
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
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">
              Chargement des transactions...
            </div>
          ) : (
            <>
              {/* Afficher les transactions carte bleue en lecture seule */}
              {(calendriersCarteBleue > 0 || montantCarteBleue > 0) && (
                <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">
                    💳 Paiements par carte bleue (QR code)
                  </p>
                  <div className="flex justify-between text-sm text-blue-700 dark:text-blue-300">
                    <span>{calendriersCarteBleue} calendrier{calendriersCarteBleue > 1 ? 's' : ''}</span>
                    <span>{montantCarteBleue.toFixed(2)}€</span>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <Label htmlFor="calendriers">Calendriers vendus (espèces/chèques)</Label>
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
                  {calendriersCarteBleue > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Total avec carte bleue : {totalCalendriers} calendriers
                    </p>
                  )}
                </div>

            <div>
              <Label htmlFor="especes">Espèces (€)</Label>
              <Input
                id="especes"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={especes}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, '')
                  setEspeces(val)
                }}
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
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.]/g, '')
                      setCheques(val)
                    }}
                  />
                  {montantCarteBleue > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Total avec carte bleue : {total.toFixed(2)}€
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

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
