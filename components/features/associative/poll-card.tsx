'use client'

import { useState, useTransition } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  BarChart3, 
  Clock, 
  Check,
  Loader2
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

import { vote } from '@/lib/features/associative'
import { type PollWithVotes, type PollOption } from '@/lib/features/associative/types'
import { toast } from 'sonner'

interface PollCardProps {
  poll: PollWithVotes
  currentUserId?: string
  onVoted?: () => void
}

export function PollCard({ poll, currentUserId, onVoted }: PollCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const options = poll.options as unknown as PollOption[]
  const totalVotes = poll.votes.length
  const isExpired = poll.expiresAt ? new Date(poll.expiresAt) < new Date() : false

  // Trouver si l'utilisateur a déjà voté
  const myVote = currentUserId 
    ? poll.votes.find(v => v.userId === currentUserId)
    : null
  const hasVoted = !!myVote

  // Calculer les résultats
  const results = options.map(option => {
    const voteCount = poll.votes.filter(v => v.optionId === option.id).length
    return {
      ...option,
      votes: voteCount,
      percentage: totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0
    }
  })

  const handleVote = () => {
    if (!selectedOption) return

    startTransition(async () => {
      const result = await vote({
        pollId: poll.id,
        optionId: selectedOption,
      })

      if (result.success) {
        toast.success('Vote enregistré!')
        onVoted?.()
      } else {
        toast.error(result.error || 'Erreur lors du vote')
      }
    })
  }

  return (
    <Card className={`
      transition-all hover:shadow-md
      ${isExpired ? 'opacity-75' : ''}
    `}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              {poll.question}
            </CardTitle>
            {poll.event && (
              <CardDescription>
                Lié à: {poll.event.title}
              </CardDescription>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            {isExpired && (
              <Badge variant="secondary">Terminé</Badge>
            )}
            {poll.expiresAt && !isExpired && (
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Fin: {format(new Date(poll.expiresAt), 'd MMM', { locale: fr })}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Mode vote (non voté, non expiré) */}
        {!hasVoted && !isExpired && (
          <RadioGroup
            value={selectedOption || ''}
            onValueChange={setSelectedOption}
            className="space-y-2"
          >
            {options.map((option) => (
              <div
                key={option.id}
                className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <RadioGroupItem value={option.id} id={option.id} />
                <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}

        {/* Mode résultats (voté ou expiré) */}
        {(hasVoted || isExpired) && (
          <div className="space-y-3">
            {results.map((option) => (
              <div key={option.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    {option.label}
                    {myVote?.optionId === option.id && (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
                  </span>
                  <span className="text-muted-foreground">
                    {option.votes} vote{option.votes > 1 ? 's' : ''} ({option.percentage}%)
                  </span>
                </div>
                <Progress value={option.percentage} className="h-2" />
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="text-sm text-muted-foreground text-center">
          {totalVotes} vote{totalVotes > 1 ? 's' : ''} au total
        </div>
      </CardContent>

      {/* Bouton voter */}
      {!hasVoted && !isExpired && (
        <CardFooter>
          <Button
            className="w-full"
            onClick={handleVote}
            disabled={!selectedOption || isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Voter
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
