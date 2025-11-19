'use client'

/**
 * Formulaire de demande de versement
 * Permet aux utilisateurs de demander le versement de leur rétribution
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Loader2, Wallet, CreditCard, Building2, Info, AlertCircle } from 'lucide-react'
import { creerDemandeVersementAction } from '@/app/actions/versement'
import { VERSEMENT_CONFIG, calculateNetAmountAfterFees } from '@/lib/config'
import { TypeVersement } from '@/lib/types'
import { formatCurrency } from '@/lib/formatters'
import { toast } from 'sonner'

// =====================================================
// SCHÉMA DE VALIDATION
// =====================================================

const demandeVersementSchema = z.object({
  montant: z
    .number()
    .min(VERSEMENT_CONFIG.MONTANT_MINIMUM_VERSEMENT, `Minimum ${VERSEMENT_CONFIG.MONTANT_MINIMUM_VERSEMENT}€`)
    .max(VERSEMENT_CONFIG.MONTANT_MAXIMUM_VERSEMENT, `Maximum ${VERSEMENT_CONFIG.MONTANT_MAXIMUM_VERSEMENT}€`),
  type_versement: z.enum([TypeVersement.VIREMENT, TypeVersement.CARTE_CADEAU]),
  iban: z.string().optional(),
  nom_beneficiaire: z.string().optional(),
  notes_utilisateur: z.string().optional(),
}).refine((data) => {
  // Si virement, IBAN et nom bénéficiaire requis
  if (data.type_versement === TypeVersement.VIREMENT) {
    return data.iban && data.nom_beneficiaire
  }
  return true
}, {
  message: "L'IBAN et le nom du bénéficiaire sont requis pour un virement",
  path: ['iban'],
})

type DemandeVersementFormData = z.infer<typeof demandeVersementSchema>

// =====================================================
// PROPS
// =====================================================

interface DemandeVersementFormProps {
  soldeDisponible: number
  onSuccess?: () => void
}

// =====================================================
// COMPOSANT
// =====================================================

export function DemandeVersementForm({ soldeDisponible, onSuccess }: DemandeVersementFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm<DemandeVersementFormData>({
    resolver: zodResolver(demandeVersementSchema),
    defaultValues: {
      type_versement: TypeVersement.VIREMENT,
      montant: Math.min(soldeDisponible, VERSEMENT_CONFIG.MONTANT_MINIMUM_VERSEMENT),
    },
  })

  const typeVersement = watch('type_versement')
  const montant = watch('montant')

  const montantNet = typeVersement === TypeVersement.CARTE_CADEAU
    ? calculateNetAmountAfterFees(montant || 0)
    : montant

  const onSubmit = async (data: DemandeVersementFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const result = await creerDemandeVersementAction({
        montant: data.montant,
        type_versement: data.type_versement,
        iban: data.iban,
        nom_beneficiaire: data.nom_beneficiaire,
        notes_utilisateur: data.notes_utilisateur,
      })

      if (result.success) {
        toast.success('Demande créée avec succès', {
          description: 'Votre demande sera traitée dans les prochains jours',
        })
        if (onSuccess) {
          onSuccess()
        } else {
          router.push('/mon-compte')
        }
      } else {
        setError(result.error || 'Une erreur est survenue')
      }
    } catch (err: any) {
      setError(err?.message || 'Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isVirementDisabled = montant < VERSEMENT_CONFIG.MONTANT_MINIMUM_VIREMENT

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Informations sur le solde */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Solde disponible
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{formatCurrency(soldeDisponible)}</div>
          <p className="text-sm text-muted-foreground mt-1">
            Montant disponible pour un versement
          </p>
        </CardContent>
      </Card>

      {/* Erreur globale */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Montant */}
      <div className="space-y-2">
        <Label htmlFor="montant">Montant à verser</Label>
        <div className="relative">
          <Input
            id="montant"
            type="number"
            step="0.01"
            min={VERSEMENT_CONFIG.MONTANT_MINIMUM_VERSEMENT}
            max={Math.min(soldeDisponible, VERSEMENT_CONFIG.MONTANT_MAXIMUM_VERSEMENT)}
            {...register('montant', { valueAsNumber: true })}
            className="pr-8"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
        </div>
        {errors.montant && (
          <p className="text-sm text-destructive">{errors.montant.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Minimum: {VERSEMENT_CONFIG.MONTANT_MINIMUM_VERSEMENT}€ • Maximum: {VERSEMENT_CONFIG.MONTANT_MAXIMUM_VERSEMENT}€
        </p>
      </div>

      {/* Type de versement */}
      <div className="space-y-3">
        <Label>Mode de versement</Label>
        <RadioGroup
          value={typeVersement}
          onValueChange={(value) => setValue('type_versement', value as any)}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* Virement bancaire */}
          <div>
            <RadioGroupItem
              value={TypeVersement.VIREMENT}
              id="virement"
              className="peer sr-only"
              disabled={isVirementDisabled}
            />
            <Label
              htmlFor="virement"
              className={`flex flex-col items-start gap-2 rounded-lg border-2 p-4 cursor-pointer transition-all hover:bg-accent
                ${typeVersement === TypeVersement.VIREMENT ? 'border-primary bg-accent' : 'border-muted'}
                ${isVirementDisabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                <span className="font-semibold">Virement bancaire</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Vous recevez 100% du montant
              </span>
              {isVirementDisabled && (
                <span className="text-xs text-destructive">
                  Minimum {VERSEMENT_CONFIG.MONTANT_MINIMUM_VIREMENT}€ pour un virement
                </span>
              )}
            </Label>
          </div>

          {/* Carte cadeau */}
          <div>
            <RadioGroupItem
              value={TypeVersement.CARTE_CADEAU}
              id="carte_cadeau"
              className="peer sr-only"
            />
            <Label
              htmlFor="carte_cadeau"
              className={`flex flex-col items-start gap-2 rounded-lg border-2 p-4 cursor-pointer transition-all hover:bg-accent
                ${typeVersement === TypeVersement.CARTE_CADEAU ? 'border-primary bg-accent' : 'border-muted'}
              `}
            >
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                <span className="font-semibold">Carte cadeau</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Frais de {VERSEMENT_CONFIG.FRAIS_CARTE_CADEAU}% • Vous recevez {formatCurrency(montantNet || 0)}
              </span>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Informations supplémentaires selon le type */}
      {typeVersement === TypeVersement.VIREMENT && (
        <div className="space-y-4 p-4 rounded-lg border bg-muted/50">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Vos coordonnées bancaires seront utilisées uniquement pour ce versement et ne seront pas conservées.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="nom_beneficiaire">Nom du bénéficiaire</Label>
            <Input
              id="nom_beneficiaire"
              {...register('nom_beneficiaire')}
              placeholder="Nom complet"
            />
            {errors.nom_beneficiaire && (
              <p className="text-sm text-destructive">{errors.nom_beneficiaire.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="iban">IBAN</Label>
            <Input
              id="iban"
              {...register('iban')}
              placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
              className="font-mono"
            />
            {errors.iban && (
              <p className="text-sm text-destructive">{errors.iban.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Format: FR76 suivi de 23 chiffres
            </p>
          </div>
        </div>
      )}

      {typeVersement === TypeVersement.CARTE_CADEAU && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-1">Carte cadeau</p>
            <p className="text-sm">
              Des frais de {VERSEMENT_CONFIG.FRAIS_CARTE_CADEAU}% s'appliquent pour couvrir les frais de gestion.
              Vous recevrez une carte cadeau d'un montant de <strong>{formatCurrency(montantNet || 0)}</strong>.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Notes optionnelles */}
      <div className="space-y-2">
        <Label htmlFor="notes_utilisateur">Notes (optionnel)</Label>
        <Textarea
          id="notes_utilisateur"
          {...register('notes_utilisateur')}
          placeholder="Informations complémentaires..."
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          Exemple: préférence pour un enseigne de carte cadeau particulière
        </p>
      </div>

      {/* Récapitulatif */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Récapitulatif</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Montant demandé</span>
            <span className="font-medium">{formatCurrency(montant || 0)}</span>
          </div>
          {typeVersement === TypeVersement.CARTE_CADEAU && (
            <>
              <div className="flex justify-between text-destructive">
                <span>Frais ({VERSEMENT_CONFIG.FRAIS_CARTE_CADEAU}%)</span>
                <span>- {formatCurrency((montant || 0) - montantNet)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t font-bold">
                <span>Montant reçu</span>
                <span>{formatCurrency(montantNet)}</span>
              </div>
            </>
          )}
          <div className="pt-2 border-t text-xs text-muted-foreground">
            <p>Délai de traitement estimé: {VERSEMENT_CONFIG.DELAI_TRAITEMENT_JOURS} jours ouvrés</p>
          </div>
        </CardContent>
      </Card>

      {/* Boutons */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="flex-1"
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || soldeDisponible < VERSEMENT_CONFIG.MONTANT_MINIMUM_VERSEMENT}
          className="flex-1"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Création...' : 'Créer la demande'}
        </Button>
      </div>
    </form>
  )
}
