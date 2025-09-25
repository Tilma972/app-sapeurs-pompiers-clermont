"use client"

import { useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface TeamData {
  team: string
  totalAmountCollected: number
  totalCalendarsDistributed: number
  progression_pourcentage: number
  couleur: string
  secteur: string
}

interface TeamProgressChartProps {
  data: TeamData[]
  className?: string
}

export function TeamProgressChart({ data, className }: TeamProgressChartProps) {
  // Configuration du graphique avec couleurs dynamiques des équipes
  const chartConfig = useMemo(() => {
    const config: ChartConfig = {
      totalAmountCollected: {
        label: "Montant collecté (€)",
      },
      totalCalendarsDistributed: {
        label: "Calendriers distribués",
      },
    }

    // Ajouter les configurations pour chaque équipe avec leurs couleurs
    data.forEach((team) => {
      config[team.team] = {
        label: team.team,
        color: team.couleur || `hsl(${Math.random() * 360}, 70%, 60%)`,
      }
    })

    return config
  }, [data])

  // Transformation des données pour le graphique horizontal empilé 100%
  const chartData = useMemo(() => {
    if (!data.length) return []

    // Calculer les totaux globaux pour le pourcentage
    const totalAmount = data.reduce((sum, team) => sum + team.totalAmountCollected, 0)
    const totalCalendars = data.reduce((sum, team) => sum + team.totalCalendarsDistributed, 0)

    return [
      {
        category: "Montant (€)",
        ...data.reduce((acc, team) => {
          const percentage = totalAmount > 0 ? (team.totalAmountCollected / totalAmount) * 100 : 0
          acc[team.team] = {
            value: percentage,
            rawValue: team.totalAmountCollected,
            unit: "€",
            secteur: team.secteur,
          }
          return acc
        }, {} as Record<string, { value: number; rawValue: number; unit: string; secteur: string }>),
      },
      {
        category: "Calendriers",
        ...data.reduce((acc, team) => {
          const percentage = totalCalendars > 0 ? (team.totalCalendarsDistributed / totalCalendars) * 100 : 0
          acc[team.team] = {
            value: percentage,
            rawValue: team.totalCalendarsDistributed,
            unit: "calendriers",
            secteur: team.secteur,
          }
          return acc
        }, {} as Record<string, { value: number; rawValue: number; unit: string; secteur: string }>),
      },
    ]
  }, [data])

  // Custom tooltip optimisé pour mobile
  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean
    payload?: Array<{
      dataKey: string
      color: string
      payload: Record<string, { value: number; rawValue: number; unit: string; secteur: string }>
    }>
    label?: string
  }) => {
    if (!active || !payload?.length) return null

    const categoryLabel = label === "Montant (€)" ? "Collecte" : "Distribution"

    return (
      <div className="rounded-lg border bg-background p-2 sm:p-3 shadow-lg max-w-xs">
        <h4 className="font-semibold text-xs sm:text-sm mb-1 sm:mb-2">{categoryLabel}</h4>
        <div className="space-y-1 sm:space-y-2">
          {payload.map((entry, index: number) => {
            const teamData = entry.payload[entry.dataKey]
            if (!teamData || typeof teamData !== "object") return null

            return (
              <div key={index} className="flex items-start justify-between gap-2 sm:gap-4">
                <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
                  <div
                    className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs sm:text-sm font-medium truncate">
                    {entry.dataKey}
                  </span>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs sm:text-sm font-bold">
                    {teamData.rawValue} {teamData.unit}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {teamData.value.toFixed(1)}%
                  </div>
                  {teamData.secteur && (
                    <div className="text-xs text-muted-foreground truncate max-w-16 sm:max-w-none">
                      {teamData.secteur}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (!data.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Progression des Équipes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            Aucune donnée d&apos;équipe disponible
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Progression des Équipes</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              layout="horizontal"
              data={chartData}
              margin={{
                top: 10,
                right: 20,
                left: 10,
                bottom: 10,
              }}
            >
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis
                type="category"
                dataKey="category"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                width={70}
              />
              {data.map((team, index) => (
                <Bar
                  key={team.team}
                  dataKey={`${team.team}.value`}
                  stackId="teams"
                  fill={team.couleur || `hsl(${(index * 137.5) % 360}, 70%, 60%)`}
                  radius={index === 0 ? [4, 0, 0, 4] : index === data.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0]}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth={1}
                />
              ))}
              <ChartTooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(0,0,0,0.1)" }}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Légende responsive sous le graphique */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 mt-4 justify-center">
          {data.map((team, index) => (
            <div key={team.team} className="flex items-center gap-1.5 sm:gap-2">
              <div
                className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: team.couleur || `hsl(${(index * 137.5) % 360}, 70%, 60%)` }}
              />
              <span className="text-xs sm:text-xs font-medium truncate">{team.team}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}