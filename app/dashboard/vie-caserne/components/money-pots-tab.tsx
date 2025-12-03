deveno'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  Wallet, 
  Target,
  TrendingUp,
  Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
import { createMoneyPot, contributeToPot } from '@/lib/features/associative/actions/money-pots'
import type { MoneyPotWithDetails } from '@/lib/features/associative/types'
import { PotStatusLabels } from '@/lib/features/associative/types'

interface MoneyPotsTabProps {
  pots: MoneyPotWithDetails[]
  userId: string
}

function MoneyPotCard({ 
  pot, 
  onContribute 
}: { 
  pot: MoneyPotWithDetails
  onContribute: (potId: string, amount: number) => Promise<void>
}) {
  const [isContributing, setIsContributing] = useState(false)
  const [amount, setAmount] = useState('')

  // Calculer le total collecté
  const totalCollected = pot.contributions
    .filter(c => c.status === 'COMPLETED')
    .reduce((sum, c) => sum + Number(c.amount), 0)
  
  const progress = pot.targetAmount 
    ? Math.min((totalCollected / Number(pot.targetAmount)) * 100, 100) 
    : 0

  const contributorsCount = new Set(
    pot.contributions.filter(c => c.status === 'COMPLETED').map(c => c.userId)
  ).size

  const handleContribute = async () => {
    const amountNum = parseFloat(amount)
    if (amountNum > 0) {
      await onContribute(pot.id, amountNum * 100) // Convertir en centimes
      setAmount('')
      setIsContributing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{pot.title}</CardTitle>
            <CardDescription>{pot.description}</CardDescription>
          </div>
          <Badge variant={
            pot.status === 'ACTIVE' ? 'default' :
            pot.status === 'COMPLETED' ? 'secondary' : 'outline'
          }>
            {PotStatusLabels[pot.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="font-semibold">{totalCollected.toFixed(2)}€</span>
            {pot.targetAmount && (
              <span className="text-muted-foreground">/ {Number(pot.targetAmount).toFixed(0)}€</span>
            )}
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-4 w-4" />
            {contributorsCount} contributeur{contributorsCount > 1 ? 's' : ''}
          </div>
        </div>

        {pot.targetAmount && (
          <div className="space-y-1">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-right">
              {progress.toFixed(0)}% de l&apos;objectif
            </p>
          </div>
        )}
      </CardContent>
      {pot.status === 'ACTIVE' && (
        <CardFooter>
          {isContributing ? (
            <div className="flex gap-2 w-full">
              <Input
                type="number"
                placeholder="Montant (€)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                step="0.01"
                className="flex-1"
              />
              <Button size="sm" onClick={handleContribute}>
                Valider
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsContributing(false)}>
                Annuler
              </Button>
            </div>
          ) : (
            <Button className="w-full" onClick={() => setIsContributing(true)}>
              <Wallet className="h-4 w-4 mr-2" />
              Contribuer
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  )
}

export function MoneyPotsTab({ pots, userId }: MoneyPotsTabProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newPot, setNewPot] = useState({
    title: '',
    description: '',
    targetAmount: '',
  })

  const activePots = pots.filter(p => p.status === 'ACTIVE')
  const closedPots = pots.filter(p => p.status !== 'ACTIVE')

  const handleCreatePot = async () => {
    startTransition(async () => {
      await createMoneyPot({
        title: newPot.title,
        description: newPot.description || undefined,
        targetAmount: newPot.targetAmount ? parseFloat(newPot.targetAmount) : undefined,
      })
      setNewPot({ title: '', description: '', targetAmount: '' })
      setIsDialogOpen(false)
      router.refresh()
    })
  }

  const handleContribute = async (potId: string, amountCents: number) => {
    const result = await contributeToPot({
      potId,
      amount: amountCents,
    })
    
    if (result.success && result.clientSecret) {
      // TODO: Ouvrir modal Stripe avec le clientSecret
      console.log('Stripe Payment Intent créé:', result.clientSecret)
    }
    router.refresh()
  }

  // Ignore userId for now - used for future features like showing user's contributions
  void userId

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Cagnottes</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle cagnotte
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une cagnotte</DialogTitle>
              <DialogDescription>
                Créez une cagnotte pour collecter des fonds pour un événement ou un projet.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  value={newPot.title}
                  onChange={(e) => setNewPot({ ...newPot, title: e.target.value })}
                  placeholder="Ex: Sainte-Barbe 2025"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optionnel)</Label>
                <Textarea
                  id="description"
                  value={newPot.description}
                  onChange={(e) => setNewPot({ ...newPot, description: e.target.value })}
                  placeholder="Décrivez le but de cette cagnotte..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target">Objectif (€, optionnel)</Label>
                <div className="relative">
                  <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="target"
                    type="number"
                    value={newPot.targetAmount}
                    onChange={(e) => setNewPot({ ...newPot, targetAmount: e.target.value })}
                    className="pl-9"
                    placeholder="500"
                    min="0"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreatePot} disabled={!newPot.title}>
                Créer la cagnotte
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {activePots.length === 0 && closedPots.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune cagnotte</p>
            <p className="text-sm">Créez une cagnotte pour collecter des fonds !</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {activePots.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-muted-foreground">Cagnottes actives</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {activePots.map((pot) => (
                  <MoneyPotCard
                    key={pot.id}
                    pot={pot}
                    onContribute={handleContribute}
                  />
                ))}
              </div>
            </div>
          )}

          {closedPots.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-muted-foreground">Cagnottes terminées</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {closedPots.map((pot) => (
                  <MoneyPotCard
                    key={pot.id}
                    pot={pot}
                    onContribute={handleContribute}
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
