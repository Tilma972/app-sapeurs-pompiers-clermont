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
      <CardContent className="py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
              <Flame size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                TOURNÉE ACTIVE
              </h2>
              <p className="text-sm text-muted-foreground">
                ⏱️ Démarrée à {startTime}
              </p>
            </div>
          </div>
          
          {secteur && (
            <Badge variant="secondary">
              📍 {secteur}
            </Badge>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-muted rounded-lg p-3">
            <p className="text-sm text-muted-foreground">Calendriers</p>
            <p className="text-2xl font-bold">{nf.format(count)}</p>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <p className="text-sm text-muted-foreground">Montant</p>
            <p className="text-2xl font-bold text-primary">{currency.format(amount)}</p>
            {count > 0 && (
              <p className="text-xs text-muted-foreground mt-1">~{nf.format(average)} €/cal</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
