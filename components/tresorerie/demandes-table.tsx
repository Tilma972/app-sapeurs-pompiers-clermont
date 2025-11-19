'use client'

/**
 * Tableau de gestion des demandes de versement pour le trésorier
 * Permet de valider, rejeter ou marquer comme payées les demandes
 */

import { useState } from 'react'
import { DemandeVersementAvecUtilisateur, getStatutLabel, getTypeVersementLabel, getStatutBadgeVariant, masquerIBAN, canValidateDemande, canMarkAsPaid, canRejectDemande } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDateLong } from "@/lib/formatters"
import { CheckCircle, XCircle, DollarSign, Eye, Loader2 } from "lucide-react"
import { validerDemandeAction, marquerPayeeAction, rejeterDemandeAction } from "@/app/actions/versement"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface DemandesTresorerieTableProps {
  demandes: DemandeVersementAvecUtilisateur[]
  showActions?: boolean
}

export function DemandesTresorerieTable({ demandes, showActions = true }: DemandesTresorerieTableProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectDemandeId, setRejectDemandeId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedDemande, setSelectedDemande] = useState<DemandeVersementAvecUtilisateur | null>(null)

  const handleValider = async (demandeId: string) => {
    setActionLoading(demandeId)
    try {
      const result = await validerDemandeAction({ demande_id: demandeId })
      if (result.success) {
        toast.success('Demande validée avec succès')
        // Recharger la page pour mettre à jour les données
        window.location.reload()
      } else {
        toast.error(result.error || 'Erreur lors de la validation')
      }
    } catch (error: any) {
      toast.error(error?.message || 'Erreur')
    } finally {
      setActionLoading(null)
    }
  }

  const handleMarquerPayee = async (demandeId: string) => {
    setActionLoading(demandeId)
    try {
      const result = await marquerPayeeAction({ demande_id: demandeId })
      if (result.success) {
        toast.success('Demande marquée comme payée')
        window.location.reload()
      } else {
        toast.error(result.error || 'Erreur')
      }
    } catch (error: any) {
      toast.error(error?.message || 'Erreur')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async () => {
    if (!rejectDemandeId || !rejectReason || rejectReason.trim().length < 10) {
      toast.error('Veuillez fournir une raison détaillée (minimum 10 caractères)')
      return
    }

    setActionLoading(rejectDemandeId)
    try {
      const result = await rejeterDemandeAction({
        demande_id: rejectDemandeId,
        raison: rejectReason,
      })
      if (result.success) {
        toast.success('Demande rejetée')
        setRejectDialogOpen(false)
        setRejectReason('')
        window.location.reload()
      } else {
        toast.error(result.error || 'Erreur')
      }
    } catch (error: any) {
      toast.error(error?.message || 'Erreur')
    } finally {
      setActionLoading(null)
    }
  }

  const openRejectDialog = (demandeId: string) => {
    setRejectDemandeId(demandeId)
    setRejectDialogOpen(true)
  }

  const openDetailsDialog = (demande: DemandeVersementAvecUtilisateur) => {
    setSelectedDemande(demande)
    setDetailsDialogOpen(true)
  }

  if (demandes.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Aucune demande
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {demandes.map((demande) => (
          <div
            key={demande.id}
            className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              {/* Informations principales */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={getStatutBadgeVariant(demande.statut)}>
                    {getStatutLabel(demande.statut)}
                  </Badge>
                  <span className="text-sm font-medium">
                    {demande.user?.full_name || demande.user?.display_name || '—'}
                  </span>
                  {demande.equipe && (
                    <span className="text-xs text-muted-foreground">
                      • Équipe {demande.equipe.numero}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-xl font-bold">
                    {formatCurrency(demande.montant)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {getTypeVersementLabel(demande.type_versement)}
                  </span>
                </div>

                {demande.type_versement === 'virement' && demande.iban && (
                  <div className="text-xs text-muted-foreground font-mono">
                    IBAN: {masquerIBAN(demande.iban)}
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  Demandé le {formatDateLong(demande.created_at)}
                </div>

                {demande.notes_utilisateur && (
                  <div className="text-xs p-2 rounded bg-muted/50">
                    <strong>Note:</strong> {demande.notes_utilisateur}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openDetailsDialog(demande)}
                  className="gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Détails
                </Button>

                {showActions && canValidateDemande(demande) && (
                  <>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleValider(demande.id)}
                      disabled={actionLoading === demande.id}
                      className="gap-2"
                    >
                      {actionLoading === demande.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      Valider
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => openRejectDialog(demande.id)}
                      disabled={actionLoading === demande.id}
                      className="gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Rejeter
                    </Button>
                  </>
                )}

                {showActions && canMarkAsPaid(demande) && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleMarquerPayee(demande.id)}
                    disabled={actionLoading === demande.id}
                    className="gap-2"
                  >
                    {actionLoading === demande.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <DollarSign className="h-4 w-4" />
                    )}
                    Marquer payée
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dialog de rejet */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter la demande</DialogTitle>
            <DialogDescription>
              Veuillez indiquer la raison du rejet. L'utilisateur sera notifié.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="raison">Raison du rejet</Label>
              <Textarea
                id="raison"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ex: Solde insuffisant, informations bancaires incorrectes..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Minimum 10 caractères
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false)
                setRejectReason('')
              }}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason || rejectReason.trim().length < 10}
            >
              Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de détails */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la demande</DialogTitle>
          </DialogHeader>
          {selectedDemande && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Utilisateur</Label>
                  <p className="font-medium">
                    {selectedDemande.user?.full_name || selectedDemande.user?.display_name || '—'}
                  </p>
                  {selectedDemande.user?.email && (
                    <p className="text-sm text-muted-foreground">{selectedDemande.user.email}</p>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground">Équipe</Label>
                  <p className="font-medium">
                    {selectedDemande.equipe?.nom || '—'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Montant</Label>
                  <p className="text-xl font-bold">{formatCurrency(selectedDemande.montant)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <p className="font-medium">{getTypeVersementLabel(selectedDemande.type_versement)}</p>
                </div>
                {selectedDemande.type_versement === 'virement' && (
                  <>
                    <div>
                      <Label className="text-muted-foreground">Bénéficiaire</Label>
                      <p className="font-medium">{selectedDemande.nom_beneficiaire || '—'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">IBAN</Label>
                      <p className="font-mono text-sm">{selectedDemande.iban || '—'}</p>
                    </div>
                  </>
                )}
                <div>
                  <Label className="text-muted-foreground">Date de demande</Label>
                  <p className="text-sm">{formatDateLong(selectedDemande.created_at)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Statut</Label>
                  <Badge variant={getStatutBadgeVariant(selectedDemande.statut)}>
                    {getStatutLabel(selectedDemande.statut)}
                  </Badge>
                </div>
              </div>

              {selectedDemande.notes_utilisateur && (
                <div>
                  <Label className="text-muted-foreground">Notes de l'utilisateur</Label>
                  <p className="mt-1 p-3 rounded bg-muted/50 text-sm">
                    {selectedDemande.notes_utilisateur}
                  </p>
                </div>
              )}

              {selectedDemande.notes_tresorier && (
                <div>
                  <Label className="text-muted-foreground">Notes du trésorier</Label>
                  <p className="mt-1 p-3 rounded bg-muted/50 text-sm">
                    {selectedDemande.notes_tresorier}
                  </p>
                </div>
              )}

              {selectedDemande.rejection_reason && (
                <div>
                  <Label className="text-destructive">Raison du rejet</Label>
                  <p className="mt-1 p-3 rounded bg-destructive/10 text-sm text-destructive">
                    {selectedDemande.rejection_reason}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
