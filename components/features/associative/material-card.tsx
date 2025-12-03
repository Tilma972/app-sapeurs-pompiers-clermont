'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  Package, 
  Calendar, 
  CheckCircle, 
  XCircle,
  Clock,
  Loader2
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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

import { requestLoan } from '@/lib/features/associative'
import { MaterialConditionLabels, type MaterialWithLoans } from '@/lib/features/associative/types'
import { toast } from 'sonner'

interface MaterialCardProps {
  material: MaterialWithLoans
  onLoanRequested?: () => void
}

const conditionColors: Record<string, string> = {
  NEW: 'text-green-600 bg-green-100',
  GOOD: 'text-blue-600 bg-blue-100',
  USED: 'text-yellow-600 bg-yellow-100',
  DAMAGED: 'text-orange-600 bg-orange-100',
  BROKEN: 'text-red-600 bg-red-100',
}

export function MaterialCard({ material, onLoanRequested }: MaterialCardProps) {
  const [showLoanDialog, setShowLoanDialog] = useState(false)

  const isAvailable = material.isAvailable && material.condition !== 'BROKEN' && !material.currentLoan
  const currentLoan = material.currentLoan

  return (
    <>
      <Card className={`
        relative overflow-hidden transition-all hover:shadow-md
        ${!isAvailable ? 'opacity-75' : ''}
      `}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {material.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={material.photoUrl} 
                  alt={material.name}
                  className="h-10 w-10 rounded object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div>
                <CardTitle className="text-base">{material.name}</CardTitle>
                {material.inventoryNumber && (
                  <CardDescription className="text-xs">
                    #{material.inventoryNumber}
                  </CardDescription>
                )}
              </div>
            </div>
            <Badge className={conditionColors[material.condition]}>
              {MaterialConditionLabels[material.condition]}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-2 pb-2">
          {material.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {material.description}
            </p>
          )}

          {/* Statut de disponibilité */}
          <div className="flex items-center gap-2 text-sm">
            {isAvailable ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-green-600">Disponible</span>
              </>
            ) : currentLoan ? (
              <>
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="text-orange-600">
                  Emprunté jusqu&apos;au {format(new Date(currentLoan.endDate), 'd MMM', { locale: fr })}
                </span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-red-600">Indisponible</span>
              </>
            )}
          </div>

          {/* Prochains emprunts */}
          {material.loans.length > 0 && (
            <div className="text-xs text-muted-foreground">
              {material.loans.length} réservation{material.loans.length > 1 ? 's' : ''} à venir
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button
            className="w-full"
            disabled={!isAvailable}
            onClick={() => setShowLoanDialog(true)}
          >
            <Calendar className="h-4 w-4 mr-2" />
            {isAvailable ? 'Réserver' : 'Indisponible'}
          </Button>
        </CardFooter>
      </Card>

      {/* Dialog de réservation */}
      <LoanDialog
        material={material}
        open={showLoanDialog}
        onOpenChange={setShowLoanDialog}
        onSuccess={() => {
          setShowLoanDialog(false)
          onLoanRequested?.()
        }}
      />
    </>
  )
}

// Dialog de réservation
interface LoanDialogProps {
  material: MaterialWithLoans
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

function LoanDialog({ material, open, onOpenChange, onSuccess }: LoanDialogProps) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    if (!startDate || !endDate) {
      toast.error('Veuillez sélectionner les dates')
      return
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (end <= start) {
      toast.error('La date de fin doit être après la date de début')
      return
    }

    setIsLoading(true)
    try {
      const result = await requestLoan({
        materialId: material.id,
        startDate: start,
        endDate: end,
      })

      if (result.success) {
        toast.success('Demande d\'emprunt envoyée!')
        setStartDate('')
        setEndDate('')
        onSuccess?.()
      } else {
        toast.error(result.error || 'Erreur lors de la demande')
      }
    } catch {
      toast.error('Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Réserver {material.name}</DialogTitle>
          <DialogDescription>
            Sélectionnez les dates d&apos;emprunt souhaitées
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Photo du matériel */}
          {material.photoUrl && (
            <div className="relative h-32 rounded-lg overflow-hidden bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={material.photoUrl}
                alt={material.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Date de début</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Date de fin</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
          </div>

          {/* Rappel des conditions */}
          <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
            <p>⚠️ Votre demande sera soumise à validation par le bureau.</p>
            <p className="mt-1">État actuel: <strong>{MaterialConditionLabels[material.condition]}</strong></p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !startDate || !endDate}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Demander l&apos;emprunt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
