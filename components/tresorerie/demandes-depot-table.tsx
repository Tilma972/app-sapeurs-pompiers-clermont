'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DemandeDepotFondsAvecProfile,
  formatStatutDepot,
  getStatutDepotColor,
  calculerEcartDepot,
  formatEcartDepot,
} from '@/lib/types/depot-fonds'
import { validerDemandeDepotAction } from '@/app/actions/depot-fonds'

interface DemandesDepotTableProps {
  demandes: DemandeDepotFondsAvecProfile[]
}

export function DemandesDepotTable({ demandes }: DemandesDepotTableProps) {
  const router = useRouter()
  const [demandeEnCours, setDemandeEnCours] = useState<DemandeDepotFondsAvecProfile | null>(null)
  const [montantRecu, setMontantRecu] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleOpenValidation = (demande: DemandeDepotFondsAvecProfile) => {
    setDemandeEnCours(demande)
    setMontantRecu(demande.montant_a_deposer.toFixed(2))
    setNotes('')
  }

  const handleCloseDialog = () => {
    setDemandeEnCours(null)
    setMontantRecu('')
    setNotes('')
  }

  const handleValider = async () => {
    if (!demandeEnCours) return

    const montantRecuNum = Number(montantRecu)
    if (isNaN(montantRecuNum) || montantRecuNum < 0) {
      toast.error('Montant invalide')
      return
    }

    setIsSubmitting(true)
    const toastId = toast.loading('Validation en cours...')

    try {
      const result = await validerDemandeDepotAction({
        demande_id: demandeEnCours.id,
        montant_recu: montantRecuNum,
        notes_tresorier: notes.trim() || undefined,
      })

      if (!result.ok) {
        toast.error(result.error || 'Erreur lors de la validation', { id: toastId })
        return
      }

      const ecart = montantRecuNum - demandeEnCours.montant_a_deposer
      const hasEcart = Math.abs(ecart) >= 0.01

      toast.success(
        hasEcart ? `⚠️ Validé avec écart de ${formatEcartDepot(ecart)}` : '✅ Dépôt validé',
        { id: toastId, duration: 5000 }
      )

      handleCloseDialog()
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur'
      toast.error(message, { id: toastId })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMontantChange = (value: string) => {
    let val = value.replace(',', '.')
    val = val.replace(/[^0-9.]/g, '')
    const parts = val.split('.')
    if (parts.length > 2) {
      val = parts[0] + '.' + parts.slice(1).join('')
    }
    setMontantRecu(val)
  }

  if (demandes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Demandes de dépôt</CardTitle>
          <CardDescription>Aucune demande pour le moment</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Demandes de dépôt de fonds</CardTitle>
          <CardDescription>
            Validation des fonds collectés remis par les sapeurs-pompiers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sapeur-pompier</TableHead>
                  <TableHead>Équipe</TableHead>
                  <TableHead>Date demande</TableHead>
                  <TableHead>Montant déclaré</TableHead>
                  <TableHead>Montant reçu</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {demandes.map((demande) => {
                  const ecart = calculerEcartDepot(demande.montant_a_deposer, demande.montant_recu)
                  return (
                    <TableRow key={demande.id}>
                      <TableCell className="font-medium">
                        {demande.profiles?.full_name || 'Inconnu'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {demande.profiles?.team || '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(demande.created_at), 'dd/MM/yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {demande.montant_a_deposer.toFixed(2)}€
                      </TableCell>
                      <TableCell>
                        {demande.montant_recu !== null ? (
                          <div>
                            <div>{demande.montant_recu.toFixed(2)}€</div>
                            {ecart !== null && Math.abs(ecart) >= 0.01 && (
                              <div className={`text-xs ${ecart > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatEcartDepot(ecart)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatutDepotColor(demande.statut)}>
                          {formatStatutDepot(demande.statut)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {demande.statut === 'en_attente' ? (
                          <Button
                            size="sm"
                            onClick={() => handleOpenValidation(demande)}
                          >
                            Valider
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {demande.valide_le && format(new Date(demande.valide_le), 'dd/MM/yy', { locale: fr })}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de validation */}
      <Dialog open={!!demandeEnCours} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Valider le dépôt de fonds</DialogTitle>
            <DialogDescription>
              Confirmez la réception des fonds de {demandeEnCours?.profiles?.full_name}
            </DialogDescription>
          </DialogHeader>

          {demandeEnCours && (
            <div className="space-y-4">
              {/* Infos demande */}
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sapeur-pompier:</span>
                  <span className="font-medium">{demandeEnCours.profiles?.full_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Montant déclaré:</span>
                  <span className="font-bold text-lg">{demandeEnCours.montant_a_deposer.toFixed(2)}€</span>
                </div>
                {demandeEnCours.disponibilites_proposees && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Disponibilités:</span>
                    <p className="mt-1 whitespace-pre-wrap">{demandeEnCours.disponibilites_proposees}</p>
                  </div>
                )}
                {demandeEnCours.notes_utilisateur && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Notes:</span>
                    <p className="mt-1">{demandeEnCours.notes_utilisateur}</p>
                  </div>
                )}
              </div>

              {/* Montant reçu */}
              <div className="space-y-2">
                <Label htmlFor="montant_recu">Montant reçu (€) *</Label>
                <Input
                  id="montant_recu"
                  type="text"
                  inputMode="decimal"
                  value={montantRecu}
                  onChange={(e) => handleMontantChange(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
                {Number(montantRecu) !== demandeEnCours.montant_a_deposer && Number(montantRecu) > 0 && (
                  <p className="text-sm text-orange-600">
                    ⚠️ Écart de {formatEcartDepot(Number(montantRecu) - demandeEnCours.montant_a_deposer)} détecté
                  </p>
                )}
              </div>

              {/* Notes trésorier */}
              <div className="space-y-2">
                <Label htmlFor="notes_tresorier">Notes (optionnel)</Label>
                <Textarea
                  id="notes_tresorier"
                  placeholder="Informations complémentaires, explications sur un éventuel écart..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleValider}
              disabled={isSubmitting || !montantRecu || Number(montantRecu) < 0}
            >
              {isSubmitting ? 'Validation...' : 'Confirmer la réception'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
