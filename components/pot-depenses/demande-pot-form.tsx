'use client'

/**
 * Formulaire de soumission d'une demande de dépense sur le pot d'équipe
 * Réservé au chef d'équipe
 * L'upload du justificatif est fait côté client avant soumission
 */

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { soumettreDemandeAction } from '@/app/actions/pot-depenses'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Loader2, Upload, Info, X, FileText } from 'lucide-react'
import { formatCurrency } from '@/lib/formatters'

const INFO_BADGE_TEXT = `Le paiement est toujours effectué par le trésorier au nom de l'amicale. Tous les membres de l'équipe voient les demandes. Si la facture finale est supérieure au devis approuvé, une demande complémentaire est nécessaire pour l'écart.`

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_SIZE_MB = 10

interface DemandePotFormProps {
  equipeId: string
  equipeNom: string
  soldeDisponible: number
  totalDisponible: number
  onSuccess?: () => void
}

export function DemandePotForm({
  equipeId,
  equipeNom,
  soldeDisponible,
  totalDisponible,
  onSuccess,
}: DemandePotFormProps) {
  const [isPending, startTransition] = useTransition()

  const [motif, setMotif] = useState('')
  const [prestataireNom, setPrestataireNom] = useState('')
  const [montant, setMontant] = useState('')
  const [justificatifFile, setJustificatifFile] = useState<File | null>(null)
  const [justificatifUrl, setJustificatifUrl] = useState<string | null>(null)
  const [estProvisoire, setEstProvisoire] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [infoOuverte, setInfoOuverte] = useState(false)

  const montantNum = parseFloat(montant.replace(',', '.')) || 0
  const montantValide = montantNum > 0 && montantNum <= soldeDisponible
  const canSubmit =
    motif.trim().length > 0 &&
    prestataireNom.trim().length > 0 &&
    montantValide &&
    justificatifUrl !== null &&
    !uploading

  const handleMontantChange = (value: string) => {
    let val = value.replace(',', '.')
    val = val.replace(/[^0-9.]/g, '')
    const parts = val.split('.')
    if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('')
    setMontant(val)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setJustificatifFile(file)
    setJustificatifUrl(null)
    setUploading(true)

    const toastId = toast.loading('Upload du justificatif...')
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const fileName = `${equipeId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('pot-depenses-justificatifs')
        .upload(fileName, file, { cacheControl: '3600', upsert: false })

      if (uploadError) {
        toast.error('Erreur lors de l\'upload du justificatif', { id: toastId })
        setJustificatifFile(null)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('pot-depenses-justificatifs')
        .getPublicUrl(fileName)

      setJustificatifUrl(publicUrl)
      toast.success('Justificatif uploadé', { id: toastId })
    } catch {
      toast.error('Erreur lors de l\'upload', { id: toastId })
      setJustificatifFile(null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveFile = () => {
    setJustificatifFile(null)
    setJustificatifUrl(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || !justificatifUrl) return

    startTransition(async () => {
      const result = await soumettreDemandeAction({
        equipeId,
        motif: motif.trim(),
        prestataireNom: prestataireNom.trim(),
        montantDemande: montantNum,
        justificatifUrl,
        justificatifEstProvisoire: estProvisoire,
        totalDisponible,
      })

      if (result.success) {
        toast.success('Demande soumise ! Le trésorier a été notifié.')
        setMotif('')
        setPrestataireNom('')
        setMontant('')
        setJustificatifFile(null)
        setJustificatifUrl(null)
        setEstProvisoire(false)
        onSuccess?.()
      } else {
        toast.error(result.error ?? 'Erreur lors de la soumission')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Nouvelle demande de dépense</CardTitle>
            <CardDescription className="mt-1">
              Pot d&apos;équipe · {equipeNom}
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1 text-muted-foreground shrink-0"
            onClick={() => setInfoOuverte((v) => !v)}
            aria-expanded={infoOuverte}
          >
            <Info className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only text-xs">Comment ça marche ?</span>
          </Button>
        </div>
        {infoOuverte && (
          <div className="mt-3 rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
            {INFO_BADGE_TEXT}
          </div>
        )}
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-5">
          {/* Solde disponible */}
          <div className="rounded-lg bg-muted p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Solde disponible du pot</span>
              <span className="text-2xl font-bold">{formatCurrency(soldeDisponible)}</span>
            </div>
            {soldeDisponible < totalDisponible && (
              <p className="text-xs text-muted-foreground mt-1">
                (Total : {formatCurrency(totalDisponible)} − demandes engagées)
              </p>
            )}
          </div>

          {/* Motif */}
          <div className="space-y-2">
            <Label htmlFor="motif">Motif de la dépense *</Label>
            <Textarea
              id="motif"
              placeholder="Ex: Repas de fin de saison, achat matériel, activité équipe…"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              rows={2}
              disabled={isPending}
              required
            />
          </div>

          {/* Prestataire */}
          <div className="space-y-2">
            <Label htmlFor="prestataire">Prestataire / Fournisseur *</Label>
            <Input
              id="prestataire"
              placeholder="Nom du prestataire ou fournisseur"
              value={prestataireNom}
              onChange={(e) => setPrestataireNom(e.target.value)}
              disabled={isPending}
              required
            />
          </div>

          {/* Montant */}
          <div className="space-y-2">
            <Label htmlFor="montant">Montant demandé (€) *</Label>
            <Input
              id="montant"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={montant}
              onChange={(e) => handleMontantChange(e.target.value)}
              disabled={isPending || soldeDisponible <= 0}
              required
            />
            {montantNum > 0 && montantNum > soldeDisponible && (
              <p className="text-sm text-destructive">
                Dépasse le solde disponible ({formatCurrency(soldeDisponible)})
              </p>
            )}
            {soldeDisponible <= 0 && (
              <p className="text-sm text-muted-foreground">
                Solde insuffisant pour effectuer une demande
              </p>
            )}
          </div>

          {/* Upload justificatif */}
          <div className="space-y-2">
            <Label>Justificatif (devis ou pro forma) *</Label>
            {justificatifFile ? (
              <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
                <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                <span className="text-sm flex-1 truncate">{justificatifFile.name}</span>
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={handleRemoveFile}
                    disabled={isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ) : (
              <label
                htmlFor="justificatif-upload"
                className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-6 cursor-pointer hover:bg-muted/30 transition-colors"
              >
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground text-center">
                  Cliquez pour sélectionner un fichier
                  <br />
                  <span className="text-xs">JPG, PNG, WebP ou PDF — max {MAX_SIZE_MB} Mo</span>
                </span>
                <input
                  id="justificatif-upload"
                  type="file"
                  accept={ACCEPTED_TYPES.join(',')}
                  className="sr-only"
                  onChange={handleFileChange}
                  disabled={isPending}
                />
              </label>
            )}

            {/* Provisoire */}
            {justificatifFile && (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={estProvisoire}
                  onChange={(e) => setEstProvisoire(e.target.checked)}
                  className="h-4 w-4"
                  disabled={isPending}
                />
                <span className="text-sm text-muted-foreground">
                  Ce justificatif est un devis provisoire (la facture définitive sera fournie plus tard)
                </span>
              </label>
            )}
          </div>

          {/* Badge info */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3">
            <p className="text-xs text-blue-900 dark:text-blue-100">
              💡 Le paiement est effectué par le trésorier au nom de l&apos;amicale. Tous les membres de votre équipe verront cette demande.
            </p>
          </div>
        </CardContent>

        <CardFooter>
          <Button
            type="submit"
            disabled={!canSubmit || isPending}
            className="w-full"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi en cours…
              </>
            ) : (
              'Soumettre la demande'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
