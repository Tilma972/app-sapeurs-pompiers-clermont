'use client'

import { useState } from 'react'
import { 
  Wallet, 
  Users, 
  Target, 
  Loader2,
  Heart,
  MessageSquare,
  Eye,
  EyeOff
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
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

import { contributeToPot } from '@/lib/features/associative'
import { PotStatusLabels, type MoneyPotWithDetails } from '@/lib/features/associative/types'
import { toast } from 'sonner'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

// Charger Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface MoneyPotCardProps {
  pot: MoneyPotWithDetails
  onContribute?: () => void
}

export function MoneyPotCard({ pot, onContribute }: MoneyPotCardProps) {
  const [showContributeDialog, setShowContributeDialog] = useState(false)

  const totalCollected = pot.totalCollected || 0
  const targetAmount = pot.targetAmount ? Number(pot.targetAmount) : null
  const progress = targetAmount ? (totalCollected / targetAmount) * 100 : 0
  const contributorsCount = pot._count?.contributions || 0

  const isActive = pot.status === 'ACTIVE'
  const isCompleted = pot.status === 'COMPLETED'

  return (
    <>
      <Card className={`
        relative overflow-hidden transition-all hover:shadow-md
        ${!isActive ? 'opacity-80' : ''}
      `}>
        {/* Indicateur de statut */}
        {isCompleted && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-green-500">
              <Target className="h-3 w-3 mr-1" />
              Objectif atteint!
            </Badge>
          </div>
        )}

        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            {pot.title}
          </CardTitle>
          {pot.event && (
            <CardDescription>
              Lié à: {pot.event.title}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {pot.description && (
            <p className="text-sm text-muted-foreground">
              {pot.description}
            </p>
          )}

          {/* Progression */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">
                {totalCollected.toFixed(2)}€ collectés
              </span>
              {targetAmount && (
                <span className="text-muted-foreground">
                  Objectif: {targetAmount.toFixed(2)}€
                </span>
              )}
            </div>
            {targetAmount && (
              <Progress value={Math.min(progress, 100)} className="h-2" />
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{contributorsCount} contributeur{contributorsCount > 1 ? 's' : ''}</span>
            </div>
            <Badge variant="outline">
              {PotStatusLabels[pot.status]}
            </Badge>
          </div>
        </CardContent>

        <CardFooter>
          {isActive && (
            <Button 
              className="w-full" 
              onClick={() => setShowContributeDialog(true)}
            >
              <Heart className="h-4 w-4 mr-2" />
              Contribuer
            </Button>
          )}
          {!isActive && (
            <Button variant="outline" className="w-full" disabled>
              Cagnotte clôturée
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Dialog de contribution */}
      <ContributeDialog
        pot={pot}
        open={showContributeDialog}
        onOpenChange={setShowContributeDialog}
        onSuccess={() => {
          setShowContributeDialog(false)
          onContribute?.()
        }}
      />
    </>
  )
}

// Dialog de contribution
interface ContributeDialogProps {
  pot: MoneyPotWithDetails
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

function ContributeDialog({ pot, open, onOpenChange, onSuccess }: ContributeDialogProps) {
  const [step, setStep] = useState<'amount' | 'payment'>('amount')
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleAmountSubmit = async () => {
    const amountInCents = Math.round(parseFloat(amount) * 100)
    
    if (isNaN(amountInCents) || amountInCents < 100) {
      toast.error('Le montant minimum est de 1€')
      return
    }

    setIsLoading(true)
    try {
      const result = await contributeToPot({
        potId: pot.id,
        amount: amountInCents,
        message: message || undefined,
        isAnonymous,
      })

      if (result.success && result.clientSecret) {
        setClientSecret(result.clientSecret)
        setStep('payment')
      } else {
        toast.error(result.error || 'Erreur lors de la création du paiement')
      }
    } catch {
      toast.error('Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setStep('amount')
    setAmount('')
    setMessage('')
    setIsAnonymous(false)
    setClientSecret(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Contribuer à la cagnotte</DialogTitle>
          <DialogDescription>
            {pot.title}
          </DialogDescription>
        </DialogHeader>

        {step === 'amount' && (
          <div className="space-y-4">
            {/* Montant */}
            <div className="space-y-2">
              <Label htmlFor="amount">Montant (€) *</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                step="0.01"
                placeholder="10.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {/* Boutons rapides */}
              <div className="flex gap-2">
                {[5, 10, 20, 50].map((val) => (
                  <Button
                    key={val}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(val.toString())}
                  >
                    {val}€
                  </Button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Message (optionnel)
              </Label>
              <Textarea
                id="message"
                placeholder="Un petit mot..."
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            {/* Anonyme */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                {isAnonymous ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
                <Label htmlFor="anonymous">Contribution anonyme</Label>
              </div>
              <Switch
                id="anonymous"
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button onClick={handleAmountSubmit} disabled={isLoading || !amount}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continuer vers le paiement
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'payment' && clientSecret && (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: { theme: 'stripe' },
            }}
          >
            <PaymentForm
              amount={parseFloat(amount)}
              onSuccess={() => {
                toast.success('Merci pour votre contribution!')
                handleClose()
                onSuccess?.()
              }}
              onCancel={handleClose}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Formulaire de paiement Stripe
function PaymentForm({ 
  amount, 
  onSuccess, 
  onCancel 
}: { 
  amount: number
  onSuccess: () => void
  onCancel: () => void 
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) return

    setIsProcessing(true)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard/vie-caserne?contribution=success`,
      },
      redirect: 'if_required',
    })

    if (error) {
      toast.error(error.message || 'Erreur lors du paiement')
      setIsProcessing(false)
    } else {
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border p-4 bg-muted/50">
        <p className="text-sm text-center text-muted-foreground mb-4">
          Montant: <strong>{amount.toFixed(2)}€</strong>
        </p>
        <PaymentElement />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Retour
        </Button>
        <Button type="submit" disabled={!stripe || isProcessing}>
          {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Payer {amount.toFixed(2)}€
        </Button>
      </DialogFooter>
    </form>
  )
}
