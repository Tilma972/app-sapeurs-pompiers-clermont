"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, Trophy, Coins } from "lucide-react";
import type { ChallengeWithProgress } from "@/lib/types/gamification.types";

interface ChallengeCardProps {
  challenge: ChallengeWithProgress;
  className?: string;
}

// Icônes par type de cible
const TARGET_ICONS: Record<string, string> = {
  calendars: '📅',
  votes: '👍',
  likes: '❤️',
  ideas: '💡',
  montant: '💰',
  team_rank: '🏆',
  engagement: '✨',
};

// Couleurs par type de défi
const TYPE_COLORS = {
  daily: {
    bg: 'from-blue-500/10 to-cyan-500/10',
    border: 'border-blue-500/20',
    text: 'text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-500',
  },
  weekly: {
    bg: 'from-purple-500/10 to-pink-500/10',
    border: 'border-purple-500/20',
    text: 'text-purple-600 dark:text-purple-400',
    badge: 'bg-purple-500',
  },
  monthly: {
    bg: 'from-orange-500/10 to-red-500/10',
    border: 'border-orange-500/20',
    text: 'text-orange-600 dark:text-orange-400',
    badge: 'bg-orange-500',
  },
  event: {
    bg: 'from-green-500/10 to-emerald-500/10',
    border: 'border-green-500/20',
    text: 'text-green-600 dark:text-green-400',
    badge: 'bg-green-500',
  },
};

export function ChallengeCard({ challenge, className }: ChallengeCardProps) {
  const colors = TYPE_COLORS[challenge.type];
  const isCompleted = challenge.completed;
  const progressPercentage = challenge.progress_percentage;

  // Labels des types
  const typeLabel = {
    daily: 'Quotidien',
    weekly: 'Hebdomadaire',
    monthly: 'Mensuel',
    event: 'Événement',
  }[challenge.type];

  return (
    <Card className={`relative overflow-hidden ${className || ''}`}>
      {/* Effet de fond complété */}
      {isCompleted && (
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 animate-pulse" />
      )}

      <div className="relative p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1">
            {/* Icône du type de cible */}
            <div className="text-3xl" aria-hidden="true">
              {TARGET_ICONS[challenge.target_type] || '🎯'}
            </div>

            {/* Titre et description */}
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-base line-clamp-1">
                {challenge.name}
              </h4>
              {challenge.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                  {challenge.description}
                </p>
              )}
            </div>
          </div>

          {/* Badge type */}
          <Badge className={`${colors.badge} text-white shrink-0`}>
            {typeLabel}
          </Badge>
        </div>

        {/* Progression */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progression</span>
            <span className={`font-bold ${isCompleted ? 'text-green-600' : colors.text}`}>
              {challenge.current_progress} / {challenge.target_value}
            </span>
          </div>

          <div className="relative">
            <Progress
              value={progressPercentage}
              className="h-3"
            />
            {isCompleted && (
              <div className="absolute inset-0 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-white drop-shadow-lg" />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{progressPercentage}%</span>
            {isCompleted && challenge.completed_at && (
              <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Complété le {new Date(challenge.completed_at).toLocaleDateString('fr-FR')}
              </span>
            )}
          </div>
        </div>

        {/* Récompenses */}
        <div className={`flex items-center justify-between p-3 rounded-lg border ${colors.border} bg-gradient-to-br ${colors.bg}`}>
          <span className="text-sm font-medium">Récompenses</span>
          <div className="flex items-center gap-3">
            {challenge.xp_reward > 0 && (
              <div className="flex items-center gap-1 text-sm font-bold">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span>+{challenge.xp_reward} XP</span>
              </div>
            )}
            {challenge.token_reward > 0 && (
              <div className="flex items-center gap-1 text-sm font-bold">
                <Coins className="h-4 w-4 text-amber-500" />
                <span>+{challenge.token_reward} jetons</span>
              </div>
            )}
          </div>
        </div>

        {/* État complété */}
        {isCompleted && (
          <div className="flex items-center justify-center gap-2 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-bold text-green-600 dark:text-green-400">
              Défi complété !
            </span>
          </div>
        )}

        {/* État en cours */}
        {!isCompleted && progressPercentage > 0 && (
          <div className="flex items-center justify-center gap-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              En cours... Plus que {challenge.target_value - challenge.current_progress} !
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
