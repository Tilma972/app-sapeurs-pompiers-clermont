"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Euro } from "lucide-react"

export interface Team {
  id: string
  name: string
  goalTotal: number
  achieved: number
  amountCollected: number
}

interface TeamsLeaderboardProgressProps {
  teams: Team[]
  className?: string
  maxItems?: number // défaut 5
}

export function TeamsLeaderboardProgress({
  teams,
  className,
  maxItems = 5,
}: TeamsLeaderboardProgressProps) {
  const [viewMode, setViewMode] = useState<"calendars" | "amount">("calendars")

  const sortedTeams = useMemo(() => {
    return [...teams]
      .map((team) => {
        const pct =
          team.goalTotal > 0 ? Math.min((team.achieved / team.goalTotal) * 100, 100) : 0
        return { ...team, percentage: pct }
      })
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, maxItems)
  }, [teams, maxItems])

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)

  return (
    <Card className={className} role="region" aria-label="Classement des équipes">
      <CardHeader className="pb-3">
        {/* On small screens stack title + toggle; on larger screens keep them on a row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-lg truncate">Classement des équipes</CardTitle>
          </div>

          {/* Toggle: placed under title on mobile (mt-2), on the right on sm+ */}
          <div
            className="flex gap-1 rounded-lg bg-muted p-1 flex-shrink-0 mt-2 sm:mt-0"
            role="tablist"
            aria-label="Choix de métrique"
          >
            <Button
              role="tab"
              aria-selected={viewMode === "calendars"}
              variant={viewMode === "calendars" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("calendars")}
              className="h-9 px-3 text-xs"
            >
              <Calendar className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
              Calendriers
            </Button>
            <Button
              role="tab"
              aria-selected={viewMode === "amount"}
              variant={viewMode === "amount" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("amount")}
              className="h-9 px-3 text-xs"
            >
              <Euro className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
              Montant
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3" role="list" aria-label="Équipes triées par progression">
        {sortedTeams.map((team, index) => {
          const rawPct = team.goalTotal > 0 ? (team.achieved / team.goalTotal) * 100 : 0
          const clampedPct = Math.min(rawPct, 100)
          const isOverGoal = rawPct > 100
          const overPct = Math.max(0, Math.round(rawPct - 100))

          const progressLabel =
            viewMode === "calendars"
              ? `${team.achieved}/${team.goalTotal} (${Math.round(clampedPct)}%)`
              : `${formatCurrency(team.amountCollected)} — ${team.achieved}/${team.goalTotal} (${Math.round(
                  clampedPct,
                )}%)`

          return (
            <div
              key={team.id}
              role="listitem"
              aria-label={`${index + 1}. ${team.name}`}
              className="space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  {/* Medal badges for top 3, simple index for others */}
                  {index === 0 ? (
                    <span className="relative inline-flex items-center justify-center h-6 w-6 rounded-full bg-amber-400 text-black text-xs font-semibold" aria-hidden="true">
                      {/* Gold medal SVG */}
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <circle cx="12" cy="10" r="4" fill="currentColor" />
                        <path d="M8 14l-1 6 5-3 5 3-1-6" fill="currentColor" opacity="0.9" />
                      </svg>
                      <span className="sr-only">{`1er — Médaille d'or, ${team.name}`}</span>
                    </span>
                  ) : index === 1 ? (
                    <span className="relative inline-flex items-center justify-center h-6 w-6 rounded-full bg-slate-300 text-black text-xs font-semibold" aria-hidden="true">
                      {/* Silver medal SVG */}
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <circle cx="12" cy="10" r="4" fill="currentColor" />
                        <path d="M8 14l-1 6 5-3 5 3-1-6" fill="currentColor" opacity="0.9" />
                      </svg>
                      <span className="sr-only">{`2e — Médaille d'argent, ${team.name}`}</span>
                    </span>
                  ) : index === 2 ? (
                    <span className="relative inline-flex items-center justify-center h-6 w-6 rounded-full bg-amber-700 text-white text-xs font-semibold" aria-hidden="true">
                      {/* Bronze medal SVG (toned darker) */}
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <circle cx="12" cy="10" r="4" fill="currentColor" />
                        <path d="M8 14l-1 6 5-3 5 3-1-6" fill="currentColor" opacity="0.95" />
                      </svg>
                      <span className="sr-only">{`3e — Médaille de bronze, ${team.name}`}</span>
                    </span>
                  ) : (
                    <span className="w-6 text-xs text-muted-foreground text-right">{index + 1}</span>
                  )}
                  <span className="truncate text-sm font-medium">{team.name}</span>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {viewMode === "calendars" ? (
                    <>
                      <span className="text-xs text-muted-foreground">
                        {team.achieved}/{team.goalTotal}
                      </span>
                      <span
                        className={`text-sm font-semibold ${
                          isOverGoal ? "text-green-600" : "text-foreground"
                        }`}
                        aria-label={`Progression ${Math.round(clampedPct)}%${
                          isOverGoal ? `, dépassement de ${overPct}%` : ""
                        }`}
                      >
                        {Math.round(clampedPct)}%
                      </span>
                      {isOverGoal && (
                        <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                          +{overPct}%
                        </Badge>
                      )}
                    </>
                  ) : (
                    <span className="text-sm font-semibold">{formatCurrency(team.amountCollected)}</span>
                  )}
                </div>

                {/* Visually-hidden progress text for screen readers */}
                <span className="sr-only">{progressLabel}</span>
              </div>

              {/* Micro bullet bar déterminée (piste vs indicateur) */}
              <div
                className="relative h-2 w-full overflow-hidden rounded-full"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(Math.min(rawPct, 100))}
                aria-label={progressLabel}
              >
                {/* Track (piste) à contraste suffisant */}
                <div className="absolute inset-0 bg-muted" />

                {/* Indicator (barre de progression) */}
                <div
                  className={`absolute left-0 top-0 h-full rounded-full transition-[width] duration-300 ${
                    isOverGoal ? "bg-green-600" : "bg-primary"
                  }`}
                  style={{ width: `${clampedPct}%` }}
                />

                {/* Marqueur d'objectif (stop indicator visuel côté droit) */}
                {!isOverGoal && (
                  <div className="absolute right-0 top-0 h-full w-px bg-foreground/40" aria-hidden="true" />
                )}
              </div>
            </div>
          )
        })}

        {sortedTeams.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">Aucune équipe disponible</div>
        )}
      </CardContent>
    </Card>
  )
}