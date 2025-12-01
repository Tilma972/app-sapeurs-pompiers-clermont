'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Trophy,
  TrendingUp,
  Users,
  Calendar,
  Award,
  Calculator,
  TrendingDown,
  Minus,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// --- Types ---
interface TeamStats {
  id: string;
  name: string;
  goalTotal: number;
  achieved: number;
  amountCollected: number;
  rank?: number;
  previous_rank?: number;
}

export type Team = TeamStats;

interface TeamsLeaderboardProgressProps {
  teams: TeamStats[];
  className?: string;
  maxItems?: number;
}

// --- Helpers ---
const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1: return <Trophy className="h-6 w-6 text-yellow-500" aria-label="1ère place" />;
    case 2: return <Award className="h-6 w-6 text-gray-400" aria-label="2e place" />;
    case 3: return <Award className="h-6 w-6 text-amber-600" aria-label="3e place" />;
    default: return <span className="text-xl font-bold text-slate-500" aria-label={`${rank}e place`}>#{rank}</span>;
  }
};

const getTrendIcon = (rank: number, previousRank?: number) => {
  if (!previousRank) return null;
  if (rank < previousRank) return <TrendingUp className="h-4 w-4 text-green-500" aria-label="En progression" />;
  if (rank > previousRank) return <TrendingDown className="h-4 w-4 text-red-500" aria-label="En déclin" />;
  return <Minus className="h-4 w-4 text-slate-300" aria-label="Stable" />;
};

const calculateMetrics = (team: TeamStats) => {
  const avg = team.achieved > 0 
    ? (team.amountCollected / team.achieved)
    : 0;

  // Logique de couleur fine (Rule of 10/11/12)
  let colorClass = "text-slate-700"; 
  if (avg < 10) colorClass = "text-orange-600 font-medium";      // < 10€
  else if (avg >= 10 && avg < 11) colorClass = "text-slate-600 font-medium";  // 10-11€
  else if (avg >= 11 && avg < 12) colorClass = "text-emerald-600 font-bold";  // 11-12€
  else if (avg >= 12) colorClass = "text-green-700 font-extrabold";           // > 12€

  return {
    averagePerCalendar: avg.toFixed(2),
    colorClass
  };
};

// --- Sous-Composant TeamCard ---
const TeamCard = ({ team, maxAmount, metrics }: { 
  team: TeamStats; 
  maxAmount: number;
  metrics: ReturnType<typeof calculateMetrics>;
}) => {
  const progressValue = maxAmount > 0 ? (team.amountCollected / maxAmount) * 100 : 0;
  const { averagePerCalendar, colorClass } = metrics;

  return (
    <article 
      className="mb-4 p-4 rounded-lg border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-200"
      role="listitem"
      aria-label={`${team.name} - Rang ${team.rank}`}
    >
      {/* En-tête Responsive (Mobile First) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
        <div className="flex items-center space-x-3 min-w-0 w-full sm:w-auto">
          <div className="flex-shrink-0 w-8 sm:w-10 text-center">
            {getRankIcon(team.rank || 0)}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-slate-800 text-lg truncate">{team.name}</h3>
            <div className="flex items-center text-xs text-slate-500 space-x-2 flex-wrap">
              <span className="flex items-center whitespace-nowrap">
                <Users className="h-3 w-3 mr-1" /> {team.achieved}/{team.goalTotal} calendriers
              </span>
              {getTrendIcon(team.rank || 0, team.previous_rank)}
            </div>
          </div>
        </div>
        
        {/* Montant à droite (aligné à gauche sur mobile, droite sur desktop) */}
        <div className="flex flex-row sm:flex-col justify-between sm:text-right items-end w-full sm:w-auto pl-11 sm:pl-0 mt-1 sm:mt-0">
           <div className="text-2xl font-bold text-slate-900">{team.amountCollected.toLocaleString('fr-FR')} €</div>
           <div className="text-xs text-slate-500 font-medium">Collecté</div>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>Performance relative</span>
          <span>{Math.round(progressValue)}% du leader</span>
        </div>
        <Progress 
          value={progressValue} 
          className="h-2" 
          indicatorClassName={
            team.rank === 1 ? "bg-yellow-500" : 
            team.rank === 2 ? "bg-slate-400" : 
            team.rank === 3 ? "bg-amber-600" : "bg-slate-600"
          } 
        />
      </div>

      {/* Métriques Clés (Grille responsive) */}
      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
        {/* Calendriers Distribués */}
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold flex items-center mb-1">
            <Calendar className="h-3 w-3 mr-1" aria-hidden="true" /> Calendriers
          </span>
          <span className="text-sm font-semibold text-slate-700">
            {team.achieved} / {team.goalTotal}
          </span>
        </div>

        {/* Moyenne Unitaire */}
        <div className="flex flex-col">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold flex items-center mb-1 cursor-help">
                  <Calculator className="h-3 w-3 mr-1" aria-hidden="true" /> Moyenne Unitaire
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">Total collecté ÷ Calendriers distribués</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <span className={`text-sm ${colorClass}`}>
            {averagePerCalendar} € <span className="text-xs font-normal text-slate-400">/ cal.</span>
          </span>
        </div>
      </div>
    </article>
  );
};

// --- Composant Principal ---
export function TeamsLeaderboardProgress({ 
  teams, 
  className,
  maxItems = 10
}: TeamsLeaderboardProgressProps) {
  // Tri et optimisation avec useMemo
  const sortedTeamsWithMetrics = useMemo(() => {
    return [...teams]
      .sort((a, b) => b.amountCollected - a.amountCollected)
      .slice(0, maxItems)
      .map((team, index) => ({
        team: { ...team, rank: index + 1 },
        metrics: calculateMetrics(team)
      }));
  }, [teams, maxItems]);

  const maxAmount = sortedTeamsWithMetrics.length > 0 
    ? sortedTeamsWithMetrics[0].team.amountCollected 
    : 1;

  if (sortedTeamsWithMetrics.length === 0) {
    return (
      <Card className={`w-full bg-slate-50 border-none shadow-none ${className || ''}`}>
        <CardHeader className="pb-2 px-0">
          <CardTitle className="flex items-center text-xl font-bold text-slate-800">
            <Trophy className="h-6 w-6 mr-2 text-yellow-500" />
            Classement des Équipes
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="text-center py-8 text-slate-400 italic">
            Aucune donnée d&apos;équipe disponible pour le moment.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full bg-slate-50 border-none shadow-none ${className || ''}`}>
      <CardHeader className="pb-2 px-0">
        <CardTitle className="flex items-center text-xl font-bold text-slate-800">
          <Trophy className="h-6 w-6 mr-2 text-yellow-500" aria-hidden="true" />
          Classement des Équipes
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0" role="list" aria-label="Classement des équipes">
        <div className="flex flex-col space-y-2">
          {sortedTeamsWithMetrics.map(({ team, metrics }) => (
            <TeamCard 
              key={team.id} 
              team={team}
              maxAmount={maxAmount}
              metrics={metrics}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}