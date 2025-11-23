"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles, TrendingUp } from "lucide-react";
import type { UserProgression } from "@/lib/types/gamification.types";
import { getXpRequiredForLevel } from "@/lib/supabase/gamification";

interface ProgressionBarProps {
  progression: Pick<UserProgression, 'level' | 'current_xp' | 'total_xp' | 'streak_days' | 'tokens'>;
  className?: string;
  compact?: boolean; // Mode compact pour affichage dans le header
}

export function ProgressionBar({ progression, className, compact = false }: ProgressionBarProps) {
  const { level, current_xp, total_xp } = progression;

  const stats = useMemo(() => {
    const xpForNext = getXpRequiredForLevel(level + 1);
    const progressPercentage = xpForNext > 0 ? Math.min((current_xp / xpForNext) * 100, 100) : 0;
    const isMaxLevel = level >= 50;

    return {
      xpForNext,
      progressPercentage: Math.round(progressPercentage),
      isMaxLevel,
    };
  }, [level, current_xp]);

  const formatNumber = (num: number) => new Intl.NumberFormat('fr-FR').format(num);

  // Mode compact (pour header)
  if (compact) {
    return (
      <div className={`flex items-center gap-4 p-2 ${className || ''}`}>
        {/* Niveau */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold shadow-lg border-2 border-background ring-2 ring-blue-500/20">
            {level}
          </div>
          {stats.isMaxLevel && (
            <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1 border border-background">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        {/* Barre de progression mini */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-foreground">Niveau {level}</span>
              <span className="text-[10px] text-muted-foreground">
                {stats.isMaxLevel ? "Niveau Max" : `${formatNumber(stats.xpForNext - current_xp)} XP restants`}
              </span>
            </div>
            <span className="text-xs font-bold text-blue-500">{stats.progressPercentage}%</span>
          </div>
          <Progress value={stats.progressPercentage} className="h-2 bg-muted" indicatorClassName="bg-gradient-to-r from-blue-600 to-cyan-500" />
        </div>
      </div>
    );
  }

  // Mode complet (pour page profil/dashboard)
  return (
    <Card className={`p-4 sm:p-6 bg-gradient-to-br from-primary/5 via-background to-background ${className || ''}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-2xl shadow-xl border-4 border-white dark:border-gray-800">
              {level}
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                Niveau {level}
                {stats.isMaxLevel && <Sparkles className="h-5 w-5 text-yellow-500" />}
              </h3>
              <p className="text-sm text-muted-foreground">
                {stats.isMaxLevel ? 'Niveau maximum atteint !' : `${formatNumber(stats.xpForNext - current_xp)} XP pour le niveau ${level + 1}`}
              </p>
            </div>
          </div>

          {/* Total XP */}
          <div className="text-right">
            <div className="flex items-center gap-1 text-primary">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium">Total</span>
            </div>
            <div className="text-lg sm:text-xl font-bold">{formatNumber(total_xp)} XP</div>
          </div>
        </div>

        {/* Barre de progression */}
        {!stats.isMaxLevel && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progression</span>
              <span className="font-semibold text-primary">{stats.progressPercentage}%</span>
            </div>

            <div className="relative">
              <Progress value={stats.progressPercentage} className="h-4" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-white drop-shadow-lg">
                  {formatNumber(current_xp)} / {formatNumber(stats.xpForNext)}
                </span>
              </div>
            </div>

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Niveau {level}</span>
              <span>Niveau {level + 1}</span>
            </div>
          </div>
        )}

        {stats.isMaxLevel && (
          <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/20">
            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
              <Sparkles className="h-5 w-5" />
              <span className="font-semibold">Félicitations ! Vous avez atteint le niveau maximum !</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Continuez à gagner de l&apos;XP pour débloquer des badges et grimper dans les classements.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
