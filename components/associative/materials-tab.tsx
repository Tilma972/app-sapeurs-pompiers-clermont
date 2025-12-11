'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  Plus, 
  Package, 
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createMaterial, requestLoan } from '@/lib/features/associative/actions/materials'
import type { MaterialWithLoans } from '@/lib/features/associative/types'
import { MaterialConditionLabels, LoanStatusLabels } from '@/lib/features/associative/types'

type MaterialConditionType = 'NEW' | 'GOOD' | 'USED' | 'DAMAGED' | 'BROKEN'

interface MaterialsTabProps {
  materials: MaterialWithLoans[]
  userId: string
}

const conditionColors: Record<MaterialConditionType, string> = {
  NEW: 'bg-green-100 text-green-800',
  GOOD: 'bg-blue-100 text-blue-800',
  USED: 'bg-yellow-100 text-yellow-800',
  DAMAGED: 'bg-orange-100 text-orange-800',
  BROKEN: 'bg-red-100 text-red-800',
}

function MaterialCard({ 
  material, 
  userId,
  onRequestLoan 
}: { 
  material: MaterialWithLoans
  userId: string
  onRequestLoan: (materialId: string, startDate: Date, endDate: Date) => Promise<void>
}) {
  const [isRequesting, setIsRequesting] = useState(false)
  const [loanDates, setLoanDates] = useState({
    startDate: '',
    endDate: '',
  })

  // Trouver l'emprunt actif
  const activeLoan = material.loans.find(l => 
    l.status === 'ACTIVE' || l.status === 'APPROVED'
  )
  const myPendingLoan = material.loans.find(l => 
    l.userId === userId && l.status === 'PENDING'
  )

  const handleRequestLoan = async () => {
    if (loanDates.startDate && loanDates.endDate) {
      await onRequestLoan(
        material.id, 
        new Date(loanDates.startDate), 
        new Date(loanDates.endDate)
      )
      setLoanDates({ startDate: '', endDate: '' })
      setIsRequesting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{material.name}</CardTitle>
            <CardDescription>{material.description}</CardDescription>
          </div>
          <div className="flex flex-col gap-1 items-end">
            <Badge className={conditionColors[material.condition]}>
              {MaterialConditionLabels[material.condition]}
            </Badge>
            {material.isAvailable ? (
              <Badge variant="outline" className="text-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Disponible
              </Badge>
            ) : (
              <Badge variant="outline" className="text-orange-600">
                <XCircle className="h-3 w-3 mr-1" />
                Emprunté
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {material.inventoryNumber && (
          <p className="text-sm text-muted-foreground">
            N° inventaire: {material.inventoryNumber}
          </p>
        )}
        
        {activeLoan && (
          <div className="p-3 bg-muted rounded-lg text-sm">
            <div className="flex items-center gap-1 font-medium">
              <Clock className="h-4 w-4" />
              Emprunté jusqu&apos;au {format(new Date(activeLoan.endDate), 'd MMMM yyyy', { locale: fr })}
            </div>
            <p className="text-muted-foreground mt-1">
              Statut: {LoanStatusLabels[activeLoan.status]}
            </p>
          </div>
        )}

        {myPendingLoan && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
            <div className="flex items-center gap-1 font-medium text-yellow-800">
              <AlertCircle className="h-4 w-4" />
              Votre demande est en attente
            </div>
            <p className="text-yellow-700 mt-1">
              Du {format(new Date(myPendingLoan.startDate), 'd MMM', { locale: fr })} au {format(new Date(myPendingLoan.endDate), 'd MMM yyyy', { locale: fr })}
            </p>
          </div>
        )}
      </CardContent>
      
      {material.isAvailable && !myPendingLoan && material.condition !== 'BROKEN' && (
        <CardFooter>
          {isRequesting ? (
            <div className="w-full space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="startDate" className="text-xs">Date début</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={loanDates.startDate}
                    onChange={(e) => setLoanDates({ ...loanDates, startDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate" className="text-xs">Date fin</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={loanDates.endDate}
                    onChange={(e) => setLoanDates({ ...loanDates, endDate: e.target.value })}
                    min={loanDates.startDate || new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleRequestLoan} className="flex-1">
                  Confirmer
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsRequesting(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <Button className="w-full" onClick={() => setIsRequesting(true)}>
              <Calendar className="h-4 w-4 mr-2" />
              Demander un emprunt
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  )
}

export function MaterialsTab({ materials, userId }: MaterialsTabProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    description: '',
    inventoryNumber: '',
    condition: 'GOOD' as MaterialConditionType,
  })

  const availableMaterials = materials.filter(m => m.isAvailable && m.condition !== 'BROKEN')
  const borrowedMaterials = materials.filter(m => !m.isAvailable)
  const brokenMaterials = materials.filter(m => m.condition === 'BROKEN')

  const handleCreateMaterial = async () => {
    startTransition(async () => {
      await createMaterial({
        name: newMaterial.name,
        description: newMaterial.description || undefined,
        inventoryNumber: newMaterial.inventoryNumber || undefined,
        condition: newMaterial.condition,
      })
      setNewMaterial({ name: '', description: '', inventoryNumber: '', condition: 'GOOD' })
      setIsDialogOpen(false)
      router.refresh()
    })
  }

  const handleRequestLoan = async (materialId: string, startDate: Date, endDate: Date) => {
    startTransition(async () => {
      await requestLoan({ materialId, startDate, endDate })
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Matériel</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter du matériel
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter du matériel</DialogTitle>
              <DialogDescription>
                Ajoutez un nouvel équipement à l&apos;inventaire de la caserne.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom</Label>
                <Input
                  id="name"
                  value={newMaterial.name}
                  onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                  placeholder="Ex: Barbecue Weber"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optionnel)</Label>
                <Textarea
                  id="description"
                  value={newMaterial.description}
                  onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                  placeholder="Décrivez le matériel..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inventoryNumber">N° d&apos;inventaire (optionnel)</Label>
                <Input
                  id="inventoryNumber"
                  value={newMaterial.inventoryNumber}
                  onChange={(e) => setNewMaterial({ ...newMaterial, inventoryNumber: e.target.value })}
                  placeholder="INV-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="condition">État</Label>
                <Select
                  value={newMaterial.condition}
                  onValueChange={(value) => setNewMaterial({ ...newMaterial, condition: value as MaterialConditionType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(MaterialConditionLabels) as MaterialConditionType[]).map((condition) => (
                      <SelectItem key={condition} value={condition}>
                        {MaterialConditionLabels[condition]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreateMaterial} disabled={!newMaterial.name}>
                Ajouter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {materials.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun matériel enregistré</p>
            <p className="text-sm">Ajoutez du matériel à l&apos;inventaire !</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {availableMaterials.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-muted-foreground">
                Disponible ({availableMaterials.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {availableMaterials.map((material) => (
                  <MaterialCard
                    key={material.id}
                    material={material}
                    userId={userId}
                    onRequestLoan={handleRequestLoan}
                  />
                ))}
              </div>
            </div>
          )}

          {borrowedMaterials.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-muted-foreground">
                Emprunté ({borrowedMaterials.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {borrowedMaterials.map((material) => (
                  <MaterialCard
                    key={material.id}
                    material={material}
                    userId={userId}
                    onRequestLoan={handleRequestLoan}
                  />
                ))}
              </div>
            </div>
          )}

          {brokenMaterials.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-muted-foreground text-red-600">
                Hors service ({brokenMaterials.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {brokenMaterials.map((material) => (
                  <MaterialCard
                    key={material.id}
                    material={material}
                    userId={userId}
                    onRequestLoan={handleRequestLoan}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
