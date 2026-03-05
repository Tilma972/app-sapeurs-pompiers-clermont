'use client'

/**
 * Section dashboard trésorier — dépenses du pot d'équipe
 * Affiche toutes les demandes avec actions : approuver / rejeter / marquer payée
 * Alerte persistante sur les justificatifs provisoires non remplacés
 */

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { approuverDemandeAction, marquerPayeePotAction, rejeterDemandePotAction } from '@/app/actions/pot-depenses'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Check,
  X,
  CreditCard,
  Loader2,
  ExternalLink,
  Upload,
  AlertTriangle,
  FileText,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/formatters'
import type { DemandePotEquipeAvecRelations, StatutDemandePot } from '@/lib/supabase/pot-depenses'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_SIZE_MB = 10

function statutVariant(statut: StatutDemandePot): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (statut) {
    case 'soumise': return 'secondary'
    case 'approuvée': return 'default'
    case 'payée': return 'outline'
    case 'rejetée': return 'destructive'
    default: return 'secondary'
  }
}

function statutLabel(statut: StatutDemandePot): string {
  switch (statut) {
    case 'soumise': return 'Soumise'
    case 'approuvée': return 'Approuvée'
    case 'payée': return 'Payée'
    case 'rejetée': return 'Rejetée'
    default: return statut
  }
}

// =====================================================
// DIALOG : APPROUVER
// =====================================================

interface ApprouverDialogProps {
  demande: DemandePotEquipeAvecRelations
  open: boolean
  onClose: () => void
}

function ApprouverDialog({ demande, open, onClose }: ApprouverDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [notes, setNotes] = useState('')

  const handleApprouver = () => {
    startTransition(async () => {
      const result = await approuverDemandeAction(demande.id, notes.trim() || undefined)
      if (result.success) {
        toast.success('Demande approuvée')
        onClose()
      } else {
        toast.error(result.error ?? 'Erreur lors de l\'approbation')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approuver la demande</DialogTitle>
          <DialogDescription>
            {demande.prestataire_nom} — {formatCurrency(demande.montant_demande)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="notes-approbation">Note pour le chef d&apos;équipe (optionnel)</Label>
            <Textarea
              id="notes-approbation"
              placeholder="Informations complémentaires pour le chef d'équipe…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>Annuler</Button>
          <Button onClick={handleApprouver} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
            Approuver
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// =====================================================
// DIALOG : MARQUER PAYÉE
// =====================================================

interface MarquerPayeeDialogProps {
  demande: DemandePotEquipeAvecRelations
  open: boolean
  onClose: () => void
}

function MarquerPayeeDialog({ demande, open, onClose }: MarquerPayeeDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [montantPaye, setMontantPaye] = useState(String(demande.montant_demande))
  const [factureFile, setFactureFile] = useState<File | null>(null)
  const [factureUrl, setFactureUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const montantNum = parseFloat(montantPaye.replace(',', '.')) || 0
  const montantValide = montantNum > 0 && montantNum <= Number(demande.montant_demande)

  const handleMontantChange = (value: string) => {
    let val = value.replace(',', '.')
    val = val.replace(/[^0-9.]/g, '')
    const parts = val.split('.')
    if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('')
    setMontantPaye(val)
  }

  const handleFactureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Format non accepté. Utilisez JPG, PNG, WebP ou PDF.')
      return
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Fichier trop volumineux (max ${MAX_SIZE_MB} Mo)`)
      return
    }

    setFactureFile(file)
    setFactureUrl(null)
    setUploading(true)

    const toastId = toast.loading('Upload de la facture…')
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const fileName = `factures/${demande.equipe_id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('pot-depenses-justificatifs')
        .upload(fileName, file, { cacheControl: '3600', upsert: false })

      if (uploadError) {
        toast.error('Erreur lors de l\'upload de la facture', { id: toastId })
        setFactureFile(null)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('pot-depenses-justificatifs')
        .getPublicUrl(fileName)

      setFactureUrl(publicUrl)
      toast.success('Facture uploadée', { id: toastId })
    } catch {
      toast.error('Erreur lors de l\'upload', { id: toastId })
      setFactureFile(null)
    } finally {
      setUploading(false)
    }
  }

  const handleMarquerPayee = () => {
    if (!montantValide) return

    startTransition(async () => {
      const result = await marquerPayeePotAction({
        demandeId: demande.id,
        montantPaye: montantNum,
        factureFinaleUrl: factureUrl ?? undefined,
        justificatifEstProvisoire: demande.justificatif_est_provisoire && !factureUrl,
      })

      if (result.success) {
        toast.success('Demande marquée comme payée')
        onClose()
      } else {
        toast.error(result.error ?? 'Erreur')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Marquer comme payée</DialogTitle>
          <DialogDescription>
            {demande.prestataire_nom} · demande initiale : {formatCurrency(demande.montant_demande)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Montant réel payé */}
          <div className="space-y-2">
            <Label htmlFor="montant-paye">Montant réellement payé (€) *</Label>
            <Input
              id="montant-paye"
              type="text"
              inputMode="decimal"
              value={montantPaye}
              onChange={(e) => handleMontantChange(e.target.value)}
            />
            {montantNum > Number(demande.montant_demande) && (
              <p className="text-sm text-destructive">
                Le montant payé ne peut pas dépasser {formatCurrency(demande.montant_demande)}.
                Créez une demande complémentaire pour l&apos;écart.
              </p>
            )}
          </div>

          {/* Upload facture finale (si provisoire) */}
          {demande.justificatif_est_provisoire && (
            <div className="space-y-2">
              <Label>Facture définitive (remplace le devis provisoire)</Label>
              {factureFile ? (
                <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
                  <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                  <span className="text-sm flex-1 truncate">{factureFile.name}</span>
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => { setFactureFile(null); setFactureUrl(null) }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ) : (
                <label
                  htmlFor="facture-upload"
                  className="flex items-center gap-2 rounded-lg border-2 border-dashed p-4 cursor-pointer hover:bg-muted/30 transition-colors text-sm text-muted-foreground"
                >
                  <Upload className="h-4 w-4 shrink-0" />
                  Uploader la facture définitive (optionnel)
                  <input
                    id="facture-upload"
                    type="file"
                    accept={ACCEPTED_TYPES.join(',')}
                    className="sr-only"
                    onChange={handleFactureUpload}
                  />
                </label>
              )}
              {!factureFile && (
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  ⚠️ Sans facture définitive, cette dépense sera marquée comme justificatif provisoire en attente.
                </p>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>Annuler</Button>
          <Button
            onClick={handleMarquerPayee}
            disabled={!montantValide || isPending || uploading}
          >
            {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
            Confirmer le paiement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// =====================================================
// DIALOG : REJETER
// =====================================================

interface RejeterDialogProps {
  demande: DemandePotEquipeAvecRelations
  open: boolean
  onClose: () => void
}

function RejeterDialog({ demande, open, onClose }: RejeterDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [motifRejet, setMotifRejet] = useState('')

  const handleRejeter = () => {
    if (motifRejet.trim().length < 5) return

    startTransition(async () => {
      const result = await rejeterDemandePotAction(demande.id, motifRejet.trim())
      if (result.success) {
        toast.success('Demande rejetée')
        onClose()
      } else {
        toast.error(result.error ?? 'Erreur lors du rejet')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rejeter la demande</DialogTitle>
          <DialogDescription>
            {demande.prestataire_nom} — {formatCurrency(demande.montant_demande)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="motif-rejet">Motif du rejet *</Label>
            <Textarea
              id="motif-rejet"
              placeholder="Expliquez la raison du rejet au chef d'équipe…"
              value={motifRejet}
              onChange={(e) => setMotifRejet(e.target.value)}
              rows={3}
              className={motifRejet.length > 0 && motifRejet.trim().length < 5 ? 'border-destructive' : ''}
            />
            {motifRejet.length > 0 && motifRejet.trim().length < 5 && (
              <p className="text-sm text-destructive">Motif trop court (minimum 5 caractères)</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>Annuler</Button>
          <Button
            variant="destructive"
            onClick={handleRejeter}
            disabled={motifRejet.trim().length < 5 || isPending}
          >
            {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <X className="h-4 w-4 mr-2" />}
            Rejeter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// =====================================================
// COMPOSANT PRINCIPAL
// =====================================================

interface DemandesPotTresorierProps {
  demandes: DemandePotEquipeAvecRelations[]
}

export function DemandesPotTresorier({ demandes }: DemandesPotTresorierProps) {
  const [dialogState, setDialogState] = useState<{
    type: 'approuver' | 'payer' | 'rejeter'
    demande: DemandePotEquipeAvecRelations
  } | null>(null)

  const nbFacturesManquantes = demandes.filter(
    (d) => d.statut === 'payée' && d.justificatif_est_provisoire && !d.facture_finale_url
  ).length

  const demandesActives = demandes.filter((d) => ['soumise', 'approuvée'].includes(d.statut))
  const demandesArchivees = demandes.filter((d) => ['payée', 'rejetée'].includes(d.statut))

  if (demandes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dépenses pot d&apos;équipe</CardTitle>
          <CardDescription>Aucune demande pour le moment</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Dépenses pot d&apos;équipe</CardTitle>
          <CardDescription>
            {demandesActives.length} en attente · {demandesArchivees.length} archivée{demandesArchivees.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Alerte factures provisoires */}
          {nbFacturesManquantes > 0 && (
            <Alert variant="default" className="border-orange-500 bg-orange-50 dark:bg-orange-950/30 text-orange-900 dark:text-orange-100">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <AlertTitle>Factures définitives manquantes</AlertTitle>
              <AlertDescription>
                {nbFacturesManquantes} dépense{nbFacturesManquantes > 1 ? 's ont' : ' a'} un justificatif provisoire.
                Relancez les chefs d&apos;équipe concernés pour obtenir les factures définitives.
              </AlertDescription>
            </Alert>
          )}

          {/* Demandes actives */}
          {demandesActives.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">À traiter</h3>
              <div className="rounded-md border divide-y">
                {demandesActives.map((demande) => (
                  <DemandeRow
                    key={demande.id}
                    demande={demande}
                    onApprouver={() => setDialogState({ type: 'approuver', demande })}
                    onPayer={() => setDialogState({ type: 'payer', demande })}
                    onRejeter={() => setDialogState({ type: 'rejeter', demande })}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Demandes archivées */}
          {demandesArchivees.length > 0 && (
            <details className="space-y-3">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-1">
                Historique ({demandesArchivees.length})
              </summary>
              <div className="rounded-md border divide-y mt-2">
                {demandesArchivees.map((demande) => (
                  <DemandeRow key={demande.id} demande={demande} />
                ))}
              </div>
            </details>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {dialogState?.type === 'approuver' && (
        <ApprouverDialog
          demande={dialogState.demande}
          open
          onClose={() => setDialogState(null)}
        />
      )}
      {dialogState?.type === 'payer' && (
        <MarquerPayeeDialog
          demande={dialogState.demande}
          open
          onClose={() => setDialogState(null)}
        />
      )}
      {dialogState?.type === 'rejeter' && (
        <RejeterDialog
          demande={dialogState.demande}
          open
          onClose={() => setDialogState(null)}
        />
      )}
    </>
  )
}

// =====================================================
// COMPOSANT ROW
// =====================================================

interface DemandeRowProps {
  demande: DemandePotEquipeAvecRelations
  onApprouver?: () => void
  onPayer?: () => void
  onRejeter?: () => void
}

function DemandeRow({ demande, onApprouver, onPayer, onRejeter }: DemandeRowProps) {
  const factureManquante =
    demande.statut === 'payée' &&
    demande.justificatif_est_provisoire &&
    !demande.facture_finale_url

  const equipeNom = (demande.equipe as { nom?: string } | null)?.nom
  const chefNom = (demande.chef as { full_name?: string | null; display_name?: string | null } | null)?.full_name
    ?? (demande.chef as { full_name?: string | null; display_name?: string | null } | null)?.display_name
    ?? '—'

  return (
    <div className="flex items-center gap-3 p-3 flex-wrap sm:flex-nowrap">
      {/* Info principale */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm truncate">{demande.prestataire_nom}</span>
          <Badge variant={statutVariant(demande.statut)} className="text-xs shrink-0">
            {statutLabel(demande.statut)}
          </Badge>
          {factureManquante && (
            <Badge variant="outline" className="text-xs shrink-0 border-orange-500 text-orange-600">
              ⚠️ Facture manquante
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {equipeNom ? `${equipeNom} · ` : ''}{chefNom} · {formatDate(demande.created_at)}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-1 italic">{demande.motif}</p>
        {demande.motif_rejet && (
          <p className="text-xs text-destructive">Rejet : {demande.motif_rejet}</p>
        )}
      </div>

      {/* Montant */}
      <div className="text-right shrink-0">
        <div className="font-semibold tabular-nums text-sm">{formatCurrency(demande.montant_demande)}</div>
        {demande.montant_paye !== null && (
          <div className="text-xs text-muted-foreground tabular-nums">
            payé : {formatCurrency(demande.montant_paye)}
          </div>
        )}
      </div>

      {/* Justificatif */}
      <a
        href={demande.justificatif_url}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 text-muted-foreground hover:text-foreground"
        title="Voir le justificatif"
      >
        <ExternalLink className="h-4 w-4" />
      </a>

      {/* Actions */}
      {(onApprouver || onPayer || onRejeter) && (
        <div className="flex items-center gap-1 shrink-0">
          {demande.statut === 'soumise' && onApprouver && (
            <Button
              size="sm"
              variant="outline"
              className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 h-8 px-2"
              onClick={onApprouver}
              title="Approuver"
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
          {['soumise', 'approuvée'].includes(demande.statut) && onPayer && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2"
              onClick={onPayer}
              title="Marquer comme payée"
            >
              <CreditCard className="h-4 w-4" />
            </Button>
          )}
          {['soumise', 'approuvée'].includes(demande.statut) && onRejeter && (
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 h-8 px-2"
              onClick={onRejeter}
              title="Rejeter"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
