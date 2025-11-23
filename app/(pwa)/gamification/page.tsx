import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PwaContainer } from "@/components/layouts/pwa/pwa-container";
import { ProfileHeaderCard } from "@/components/gamification/profile-header-card";
import { MultiStepProgress } from "@/components/gamification/multi-step-progress";
import { StatsCards } from "@/components/gamification/stats-cards";
import { BadgesGrid } from "@/components/gamification/badges-grid";
import { getGamificationStats, getBadgesWithProgress, getXpHistory } from "@/lib/supabase/gamification";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const MILESTONES = [
  { niveau: 1, titre: "Recrue", xp_requis: 0, icone: "🎖️" },
  { niveau: 5, titre: "Caporal", xp_requis: 500, icone: "🎗️" },
  { niveau: 10, titre: "Sergent", xp_requis: 1500, icone: "⭐" },
  { niveau: 20, titre: "Lieutenant", xp_requis: 3000, icone: "⭐⭐" },
  { niveau: 30, titre: "Capitaine", xp_requis: 5000, icone: "⭐⭐⭐" },
  { niveau: 50, titre: "Légende", xp_requis: 10000, icone: "👑" },
];

export default async function GamificationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Fetch data in parallel
  const [stats, badges, history, profile, tourneesCount] = await Promise.all([
    getGamificationStats(user.id),
    getBadgesWithProgress(user.id),
    getXpHistory(user.id),
    supabase
      .from('profiles_with_equipe_view')
      .select('*')
      .eq('id', user.id)
      .single(),
    supabase
      .from('tournees')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('statut', 'terminee')
  ]);

  if (!stats || !profile.data) {
    return (
      <PwaContainer>
        <div className="py-8 text-center text-muted-foreground">
          Erreur lors du chargement des données.
        </div>
      </PwaContainer>
    );
  }

  // Determine current rank title
  const currentMilestone = [...MILESTONES].reverse().find(m => stats.level >= m.niveau) || MILESTONES[0];

  return (
    <PwaContainer>
      <div className="space-y-6 py-6 pb-20">
        {/* 1. Profile Header */}
        <ProfileHeaderCard
          userName={`${profile.data.first_name} ${profile.data.last_name}`}
          equipeNom={profile.data.nom_equipe || "Sans équipe"}
          avatarUrl={profile.data.avatar_url || undefined}
          memberSince={profile.data.created_at}
          stats={{
            calendriersTotal: profile.data.calendriers_distribues || 0,
            tourneesTotal: tourneesCount.count || 0,
            montantTotal: profile.data.montant_collecte || 0,
          }}
          niveau={{
            current: stats.level,
            titre: currentMilestone.titre
          }}
        />

        {/* 2. Progress Bar */}
        <Card className="bg-card/50 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex justify-between items-center">
              <span>Progression</span>
              <span className="text-sm text-muted-foreground font-normal">
                {stats.current_xp.toLocaleString()} / {stats.xp_for_next_level.toLocaleString()} XP
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MultiStepProgress
              currentXp={stats.total_xp}
              milestones={MILESTONES}
            />
          </CardContent>
        </Card>

        {/* 3. Tabs Content */}
        <Tabs defaultValue="stats" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="stats">📊 Stats</TabsTrigger>
            <TabsTrigger value="badges">🏅 Badges</TabsTrigger>
            <TabsTrigger value="activity">📈 Activité</TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-4">
            <StatsCards stats={{
              calendriersTotal: profile.data.calendriers_distribues || 0,
              tourneesTotal: tourneesCount.count || 0,
              montantTotal: profile.data.montant_collecte || 0,
              // Ces valeurs mensuelles nécessiteraient une requête plus complexe, 
              // on laisse undefined pour l'instant ou on implémentera plus tard
              classementGlobal: stats.global_rank || undefined,
              classementEquipe: stats.team_rank || undefined,
            }} />
          </TabsContent>

          <TabsContent value="badges">
            <BadgesGrid badges={badges.map(b => ({
              id: b.id,
              nom: b.name,
              description: b.description || "",
              icone: b.icon || "❓",
              rarity: b.rarity,
              unlocked: b.unlocked,
              unlockedAt: b.unlocked_at,
              progression: b.current_progress !== undefined && b.unlock_criteria.threshold > 0
                ? Math.min((b.current_progress / b.unlock_criteria.threshold) * 100, 100)
                : 0
            }))} />
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Historique récent</CardTitle>
              </CardHeader>
              <CardContent>
                {history.length > 0 ? (
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      {history.map((entry) => (
                        <div key={entry.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                          <div className="mt-1 bg-primary/10 p-2 rounded-full text-primary">
                            <span className="text-lg font-bold">+{entry.amount}</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">XP Gagné</p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {entry.reason.replace(/_/g, ' ')}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true, locale: fr })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune activité récente.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PwaContainer>
  );
}
