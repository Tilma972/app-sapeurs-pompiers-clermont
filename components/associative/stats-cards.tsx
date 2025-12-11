import { 
  CalendarDays, 
  Wallet, 
  Package, 
  BarChart3 
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StatsCardsProps {
  events: {
    upcoming: number
    past: number
    totalParticipants: number
  }
  pots: {
    activePots: number
    totalCollected: number
    totalContributions: number
  }
  materials: {
    total: number
    available: number
    activeLoans: number
    pendingLoans: number
  }
}

export function StatsCards({ events, pots, materials }: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {/* Événements */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Événements</CardTitle>
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{events.upcoming}</div>
          <p className="text-xs text-muted-foreground">
            à venir · {events.totalParticipants} inscriptions
          </p>
        </CardContent>
      </Card>

      {/* Cagnottes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cagnottes</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pots.totalCollected.toFixed(0)}€</div>
          <p className="text-xs text-muted-foreground">
            collectés · {pots.activePots} active{pots.activePots > 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Matériel */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Matériel</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{materials.available}/{materials.total}</div>
          <p className="text-xs text-muted-foreground">
            disponibles · {materials.activeLoans} emprunt{materials.activeLoans > 1 ? 's' : ''} en cours
          </p>
        </CardContent>
      </Card>

      {/* Emprunts en attente */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">À traiter</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{materials.pendingLoans}</div>
          <p className="text-xs text-muted-foreground">
            demande{materials.pendingLoans > 1 ? 's' : ''} d&apos;emprunt en attente
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
