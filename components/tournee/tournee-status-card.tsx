"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Flame } from "lucide-react"

interface TourneeStatusCardProps {
  status: 'active' | 'inactive'
  startTime?: string
  secteur?: string
  count: number
  amount: number
}

export function TourneeStatusCard({ 
  status, 
  startTime, 
  secteur, 
  count, 
  amount 
}: TourneeStatusCardProps) {
  const nf = new Intl.NumberFormat('fr-FR')
  const currency = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
  const average = count > 0 ? Math.round(amount / count) : 0
  if (status === 'inactive') {
    return (
      <Card className="bg-card border border-border">
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>Aucune tournée active</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border border-border">
      <CardContent className="py-6 px-4 sm:px-6">
        {/* Header avec responsive flex-wrap */}
        <div className="flex items-start gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 shrink-0 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
              <Flame size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-bold truncate">
                TOURNÉE ACTIVE
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                ⏱️ Démarrée à {startTime}
              </p>
            </div>
          </div>
          
          {secteur && (
            <Badge variant="secondary" className="shrink-0 text-xs sm:text-sm">
              📍 {secteur}
            </Badge>
          )}
        </div>
        
        {/* Stats grid avec meilleure gestion responsive */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4">
          <div className="bg-muted rounded-lg p-3 min-w-0">
            <p className="text-xs sm:text-sm text-muted-foreground truncate">Calendriers</p>
            <p className="text-xl sm:text-2xl font-bold truncate">{nf.format(count)}</p>
          </div>
          <div className="bg-muted rounded-lg p-3 min-w-0">
            <p className="text-xs sm:text-sm text-muted-foreground truncate">Montant</p>
            <p className="text-xl sm:text-2xl font-bold text-primary truncate">{currency.format(amount)}</p>
            {count > 0 && (
              <p className="text-xs text-muted-foreground mt-1 truncate">~{nf.format(average)} €/cal</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
