'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DemandeDepotFonds, formatStatutDepot, getStatutDepotColor, calculerEcartDepot, formatEcartDepot } from '@/lib/types/depot-fonds'
import { annulerDemandeDepotAction } from '@/app/actions/depot-fonds'
import { useRouter } from 'next/navigation'

interface DemandesDepotListeProps {
  demandes: DemandeDepotFonds[]
}

export function DemandesDepotListe({ demandes }: DemandesDepotListeProps) {
  const router = useRouter()
  const [demandeAnnuler, setDemandeAnnuler] = useState<string | null>(null)
  const [isAnnulant, setIsAnnulant] = useState(false)

  const handleAnnuler = async (demandeId: string) => {
    setIsAnnulant(true)
    const toastId = toast.loading('Annulation en cours...')

    try {
      const result = await annulerDemandeDepotAction({ demande_id: demandeId })

      if (!result.ok) {
        toast.error(result.error || 'Erreur lors de l\'annulation', { id: toastId })
        return
      }

      toast.success('Demande annulée', { id: toastId })
      setDemandeAnnuler(null)
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur'
      toast.error(message, { id: toastId })
    } finally {
      setIsAnnulant(false)
    }
  }

  if (demandes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Demandes de dépôt</CardTitle>
          <CardDescription>Historique de vos demandes de dépôt de fonds</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Aucune demande de dépôt pour le moment
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Demandes de dépôt</CardTitle>
          <CardDescription>Historique de vos demandes de dépôt de fonds</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
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
                        {demande.statut === 'en_attente' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDemandeAnnuler(demande.id)}
                          >
                            Annuler
                          </Button>
                        )}
                        {demande.notes_tresorier && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              toast.info(demande.notes_tresorier || '', { duration: 5000 })
                            }}
                          >
                            Voir notes
                          </Button>
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

      {/* Dialog de confirmation d'annulation */}
      <Dialog open={!!demandeAnnuler} onOpenChange={(open) => !open && setDemandeAnnuler(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annuler la demande ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Vous pourrez créer une nouvelle demande si besoin.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDemandeAnnuler(null)}
              disabled={isAnnulant}
            >
              Non, garder
            </Button>
            <Button
              variant="destructive"
              onClick={() => demandeAnnuler && handleAnnuler(demandeAnnuler)}
              disabled={isAnnulant}
            >
              {isAnnulant ? 'Annulation...' : 'Oui, annuler'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
