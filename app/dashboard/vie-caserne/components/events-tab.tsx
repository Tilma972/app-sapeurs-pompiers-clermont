'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  Plus, 
  CalendarDays, 
  Users, 
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { 
  CreateEventDialog 
} from '@/components/features/associative'
import { updateParticipation } from '@/lib/features/associative/actions/events'
import type { 
  EventWithDetails,
} from '@/lib/features/associative/types'
import { EventTypeLabels } from '@/lib/features/associative/types'

// Les statuts de participation selon le schéma Prisma
type ParticipationStatusType = 'PRESENT' | 'ABSENT' | 'ASTREINTE'

interface EventsTabProps {
  events: EventWithDetails[]
  userId: string
}

const statusConfig: Record<ParticipationStatusType, { 
  icon: React.ElementType
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline' 
}> = {
  PRESENT: { icon: CheckCircle2, label: 'Présent', variant: 'default' },
  ABSENT: { icon: XCircle, label: 'Absent', variant: 'destructive' },
  ASTREINTE: { icon: AlertTriangle, label: 'Astreinte', variant: 'secondary' },
}

function EventCard({ 
  event, 
  userId, 
  onParticipate 
}: { 
  event: EventWithDetails
  userId: string
  onParticipate: (eventId: string, status: ParticipationStatusType) => void
}) {
  const myParticipation = event.participants.find(p => p.userId === userId)
  const presentCount = event.participants.filter(p => p.status === 'PRESENT').length
  const astreinteCount = event.participants.filter(p => p.status === 'ASTREINTE').length
  
  const isPast = new Date(event.date) < new Date()
  const isCancelled = event.status === 'CANCELLED'

  return (
    <Card className={isCancelled ? 'opacity-60' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{event.title}</CardTitle>
            <CardDescription>{event.description}</CardDescription>
          </div>
          <Badge variant={
            event.type === 'SPORT' ? 'default' :
            event.type === 'SAINTE_BARBE' ? 'secondary' :
            event.type === 'AG' ? 'outline' : 'default'
          }>
            {EventTypeLabels[event.type]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <CalendarDays className="h-4 w-4" />
            {format(new Date(event.date), 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}
          </div>
        </div>
        {event.location && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {event.location}
          </div>
        )}
        <div className="flex items-center gap-1 text-sm">
          <Users className="h-4 w-4" />
          <span>{presentCount} présent{presentCount > 1 ? 's' : ''}</span>
          {astreinteCount > 0 && (
            <span className="text-muted-foreground">· {astreinteCount} en astreinte</span>
          )}
          {event.maxParticipants && (
            <span className="text-muted-foreground">/ {event.maxParticipants} max</span>
          )}
        </div>
      </CardContent>
      {!isPast && !isCancelled && (
        <CardFooter className="gap-2">
          {(['PRESENT', 'ASTREINTE', 'ABSENT'] as ParticipationStatusType[]).map((status) => {
            const config = statusConfig[status]
            const Icon = config.icon
            const isActive = myParticipation?.status === status
            return (
              <Button
                key={status}
                variant={isActive ? config.variant : 'outline'}
                size="sm"
                onClick={() => onParticipate(event.id, status)}
              >
                <Icon className="h-4 w-4 mr-1" />
                {config.label}
              </Button>
            )
          })}
        </CardFooter>
      )}
    </Card>
  )
}

export function EventsTab({ events, userId }: EventsTabProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const now = new Date()
  const upcomingEvents = events
    .filter(e => new Date(e.date) >= now && e.status !== 'CANCELLED')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const pastEvents = events
    .filter(e => new Date(e.date) < now || e.status === 'CANCELLED')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const handleParticipate = (eventId: string, status: ParticipationStatusType) => {
    startTransition(async () => {
      await updateParticipation({ eventId, status })
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Événements</h2>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Créer un événement
        </Button>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList>
          <TabsTrigger value="upcoming">
            À venir ({upcomingEvents.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Passés ({pastEvents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          {upcomingEvents.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun événement à venir</p>
                <p className="text-sm">Créez un nouvel événement pour rassembler l&apos;équipe !</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {upcomingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  userId={userId}
                  onParticipate={handleParticipate}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          {pastEvents.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <p>Aucun événement passé</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pastEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  userId={userId}
                  onParticipate={handleParticipate}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreateEventDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
      />
    </div>
  )
}
