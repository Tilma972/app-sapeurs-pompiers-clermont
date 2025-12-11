'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { CalendarIcon, Users, MapPin, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { createEvent } from '@/lib/features/associative'
import { EventTypeLabels, type CreateEventInput } from '@/lib/features/associative/types'
import { toast } from 'sonner'

interface CreateEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateEventDialog({ 
  open, 
  onOpenChange, 
  onSuccess 
}: CreateEventDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [createPot, setCreatePot] = useState(false)

  const { register, handleSubmit, reset, setValue, watch } = useForm<CreateEventInput>({
    defaultValues: {
      type: 'AUTRE',
      createMoneyPot: false,
    }
  })

  const selectedType = watch('type')

  const onSubmit = async (data: CreateEventInput) => {
    setIsLoading(true)
    try {
      const result = await createEvent({
        ...data,
        date: new Date(data.date),
        createMoneyPot: createPot,
      })

      if (result.success) {
        toast.success('Événement créé avec succès!')
        reset()
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast.error(result.error || 'Erreur lors de la création')
      }
    } catch {
      toast.error('Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Créer un événement</DialogTitle>
          <DialogDescription>
            Planifiez un nouvel événement pour l&apos;amicale
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Titre */}
          <div className="space-y-2">
            <Label htmlFor="title">Titre de l&apos;événement *</Label>
            <Input
              id="title"
              placeholder="Ex: Sainte-Barbe 2025"
              {...register('title', { required: true })}
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label>Type d&apos;événement *</Label>
            <Select
              value={selectedType}
              onValueChange={(value) => setValue('type', value as CreateEventInput['type'])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EventTypeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date et heure *</Label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="date"
                type="datetime-local"
                className="pl-10"
                {...register('date', { required: true })}
              />
            </div>
          </div>

          {/* Lieu */}
          <div className="space-y-2">
            <Label htmlFor="location">Lieu</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                placeholder="Ex: Caserne principale"
                className="pl-10"
                {...register('location')}
              />
            </div>
          </div>

          {/* Nombre max de participants */}
          <div className="space-y-2">
            <Label htmlFor="maxParticipants">Nombre max de participants</Label>
            <div className="relative">
              <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="maxParticipants"
                type="number"
                min="1"
                placeholder="Laisser vide si illimité"
                className="pl-10"
                {...register('maxParticipants', { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Informations complémentaires..."
              rows={3}
              {...register('description')}
            />
          </div>

          {/* Cagnotte */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>Créer une cagnotte</Label>
              <p className="text-sm text-muted-foreground">
                Permettre aux participants de contribuer financièrement
              </p>
            </div>
            <Switch
              checked={createPot}
              onCheckedChange={setCreatePot}
            />
          </div>

          {createPot && (
            <div className="space-y-4 rounded-lg border p-4 bg-muted/50">
              <div className="space-y-2">
                <Label htmlFor="moneyPotTitle">Titre de la cagnotte</Label>
                <Input
                  id="moneyPotTitle"
                  placeholder="Ex: Cagnotte Sainte-Barbe"
                  {...register('moneyPotTitle')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="moneyPotTarget">Objectif (€)</Label>
                <Input
                  id="moneyPotTarget"
                  type="number"
                  min="1"
                  placeholder="Laisser vide si pas d'objectif"
                  {...register('moneyPotTarget', { valueAsNumber: true })}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer l&apos;événement
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
