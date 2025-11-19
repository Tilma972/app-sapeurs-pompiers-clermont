import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PwaContainer } from "@/components/layouts/pwa/pwa-container";
import { getGlobalLeaderboard, getUserRankGlobal } from "@/lib/supabase/leaderboards";
import { getUserProgressionServer } from "@/lib/supabase/gamification-server";
import { Trophy, Crown, Medal, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getAvatarUrl } from "@/lib/utils/avatar";

export default async function ClassementPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [leaderboard, userRank, userProgression] = await Promise.all([
    getGlobalLeaderboard(50),
    getUserRankGlobal(user.id),
    getUserProgressionServer(user.id),
  ]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-semibold text-muted-foreground">#{rank}</span>;
  };

  const getRankBadgeVariant = (rank: number) => {
    if (rank === 1) return "default";
    if (rank <= 3) return "secondary";
    if (rank <= 10) return "outline";
    return "outline";
  };

  return (
    <PwaContainer>
      <div className="space-y-6 py-6">
        {/* Header avec bouton retour */}
        <div className="flex items-center gap-4">
          <Link href="/gamification">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Trophy className="h-7 w-7 text-primary" />
              Classement
            </h1>
            <p className="text-muted-foreground mt-1">
              Classement général par XP total
            </p>
          </div>
        </div>

        {/* Rang de l'utilisateur */}
        {userRank && userProgression && (
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Ton classement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                  {getRankIcon(userRank.rank)}
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold">#{userRank.rank}</p>
                  <p className="text-sm text-muted-foreground">
                    {userProgression.total_xp.toLocaleString('fr-FR')} XP • Niveau {userProgression.level}
                  </p>
                </div>
                <Badge variant={getRankBadgeVariant(userRank.rank)}>
                  Top {Math.round(userRank.percentile)}%
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Classement global */}
        <Card>
          <CardHeader>
            <CardTitle>Classement global</CardTitle>
            <CardDescription>
              Les {leaderboard.length} meilleurs joueurs
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {leaderboard.map((entry) => {
                const isCurrentUser = entry.user_id === user.id;
                const initials = entry.nom && entry.prenom
                  ? `${entry.nom[0]}${entry.prenom[0]}`.toUpperCase()
                  : 'SP';
                const fullName = entry.nom && entry.prenom
                  ? `${entry.nom} ${entry.prenom}`
                  : 'Utilisateur';
                const avatarUrl = getAvatarUrl(entry.avatar_url || undefined);

                return (
                  <div
                    key={entry.user_id}
                    className={`flex items-center gap-4 p-4 transition-colors ${
                      isCurrentUser ? 'bg-primary/5' : 'hover:bg-accent/50'
                    }`}
                  >
                    {/* Rang */}
                    <div className="flex items-center justify-center w-12 shrink-0">
                      {getRankIcon(entry.rank)}
                    </div>

                    {/* Avatar */}
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={avatarUrl ?? undefined} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate">
                          {fullName}
                          {isCurrentUser && (
                            <span className="text-primary ml-1">(Toi)</span>
                          )}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {entry.equipe_nom || 'Aucune équipe'}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                          {entry.level}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {entry.total_xp.toLocaleString('fr-FR')} XP
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </PwaContainer>
  );
}
