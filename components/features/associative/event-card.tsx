'use client'

import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  CalendarDays, 
  MapPin, 
  Users, 
  Check, 
  X, 
  Clock,
  Wallet
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import { 
  EventTypeLabels, 
  EventStatusLabels,
  type EventWithDetails 
} from '@/lib/features/associative/types'

interface EventCardProps {
  event: EventWithDetails
  currentUserId?: string
  onParticipate?: (status: 'PRESENT' | 'ABSENT' | 'ASTREINTE') => void
  onViewDetails?: () => void
}

const typeColors: Record<string, string> = {
  AG: 'bg-blue-500',
  SAINTE_BARBE: 'bg-red-500',
  REPAS_GARDE: 'bg-orange-500',
  SPORT: 'bg-green-500',
  AUTRE: 'bg-gray-500',
}

export function EventCard({ 
  event, 
  currentUserId,
  onParticipate,
  onViewDetails 
}: EventCardProps) {
  const isPast = new Date(event.date) < new Date()
  const isCancelled = event.status === 'CANCELLED'

  // Trouver la participation de l'utilisateur courant
  const myParticipation = currentUserId 
    ? event.participants.find(p => p.userId === currentUserId)
    : null

  // Compter les présents
  const presentCount = event.participants.filter(p => p.status === 'PRESENT').length
  const totalGuests = event.participants.reduce((sum, p) => sum + (p.guests || 0), 0)
  const isFull = event.maxParticipants ? presentCount >= event.maxParticipants : false

  // Calculer le montant collecté si cagnotte
  const moneyPotWithContributions = event.moneyPot as (typeof event.moneyPot & { 
    contributions?: Array<{ amount: number | string }> 
  }) | null
  const potTotal = moneyPotWithContributions?.contributions?.reduce(
    (sum: number, c: { amount: number | string }) => sum + Number(c.amount), 
    0
  ) || 0

  return (
    <Card className={`
      relative overflow-hidden transition-all hover:shadow-md
      ${isCancelled ? 'opacity-60' : ''}
      ${isPast && !isCancelled ? 'bg-muted/30' : ''}
    `}>
      {/* Badge type */}
      <div className={`absolute top-0 right-0 w-2 h-full ${typeColors[event.type]}`} />
      
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{event.title}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {EventTypeLabels[event.type]}
              </Badge>
              {isCancelled && (
                <Badge variant="destructive" className="text-xs">
                  {EventStatusLabels[event.status]}
                </Badge>
              )}
              {isPast && !isCancelled && (
                <Badge variant="outline" className="text-xs">
                  Passé
                </Badge>
              )}
              {isFull && !isPast && !isCancelled && (
                <Badge variant="destructive" className="text-xs">
                  Complet
                </Badge>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-2">
        {/* Date */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          <span>
            {format(new Date(event.date), "EEEE d MMMM yyyy 'à' HH'h'mm", { locale: fr })}
          </span>
        </div>

        {/* Lieu */}
        {event.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{event.location}</span>
          </div>
        )}

        {/* Participants */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>
            {presentCount} présent{presentCount > 1 ? 's' : ''}
            {totalGuests > 0 && ` (+${totalGuests} invité${totalGuests > 1 ? 's' : ''})`}
            {event.maxParticipants && ` / ${event.maxParticipants} max`}
          </span>
        </div>

        {/* Cagnotte */}
        {event.moneyPot && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wallet className="h-4 w-4" />
            <span>
              {potTotal.toFixed(2)}€ collectés
              {event.moneyPot.targetAmount && (
                <> / {Number(event.moneyPot.targetAmount).toFixed(2)}€</>
              )}
            </span>
          </div>
        )}

        {/* Description tronquée */}
        {event.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {event.description}
          </p>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-2 pt-2">
        {/* Boutons de participation */}
        {!isPast && !isCancelled && onParticipate && (
          <div className="flex gap-2 w-full">
            <Button
              size="sm"
              variant={myParticipation?.status === 'PRESENT' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => onParticipate('PRESENT')}
              disabled={isFull && myParticipation?.status !== 'PRESENT'}
            >
              <Check className="h-4 w-4 mr-1" />
              Présent
            </Button>
            <Button
              size="sm"
              variant={myParticipation?.status === 'ABSENT' ? 'destructive' : 'outline'}
              className="flex-1"
              onClick={() => onParticipate('ABSENT')}
            >
              <X className="h-4 w-4 mr-1" />
              Absent
            </Button>
            <Button
              size="sm"
              variant={myParticipation?.status === 'ASTREINTE' ? 'secondary' : 'outline'}
              className="flex-1"
              onClick={() => onParticipate('ASTREINTE')}
            >
              <Clock className="h-4 w-4 mr-1" />
              Astreinte
            </Button>
          </div>
        )}

        {/* Bouton voir détails */}
        {onViewDetails && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={onViewDetails}
          >
            Voir les détails
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
