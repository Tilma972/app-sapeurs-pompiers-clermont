'use client'

/**
 * Formulaire de demande de pot d'équipe
 * Permet aux chefs d'équipe de demander des fonds pour des activités
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Loader2, Wallet, AlertCircle, Info } from 'lucide-react'
import { creerDemandePotEquipeAction } from '@/app/actions/pot-equipe'
import { CategorieDemandePot, getCategorieLabel, getCategorieEmoji } from '@/lib/types/pot-equipe'
import { formatCurrency } from '@/lib/formatters'
import { toast } from 'sonner'

// =====================================================
// SCHÉMA DE VALIDATION
// =====================================================

const demandePotSchema = z.object({
  titre: z
    .string()
    .min(5, 'Le titre doit contenir au moins 5 caractères')
    .max(200, 'Le titre ne peut pas dépasser 200 caractères'),
  description: z
    .string()
    .min(10, 'La description doit contenir au moins 10 caractères')
    .max(1000, 'La description ne peut pas dépasser 1000 caractères'),
  montant: z
    .number()
    .positive('Le montant doit être supérieur à 0')
    .max(10000, 'Le montant ne peut pas dépasser 10 000€'),
  categorie: z.enum([
    CategorieDemandePot.REPAS,
    CategorieDemandePot.SORTIE,
    CategorieDemandePot.EQUIPEMENT,
    CategorieDemandePot.EVENEMENT,
    CategorieDemandePot.AUTRE,
  ]),
  notes_demandeur: z.string().optional(),
})

type DemandePotFormData = z.infer<typeof demandePotSchema>

// =====================================================
// PROPS
// =====================================================

interface DemandePotFormProps {
  soldePotEquipe: number
  onSuccess?: () => void
}

// =====================================================
// COMPOSANT
// =====================================================

export function DemandePotForm({ soldePotEquipe, onSuccess }: DemandePotFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm<DemandePotFormData>({
    resolver: zodResolver(demandePotSchema),
    defaultValues: {
      categorie: CategorieDemandePot.AUTRE,
      montant: 0,
    },
  })

  const categorie = watch('categorie')
  const montant = watch('montant')

  const onSubmit = async (data: DemandePotFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const result = await creerDemandePotEquipeAction({
        titre: data.titre,
        description: data.description,
        montant: data.montant,
        categorie: data.categorie,
        notes_demandeur: data.notes_demandeur,
      })

      if (result.success) {
        toast.success('Demande créée avec succès', {
          description: 'Votre demande sera traitée par le trésorier',
        })
        if (onSuccess) {
          onSuccess()
        } else {
          router.push('/mon-compte')
        }
      } else {
        setError(result.error || 'Une erreur est survenue')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Solde du pot d'équipe */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Pot d&apos;équipe disponible
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{formatCurrency(soldePotEquipe)}</div>
          <p className="text-sm text-muted-foreground mt-1">
            Montant disponible pour des activités d&apos;équipe
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

      {/* Titre */}
      <div className="space-y-2">
        <Label htmlFor="titre">Titre de la demande</Label>
        <Input
          id="titre"
          {...register('titre')}
          placeholder="Ex: Repas d&apos;équipe du 15 décembre"
          maxLength={200}
        />
        {errors.titre && (
          <p className="text-sm text-destructive">{errors.titre.message}</p>
        )}
      </div>

      {/* Catégorie */}
      <div className="space-y-3">
        <Label>Catégorie</Label>
        <RadioGroup
          value={categorie}
          onValueChange={(value) => setValue('categorie', value as typeof CategorieDemandePot.REPAS)}
          className="grid grid-cols-2 md:grid-cols-3 gap-3"
        >
          {Object.values(CategorieDemandePot).map((cat) => (
            <div key={cat}>
              <RadioGroupItem
                value={cat}
                id={cat}
                className="peer sr-only"
              />
              <Label
                htmlFor={cat}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-3 cursor-pointer transition-all hover:bg-accent
                  ${categorie === cat ? 'border-primary bg-accent' : 'border-muted'}
                `}
              >
                <span className="text-2xl">{getCategorieEmoji(cat)}</span>
                <span className="text-sm font-medium">{getCategorieLabel(cat)}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Montant */}
      <div className="space-y-2">
        <Label htmlFor="montant">Montant demandé</Label>
        <div className="relative">
          <Input
            id="montant"
            type="number"
            step="0.01"
            min="0"
            max={Math.min(soldePotEquipe, 10000)}
            {...register('montant', { valueAsNumber: true })}
            className="pr-8"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
        </div>
        {errors.montant && (
          <p className="text-sm text-destructive">{errors.montant.message}</p>
        )}
        {montant > soldePotEquipe && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Le montant demandé dépasse le solde disponible ({formatCurrency(soldePotEquipe)})
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description détaillée</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Décrivez l&apos;activité ou la dépense prévue..."
          rows={5}
          maxLength={1000}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Minimum 10 caractères • Maximum 1000 caractères
        </p>
      </div>

      {/* Notes optionnelles */}
      <div className="space-y-2">
        <Label htmlFor="notes_demandeur">Notes complémentaires (optionnel)</Label>
        <Textarea
          id="notes_demandeur"
          {...register('notes_demandeur')}
          placeholder="Informations supplémentaires pour le trésorier..."
          rows={3}
        />
      </div>

      {/* Informations importantes */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <p className="font-medium mb-1">À savoir</p>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li>Votre demande sera visible par tous les membres de l&apos;équipe</li>
            <li>Le trésorier validera et effectuera le paiement</li>
            <li>Le montant sera déduit du pot d&apos;équipe une fois payé</li>
          </ul>
        </AlertDescription>
      </Alert>

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
          disabled={isSubmitting || soldePotEquipe <= 0 || montant > soldePotEquipe}
          className="flex-1"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Création...' : 'Créer la demande'}
        </Button>
      </div>
    </form>
  )
}
