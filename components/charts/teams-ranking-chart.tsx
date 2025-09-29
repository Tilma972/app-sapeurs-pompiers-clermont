"use client"

import { BarChart3, Trophy, Medal, Award } from "lucide-react"

interface TeamsRankingChartProps {
  teamsSummary: Array<{
    team: string;
    totalAmountCollected: number;
    totalCalendarsDistributed: number;
  }>;
  limit?: number;
  compact?: boolean;
}

const getRankingIcon = (index: number) => {
  switch (index) {
    case 0: return <Trophy className="h-4 w-4 text-yellow-500" />
    case 1: return <Medal className="h-4 w-4 text-gray-400" />  
    case 2: return <Award className="h-4 w-4 text-orange-400" />
    default: return <div className="w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-600">{index + 1}</div>
  }
}

const getRankingColor = (index: number) => {
  const colors = [
    'border-l-yellow-500 bg-yellow-50',
    'border-l-gray-400 bg-gray-50', 
    'border-l-orange-400 bg-orange-50',
    'border-l-blue-400 bg-blue-50',
    'border-l-purple-400 bg-purple-50'
  ]
  return colors[index] || 'border-l-gray-300 bg-gray-50'
}

export default function TeamsRankingChart({ teamsSummary, limit, compact = false }: TeamsRankingChartProps) {
  if (teamsSummary.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Aucune donnée d&apos;équipe disponible</p>
        <p className="text-sm">Les statistiques apparaîtront ici</p>
      </div>
    );
  }

  // Trier par montant collecté (ordre décroissant)
  const sortedTeams = [...teamsSummary].sort((a, b) => b.totalAmountCollected - a.totalAmountCollected)
  const visibleTeams = typeof limit === 'number' ? sortedTeams.slice(0, Math.max(0, limit)) : sortedTeams
  const maxAmount = Math.max(0, ...sortedTeams.map(t => t.totalAmountCollected))
  const currency = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })
  const numberFr = new Intl.NumberFormat("fr-FR")

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {visibleTeams.map((team, index) => (
        <div 
          key={team.team} 
          className={`border-l-4 rounded-r-lg ${compact ? 'p-3' : 'p-4'} transition-all hover:shadow-sm ${getRankingColor(index)}`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              {getRankingIcon(index)}
              <div>
                <div className={compact ? "text-sm font-medium text-gray-900" : "font-semibold text-gray-900"}>{team.team}</div>
                <div className="text-xs text-gray-500">Rang #{index + 1}</div>
              </div>
            </div>
            <div className="text-right">
              <div className={compact ? "text-base font-semibold text-gray-900" : "text-lg font-bold text-gray-900"}>{currency.format(team.totalAmountCollected)}</div>
              <div className="text-xs text-gray-500">{numberFr.format(team.totalCalendarsDistributed)} cal.</div>
            </div>
          </div>
          
          {/* Barre de progression comparative */}
          <div className={compact ? "space-y-1.5" : "space-y-2"}>
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Performance relative</span>
              <span>{maxAmount > 0 ? Math.round((team.totalAmountCollected / maxAmount) * 100) : 0}%</span>
            </div>
            <div className={compact ? "w-full bg-gray-200 rounded-full h-1.5" : "w-full bg-gray-200 rounded-full h-2"}>
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  index === 0 ? 'bg-yellow-500' :
                  index === 1 ? 'bg-gray-400' :
                  index === 2 ? 'bg-orange-400' :
                  index === 3 ? 'bg-blue-400' : 'bg-purple-400'
                }`}
                role="progressbar"
                aria-label={`Performance de l’équipe ${team.team}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={maxAmount > 0 ? Math.round((team.totalAmountCollected / maxAmount) * 100) : 0}
                style={{
                  width: `${maxAmount > 0 ? (team.totalAmountCollected / maxAmount) * 100 : 0}%`
                }}
              ></div>
            </div>
          </div>

          {/* Stats détaillées en petit */}
          <div className="mt-2 flex justify-between text-xs text-gray-400">
            <span>
              Moy/cal: {team.totalCalendarsDistributed > 0 
                ? Number((team.totalAmountCollected / team.totalCalendarsDistributed).toFixed(1))
                : 0}€
            </span>
            <span>
              {(() => {
                const total = sortedTeams.reduce((sum, t) => sum + t.totalAmountCollected, 0)
                const pct = total > 0 ? (team.totalAmountCollected / total) * 100 : 0
                return `${pct.toFixed(1)}% du total`
              })()}
            </span>
          </div>
        </div>
      ))}

      {/* Résumé global en footer */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className={compact ? "text-base font-semibold text-gray-900" : "text-lg font-bold text-gray-900"}>
              {currency.format(sortedTeams.reduce((sum, t) => sum + t.totalAmountCollected, 0))}
            </div>
            <div className="text-xs text-gray-500">Total collecté</div>
          </div>
          <div>
            <div className={compact ? "text-base font-semibold text-gray-900" : "text-lg font-bold text-gray-900"}>
              {numberFr.format(sortedTeams.reduce((sum, t) => sum + t.totalCalendarsDistributed, 0))}
            </div>
            <div className="text-xs text-gray-500">Total calendriers</div>
          </div>
        </div>
      </div>
    </div>
  );
}