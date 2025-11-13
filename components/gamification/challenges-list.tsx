"use client";

import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, CalendarDays, CalendarRange, Sparkles } from "lucide-react";
import { ChallengeCard } from "./challenge-card";
import type { ChallengeWithProgress } from "@/lib/types/gamification.types";

interface ChallengesListProps {
  challenges: ChallengeWithProgress[];
  className?: string;
}

export function ChallengesList({ challenges, className }: ChallengesListProps) {
  // Séparer par type
  const { daily, weekly, monthly, stats } = useMemo(() => {
    const daily = challenges.filter((c) => c.type === 'daily');
    const weekly = challenges.filter((c) => c.type === 'weekly');
    const monthly = challenges.filter((c) => c.type === 'monthly');

    const dailyCompleted = daily.filter((c) => c.completed).length;
    const weeklyCompleted = weekly.filter((c) => c.completed).length;
    const monthlyCompleted = monthly.filter((c) => c.completed).length;

    return {
      daily,
      weekly,
      monthly,
      stats: {
        dailyCompleted,
        weeklyCompleted,
        monthlyCompleted,
        totalCompleted: dailyCompleted + weeklyCompleted + monthlyCompleted,
        total: challenges.length,
      },
    };
  }, [challenges]);

  // Vérifier si tous les défis quotidiens sont complétés
  const allDailyCompleted = daily.length > 0 && daily.every((c) => c.completed);
  const allWeeklyCompleted = weekly.length > 0 && weekly.every((c) => c.completed);
  const allMonthlyCompleted = monthly.length > 0 && monthly.every((c) => c.completed);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Défis actifs
            </CardTitle>
            <CardDescription>
              Complétez des défis pour gagner de l'XP et des jetons
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {stats.totalCompleted} / {stats.total}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="daily" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Quotidiens</span>
              <Badge variant="secondary" className="ml-1">
                {stats.dailyCompleted}/{daily.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="weekly" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Hebdo</span>
              <Badge variant="secondary" className="ml-1">
                {stats.weeklyCompleted}/{weekly.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="monthly" className="flex items-center gap-2">
              <CalendarRange className="h-4 w-4" />
              <span className="hidden sm:inline">Mensuels</span>
              <Badge variant="secondary" className="ml-1">
                {stats.monthlyCompleted}/{monthly.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Défis quotidiens */}
          <TabsContent value="daily" className="space-y-4 mt-4">
            {allDailyCompleted && (
              <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <Sparkles className="h-5 w-5" />
                  <span className="font-bold">
                    Félicitations ! Tous les défis quotidiens sont complétés !
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Revenez demain pour de nouveaux défis.
                </p>
              </div>
            )}

            {daily.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {daily.map((challenge) => (
                  <ChallengeCard key={challenge.id} challenge={challenge} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun défi quotidien disponible</p>
              </div>
            )}
          </TabsContent>

          {/* Défis hebdomadaires */}
          <TabsContent value="weekly" className="space-y-4 mt-4">
            {allWeeklyCompleted && (
              <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                  <Sparkles className="h-5 w-5" />
                  <span className="font-bold">
                    Superbe ! Tous les défis hebdomadaires sont complétés !
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  De nouveaux défis seront disponibles la semaine prochaine.
                </p>
              </div>
            )}

            {weekly.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {weekly.map((challenge) => (
                  <ChallengeCard key={challenge.id} challenge={challenge} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun défi hebdomadaire disponible</p>
              </div>
            )}
          </TabsContent>

          {/* Défis mensuels */}
          <TabsContent value="monthly" className="space-y-4 mt-4">
            {allMonthlyCompleted && (
              <div className="p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                  <Sparkles className="h-5 w-5" />
                  <span className="font-bold">
                    Incroyable ! Tous les défis mensuels sont complétés !
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Vous êtes un champion ! Revenez le mois prochain.
                </p>
              </div>
            )}

            {monthly.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {monthly.map((challenge) => (
                  <ChallengeCard key={challenge.id} challenge={challenge} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarRange className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun défi mensuel disponible</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
