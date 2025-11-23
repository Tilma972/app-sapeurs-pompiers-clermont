import { createClient } from "@/lib/supabase/server";
import { getAvatarUrl } from "@/lib/utils/avatar";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUserProfile } from "@/lib/supabase/profile";
import { UnifiedProfileForm } from "@/components/profile/unified-profile-form";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { Profile } from "@/lib/types/profile";
import { PwaContainer } from "@/components/layouts/pwa/pwa-container";
import { ProfileHeaderCard } from "@/components/gamification/profile-header-card";
import { MultiStepProgress } from "@/components/gamification/multi-step-progress";
import { StatsCards } from "@/components/gamification/stats-cards";
import { BadgesGrid } from "@/components/gamification/badges-grid";
import { getGamificationStats, getBadgesWithProgress, getXpHistory } from "@/lib/supabase/gamification";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default async function ProfilPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const params = await searchParams;
  const defaultTab = params.tab || "stats";

  // Fetch all data in parallel
  const [profile, profileView, stats, badges, history, equipes, tourneesCount] = await Promise.all([
    getCurrentUserProfile(),
    supabase.from('profiles_with_equipe_view').select('*').eq('id', user.id).single(),
    getGamificationStats(user.id),
    getBadgesWithProgress(user.id),
    getXpHistory(user.id),
    supabase
      .from("equipes")
      .select("id, nom")
      .eq("actif", true)
      .order("ordre_affichage", { ascending: true }),
    supabase
      .from('tournees')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('statut', 'terminee')
  ]);

  if (!profile || !profileView.data) redirect("/dashboard");

  // Générer les initiales
  const initials = profile.first_name && profile.last_name
    ? `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
    : profile.full_name
      ?.split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase() || 'SP';

  // Determine current rank title (fallback if stats missing)
  const currentLevel = stats?.level || 1;
  const currentMilestone = [...MILESTONES].reverse().find(m => currentLevel >= m.niveau) || MILESTONES[0];

  return (
    <PwaContainer>
      <div className="space-y-6 pb-20">
        {/* 1. Profile Header (New Design) */}
        <ProfileHeaderCard
          userName={`${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.full_name || "Utilisateur"}
          equipeNom={profileView.data.nom_equipe || "Sans équipe"}
          avatarUrl={getAvatarUrl(profile.avatar_url) || undefined}
          memberSince={profile.created_at}
          stats={{
            calendriersTotal: profileView.data.calendriers_distribues || 0,
            tourneesTotal: tourneesCount.count || 0,
            montantTotal: profileView.data.montant_collecte || 0,
          }}
          niveau={{
            current: currentLevel,
            titre: currentMilestone.titre
          }}
        />

        {/* 2. Progress Bar */}
        {
          stats && (
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
          )
        }

        {/* 3. Tabs Content */}
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="stats" className="text-xs sm:text-sm">📊 Stats</TabsTrigger>
            <TabsTrigger value="badges" className="text-xs sm:text-sm">🏅 Badges</TabsTrigger>
            <TabsTrigger value="activity" className="text-xs sm:text-sm">📈 Activité</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs sm:text-sm">⚙️ Éditer</TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-4">
            {stats ? (
              <StatsCards stats={{
                calendriersTotal: profileView.data.calendriers_distribues || 0,
                tourneesTotal: tourneesCount.count || 0,
                montantTotal: profileView.data.montant_collecte || 0,
                classementGlobal: stats.global_rank || undefined,
                classementEquipe: stats.team_rank || undefined,
              }} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">Stats indisponibles</div>
            )}
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

          <TabsContent value="settings" className="space-y-6">
            {/* Avatar Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Photo de profil</CardTitle>
                <CardDescription>
                  Ajoutez une photo pour personnaliser votre compte
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center py-6">
                <AvatarUpload
                  currentAvatarUrl={(profile as Profile & { avatar_url?: string }).avatar_url}
                  initials={initials}
                  userId={user.id}
                />
              </CardContent>
            </Card>

            {/* Formulaire */}
            <Card>
              <CardHeader>
                <CardTitle>Informations personnelles</CardTitle>
                <CardDescription>
                  Complétez ou modifiez vos informations de profil
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UnifiedProfileForm
                  profile={profile}
                  equipes={(equipes.data as Array<{ id: string; nom: string }>) || []}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div >
    </PwaContainer >
  );
}
