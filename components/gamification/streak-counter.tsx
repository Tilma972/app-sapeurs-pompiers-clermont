"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, Calendar, Trophy } from "lucide-react";

interface StreakCounterProps {
  streakDays: number;
  lastActivityDate?: string | null;
  className?: string;
  compact?: boolean;
}

export function StreakCounter({ streakDays, lastActivityDate, className, compact = false }: StreakCounterProps) {
  // Déterminer le niveau de streak
  const getStreakLevel = (days: number) => {
    if (days >= 30) return { label: 'Légendaire', color: 'from-purple-500 to-pink-500', icon: '👑' };
    if (days >= 14) return { label: 'Incroyable', color: 'from-orange-500 to-red-500', icon: '🔥' };
    if (days >= 7) return { label: 'Excellent', color: 'from-yellow-500 to-orange-500', icon: '⚡' };
    if (days >= 3) return { label: 'Bon début', color: 'from-green-500 to-emerald-500', icon: '✨' };
    return { label: 'Démarrage', color: 'from-gray-400 to-gray-500', icon: '🌱' };
  };

  const streakLevel = getStreakLevel(streakDays);

  // Vérifier si le streak est actif aujourd'hui
  const isStreakActive = lastActivityDate
    ? new Date(lastActivityDate).toDateString() === new Date().toDateString()
    : false;

  // Mode compact
  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className || ''}`}>
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${streakLevel.color} flex items-center justify-center text-white shadow-lg`}>
          <Flame className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Série</span>
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold">{streakDays}</span>
            <span className="text-xs text-muted-foreground">jours</span>
          </div>
        </div>
      </div>
    );
  }

  // Mode complet
  return (
    <Card className={`p-4 sm:p-6 ${className || ''}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${streakLevel.color} flex items-center justify-center text-2xl shadow-xl`}>
              {streakLevel.icon}
            </div>
            <div>
              <h3 className="text-lg font-bold">Série active</h3>
              <p className="text-sm text-muted-foreground">Jours consécutifs d&apos;activité</p>
            </div>
          </div>

          <Badge variant={isStreakActive ? "default" : "secondary"} className="px-3 py-1">
            {isStreakActive ? '✓ Actif aujourd\'hui' : 'En attente'}
          </Badge>
        </div>

        {/* Compteur principal */}
        <div className="flex items-center justify-center py-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Flame className={`h-8 w-8 ${streakDays >= 7 ? 'text-orange-500 animate-pulse' : 'text-gray-400'}`} />
              <span className="text-5xl sm:text-6xl font-bold bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
                {streakDays}
              </span>
            </div>
            <p className="text-lg text-muted-foreground">
              {streakDays === 0 ? 'Aucune série' : streakDays === 1 ? 'jour' : 'jours consécutifs'}
            </p>
          </div>
        </div>

        {/* Niveau de streak */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium">Niveau de série</span>
          <div className="flex items-center gap-2">
            <span className="text-lg">{streakLevel.icon}</span>
            <span className="text-sm font-bold">{streakLevel.label}</span>
          </div>
        </div>

        {/* Milestones */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground mb-2">Prochains jalons</div>
          <div className="grid grid-cols-4 gap-2">
            {[3, 7, 14, 30].map((milestone) => {
              const achieved = streakDays >= milestone;
              return (
                <div
                  key={milestone}
                  className={`flex flex-col items-center p-2 rounded-lg border ${
                    achieved
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-muted/30 border-border text-muted-foreground'
                  }`}
                >
                  {achieved ? (
                    <Trophy className="h-4 w-4 mb-1" />
                  ) : (
                    <Calendar className="h-4 w-4 mb-1" />
                  )}
                  <span className="text-xs font-bold">{milestone}j</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Message d'encouragement */}
        {streakDays > 0 && !isStreakActive && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-sm text-yellow-600 dark:text-yellow-500 font-medium">
              ⚠️ N&apos;oubliez pas votre activité aujourd&apos;hui pour conserver votre série de {streakDays} jour{streakDays > 1 ? &apos;s&apos; : &apos;&apos;} !
            </p>
          </div>
        )}

        {streakDays === 0 && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-blue-600 dark:text-blue-500 font-medium">
              💡 Astuce : Distribuez au moins 1 calendrier par jour pour démarrer une série !
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
