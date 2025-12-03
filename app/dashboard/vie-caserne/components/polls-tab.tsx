'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  Plus, 
  BarChart3, 
  Clock,
  CheckCircle2,
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
import { vote, createPoll } from '@/lib/features/associative/actions/polls'
import type { PollWithVotes } from '@/lib/features/associative/types'

interface PollOption {
  id: string
  label: string
}

interface PollsTabProps {
  polls: PollWithVotes[]
  userId: string
}

function PollCard({ 
  poll, 
  userId,
  onVote 
}: { 
  poll: PollWithVotes
  userId: string
  onVote: (pollId: string, optionId: string) => Promise<void>
}) {
  const options = (poll.options as unknown) as PollOption[]
  const myVote = poll.votes.find(v => v.userId === userId)
  const totalVotes = poll.votes.length
  const isExpired = poll.expiresAt && new Date(poll.expiresAt) < new Date()

  // Calculer les résultats par option
  const results = options.map(option => {
    const voteCount = poll.votes.filter(v => v.optionId === option.id).length
    const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0
    return {
      ...option,
      voteCount,
      percentage,
    }
  })

  const handleVote = async (optionId: string) => {
    if (!myVote && !isExpired) {
      await onVote(poll.id, optionId)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{poll.question}</CardTitle>
            {poll.event && (
              <CardDescription>Lié à: {poll.event.title}</CardDescription>
            )}
          </div>
          <div className="flex flex-col gap-1 items-end">
            {isExpired ? (
              <Badge variant="secondary">Terminé</Badge>
            ) : poll.expiresAt ? (
              <Badge variant="outline" className="text-orange-600">
                <Clock className="h-3 w-3 mr-1" />
                {formatDistanceToNow(new Date(poll.expiresAt), { locale: fr, addSuffix: true })}
              </Badge>
            ) : (
              <Badge variant="default">En cours</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {results.map((option) => (
          <div key={option.id} className="space-y-1">
            <div className="flex justify-between items-center">
              <span className={`text-sm ${myVote?.optionId === option.id ? 'font-semibold' : ''}`}>
                {option.label}
                {myVote?.optionId === option.id && (
                  <CheckCircle2 className="h-4 w-4 inline ml-2 text-green-600" />
                )}
              </span>
              <span className="text-sm text-muted-foreground">
                {option.voteCount} vote{option.voteCount > 1 ? 's' : ''}
              </span>
            </div>
            <Progress value={option.percentage} className="h-2" />
          </div>
        ))}

        <div className="flex items-center gap-1 text-sm text-muted-foreground pt-2">
          <Users className="h-4 w-4" />
          {totalVotes} participant{totalVotes > 1 ? 's' : ''}
        </div>
      </CardContent>
      
      {!myVote && !isExpired && (
        <CardFooter className="flex-wrap gap-2">
          {options.map((option) => (
            <Button
              key={option.id}
              variant="outline"
              size="sm"
              onClick={() => handleVote(option.id)}
            >
              {option.label}
            </Button>
          ))}
        </CardFooter>
      )}
    </Card>
  )
}

export function PollsTab({ polls, userId }: PollsTabProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newPoll, setNewPoll] = useState({
    question: '',
    options: ['', ''],
    expiresAt: '',
  })

  const activePolls = polls.filter(p => !p.expiresAt || new Date(p.expiresAt) >= new Date())
  const expiredPolls = polls.filter(p => p.expiresAt && new Date(p.expiresAt) < new Date())

  const handleAddOption = () => {
    setNewPoll({ ...newPoll, options: [...newPoll.options, ''] })
  }

  const handleRemoveOption = (index: number) => {
    if (newPoll.options.length > 2) {
      const options = [...newPoll.options]
      options.splice(index, 1)
      setNewPoll({ ...newPoll, options })
    }
  }

  const handleOptionChange = (index: number, value: string) => {
    const options = [...newPoll.options]
    options[index] = value
    setNewPoll({ ...newPoll, options })
  }

  const handleCreatePoll = async () => {
    const validOptions = newPoll.options.filter(o => o.trim())
    if (validOptions.length >= 2) {
      startTransition(async () => {
        await createPoll({
          question: newPoll.question,
          options: validOptions.map((label, index) => ({
            id: `opt-${index}`,
            label,
          })),
          expiresAt: newPoll.expiresAt ? new Date(newPoll.expiresAt) : undefined,
        })
        setNewPoll({ question: '', options: ['', ''], expiresAt: '' })
        setIsDialogOpen(false)
        router.refresh()
      })
    }
  }

  const handleVote = async (pollId: string, optionId: string) => {
    startTransition(async () => {
      await vote({ pollId, optionId })
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Sondages</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau sondage
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Créer un sondage</DialogTitle>
              <DialogDescription>
                Posez une question à l&apos;équipe et récoltez les avis.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="question">Question</Label>
                <Input
                  id="question"
                  value={newPoll.question}
                  onChange={(e) => setNewPoll({ ...newPoll, question: e.target.value })}
                  placeholder="Ex: Quelle date préférez-vous pour la Sainte-Barbe ?"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Options de réponse</Label>
                {newPoll.options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                    />
                    {newPoll.options.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveOption(index)}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddOption}
                >
                  + Ajouter une option
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiresAt">Date de fin (optionnel)</Label>
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  value={newPoll.expiresAt}
                  onChange={(e) => setNewPoll({ ...newPoll, expiresAt: e.target.value })}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleCreatePoll} 
                disabled={!newPoll.question || newPoll.options.filter(o => o.trim()).length < 2}
              >
                Créer le sondage
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {polls.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun sondage</p>
            <p className="text-sm">Créez un sondage pour demander l&apos;avis de l&apos;équipe !</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {activePolls.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-muted-foreground">
                En cours ({activePolls.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {activePolls.map((poll) => (
                  <PollCard
                    key={poll.id}
                    poll={poll}
                    userId={userId}
                    onVote={handleVote}
                  />
                ))}
              </div>
            </div>
          )}

          {expiredPolls.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-muted-foreground">
                Terminés ({expiredPolls.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {expiredPolls.map((poll) => (
                  <PollCard
                    key={poll.id}
                    poll={poll}
                    userId={userId}
                    onVote={handleVote}
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
