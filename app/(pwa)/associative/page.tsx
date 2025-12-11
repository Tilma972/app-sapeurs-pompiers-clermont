import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { PwaContainer } from '@/components/layouts/pwa/pwa-container'

import {
  getEvents,
  getActiveMoneyPots,
  getAllMaterials,
  getActivePolls,
} from '@/lib/features/associative'

import {
  EventsTab,
  MoneyPotsTab,
  MaterialsTab,
  PollsTab,
  RecentActivitiesFeed,
  type RecentActivity
} from '@/components/associative'

export const metadata = {
  title: 'Vie de Caserne | Amicale SP',
  description: 'Gérez les événements, cagnottes et emprunts de matériel de l\'amicale',
}

// Helper pour créer le feed des nouveautés
function buildRecentActivities(
  events: any[],
  moneyPots: any[],
  polls: any[]
): RecentActivity[] {
  const activities: RecentActivity[] = []
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Nouveaux événements (créés dans les 7 derniers jours)
  events
    .filter(e => new Date(e.createdAt) > sevenDaysAgo)
    .slice(0, 3)
    .forEach(event => {
      activities.push({
        id: `event-${event.id}`,
        type: 'event',
        title: event.title,
        subtitle: `Le ${new Date(event.date).toLocaleDateString('fr-FR')}`,
        date: new Date(event.createdAt),
        actionLabel: 'Participer',
        actionUrl: '/associative#events',
        metadata: {
          participants: event.participants?.length || 0
        }
      })
    })

  // Cagnottes actives (nouvelles ou proches de l'objectif)
  moneyPots
    .filter(pot => {
      const isNew = new Date(pot.createdAt) > sevenDaysAgo
      const progress = pot.targetAmount ? (pot.totalCollected / Number(pot.targetAmount)) * 100 : 0
      return isNew || progress > 75
    })
    .slice(0, 2)
    .forEach(pot => {
      const progress = pot.targetAmount ? Math.round((pot.totalCollected / Number(pot.targetAmount)) * 100) : 0
      activities.push({
        id: `pot-${pot.id}`,
        type: 'money_pot',
        title: pot.title,
        subtitle: pot.targetAmount ? `${pot.totalCollected}€ / ${pot.targetAmount}€` : undefined,
        date: new Date(pot.createdAt),
        actionLabel: 'Contribuer',
        actionUrl: '/associative#pots',
        metadata: { progress }
      })
    })

  // Sondages actifs (expiration proche)
  polls
    .filter(poll => {
      if (!poll.expiresAt) return false
      const expiresAt = new Date(poll.expiresAt)
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
      return expiresAt > now && expiresAt < threeDaysFromNow
    })
    .slice(0, 2)
    .forEach(poll => {
      activities.push({
        id: `poll-${poll.id}`,
        type: 'poll',
        title: poll.question,
        subtitle: poll.expiresAt ? `Expire le ${new Date(poll.expiresAt).toLocaleDateString('fr-FR')}` : undefined,
        date: new Date(poll.createdAt),
        actionLabel: 'Voter',
        actionUrl: '/associative#polls',
        metadata: {
          votes: poll._count?.votes || 0
        }
      })
    })

  // Tri par date décroissante et limite à 5
  return activities
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5)
}

export default async function AssociativePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Charger les données en parallèle
  const [
    eventsData,
    moneyPots,
    materials,
    polls,
  ] = await Promise.all([
    getEvents({ upcoming: true, pageSize: 10 }),
    getActiveMoneyPots(),
    getAllMaterials(),
    getActivePolls(),
  ])

  // Construire le feed des nouveautés
  const recentActivities = buildRecentActivities(
    eventsData.items,
    moneyPots,
    polls
  )

  // Compter les items actifs pour les badges
  const upcomingEventsCount = eventsData.items.filter(e =>
    new Date(e.date) >= new Date() && e.status !== 'CANCELLED'
  ).length
  const activePotsCount = moneyPots.length
  const availableMaterialsCount = materials.filter(m => m.isAvailable).length
  const activePollsCount = polls.length

  return (
    <PwaContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">🏠 Vie de Caserne</h1>
          <p className="text-sm text-muted-foreground">
            Événements, cagnottes, matériel et sondages de l&apos;amicale
          </p>
        </div>

        {/* Recent Activities Feed */}
        <Suspense fallback={<RecentActivitiesSkeleton />}>
          <RecentActivitiesFeed activities={recentActivities} />
        </Suspense>

        {/* Tabs with Counters */}
        <Tabs defaultValue="events" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="events" className="flex items-center gap-2">
              📅 <span className="hidden sm:inline">Événements</span>
              {upcomingEventsCount > 0 && (
                <span className="ml-1 text-xs">({upcomingEventsCount})</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="pots" className="flex items-center gap-2">
              💰 <span className="hidden sm:inline">Cagnottes</span>
              {activePotsCount > 0 && (
                <span className="ml-1 text-xs">({activePotsCount})</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="materials" className="flex items-center gap-2">
              📦 <span className="hidden sm:inline">Matériel</span>
              {availableMaterialsCount > 0 && (
                <span className="ml-1 text-xs">({availableMaterialsCount})</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="polls" className="flex items-center gap-2">
              📊 <span className="hidden sm:inline">Sondages</span>
              {activePollsCount > 0 && (
                <span className="ml-1 text-xs">({activePollsCount})</span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-4">
            <EventsTab
              events={eventsData.items}
              userId={user.id}
            />
          </TabsContent>

          <TabsContent value="pots" className="space-y-4">
            <MoneyPotsTab pots={moneyPots} userId={user.id} />
          </TabsContent>

          <TabsContent value="materials" className="space-y-4">
            <MaterialsTab materials={materials} userId={user.id} />
          </TabsContent>

          <TabsContent value="polls" className="space-y-4">
            <PollsTab
              polls={polls}
              userId={user.id}
            />
          </TabsContent>
        </Tabs>
      </div>
    </PwaContainer>
  )
}

function RecentActivitiesSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-6 w-48" />
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-lg" />
      ))}
    </div>
  )
}
