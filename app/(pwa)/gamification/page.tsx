import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PwaContainer } from "@/components/layouts/pwa/pwa-container";
import { ProgressionBar } from "@/components/gamification/progression-bar";
import { StreakCounter } from "@/components/gamification/streak-counter";
import { getGamificationStats } from "@/lib/supabase/gamification";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Zap, Target, Award, TrendingUp } from "lucide-react";
import Link from "next/link";

export default async function GamificationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const stats = await getGamificationStats(user.id);

  if (!stats) {
    return (
      <PwaContainer>
        <div className="py-8">
          <p className="text-center text-muted-foreground">
            Erreur lors du chargement de vos statistiques de progression.
          </p>
        </div>
      </PwaContainer>
    );
  }

  return (
    <PwaContainer>
      <div className="space-y-6 py-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Trophy className="h-7 w-7 text-primary" />
            Ma Progression
          </h1>
          <p className="text-muted-foreground mt-1">
            Suis ta progression, débloque des badges et relève des défis
          </p>
        </div>

        {/* Progression et Streak */}
        <div className="grid gap-4 sm:grid-cols-2">
          <ProgressionBar progression={{
            level: stats.level,
            current_xp: stats.current_xp,
            total_xp: stats.total_xp,
            streak_days: stats.streak_days,
            tokens: stats.tokens,
          }} />

          <StreakCounter
            streakDays={stats.streak_days}
            lastActivityDate={new Date().toISOString()}
          />
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                XP Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.total_xp.toLocaleString('fr-FR')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Award className="h-4 w-4" />
                Badges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {stats.badges_unlocked}/{stats.badges_total}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Jetons
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.tokens}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                Niveau
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.level}</p>
            </CardContent>
          </Card>
        </div>

        {/* Badges récents */}
        {stats.recent_badges.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Badges récents</CardTitle>
              <CardDescription>
                Tes derniers badges débloqués
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recent_badges.map((userBadge) => {
                  const badge = userBadge.badge;
                  if (!badge) return null;
                  return (
                    <div
                      key={userBadge.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="text-4xl">{badge.icon}</div>
                      <div className="flex-1">
                        <p className="font-semibold">{badge.name}</p>
                        <p className="text-sm text-muted-foreground">{badge.description}</p>
                      </div>
                      <Badge variant="secondary">
                        {badge.rarity === 'legendary' && '🏆'}
                        {badge.rarity === 'epic' && '💎'}
                        {badge.rarity === 'rare' && '⭐'}
                        {badge.rarity === 'common' && '🎖️'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Liens vers les autres sections */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Link href="/gamification/badges">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Badges
                </CardTitle>
                <CardDescription>
                  Voir tous les badges et ta collection
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/gamification/defis">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Défis
                </CardTitle>
                <CardDescription>
                  Relève les défis quotidiens et hebdomadaires
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/gamification/classement">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Classement
                </CardTitle>
                <CardDescription>
                  Compare ta progression avec les autres
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </PwaContainer>
  );
}
