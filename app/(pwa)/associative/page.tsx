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
  getEventsStats,
  getMoneyPotsStats,
  getMaterialStats,
} from '@/lib/features/associative'

import {
  EventsTab,
  MoneyPotsTab,
  MaterialsTab,
  PollsTab,
  StatsCards
} from '@/components/associative'

export const metadata = {
  title: 'Vie de Caserne | Amicale SP',
  description: 'Gérez les événements, cagnottes et emprunts de matériel de l\'amicale',
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
    eventsStats,
    potsStats,
    materialStats,
  ] = await Promise.all([
    getEvents({ upcoming: true, pageSize: 10 }),
    getActiveMoneyPots(),
    getAllMaterials(),
    getActivePolls(),
    getEventsStats(),
    getMoneyPotsStats(),
    getMaterialStats(),
  ])

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

        {/* Stats Overview */}
        <Suspense fallback={<StatsCardsSkeleton />}>
          <StatsCards
            events={eventsStats}
            pots={potsStats}
            materials={materialStats}
          />
        </Suspense>

        {/* Tabs */}
        <Tabs defaultValue="events" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="events" className="flex items-center gap-2">
              📅 <span className="hidden sm:inline">Événements</span>
            </TabsTrigger>
            <TabsTrigger value="pots" className="flex items-center gap-2">
              💰 <span className="hidden sm:inline">Cagnottes</span>
            </TabsTrigger>
            <TabsTrigger value="materials" className="flex items-center gap-2">
              📦 <span className="hidden sm:inline">Matériel</span>
            </TabsTrigger>
            <TabsTrigger value="polls" className="flex items-center gap-2">
              📊 <span className="hidden sm:inline">Sondages</span>
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

function StatsCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-lg" />
      ))}
    </div>
  )
}
