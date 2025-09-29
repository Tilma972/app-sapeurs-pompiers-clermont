import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCurrentUserProfile } from "@/lib/supabase/profile";
import { 
  getActiveTourneeWithTransactions,
  getUserPersonalStats,
  getUserHistory,
  
} from "@/lib/supabase/tournee";
import { Play, TrendingUp } from "lucide-react";
import Link from "next/link";
import { StartTourneeButton } from "@/components/start-tournee-button";
import TeamsProgressList from "@/components/charts/teams-progress-list";
import { getEquipesRanking } from "@/lib/supabase/equipes";
import { PersonalStatsCard } from "@/components/personal-stats-card";

export default async function CalendriersPage() {
  const supabase = await createClient();
  
  // Vérification de l'authentification
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/auth/login");
  }

  // Récupération des données
  const profile = await getCurrentUserProfile();
  const personalStats = await getUserPersonalStats();
  const userHistory = await getUserHistory();
  // const teamsSummary = await getTeamsSummary(); // non utilisé ici
  const equipesRanking = await getEquipesRanking();
  
  // Vérification s'il y a une tournée active
  const tourneeData = await getActiveTourneeWithTransactions();
  const hasActiveTournee = tourneeData && tourneeData.tournee;

  // Objectif fixe (peut être récupéré depuis la base de données)
  const objectiveCalendars = 50;
  const calendarsRemaining = Math.max(0, objectiveCalendars - (personalStats?.totalCalendarsDistributed || 0));

  // Formatters localisation FR
  // Formatters utilisés dans les composants intégrés (KpiCard gère l'affichage)

  return (
    <div className="space-y-6 sm:space-y-8">
        
        {/* Carte d'Action - Démarrer une nouvelle tournée */}
        <Card className="bg-card border border-border shadow-sm">
          <CardHeader className="pb-3 sm:pb-4">
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-primary rounded-xl flex items-center justify-center text-primary-foreground">
                <Play className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg">Prêt pour une nouvelle tournée ?</CardTitle>
                <CardDescription>
                  Bonjour, {profile?.full_name || user.email?.split("@")[0]}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {hasActiveTournee ? (
              <Link href="/dashboard/ma-tournee">
                <Button className="w-full h-10 sm:h-12 text-sm sm:text-base font-semibold">
                  <Play className="h-4 w-4 mr-2" />
                  Continuer ma tournée
                </Button>
              </Link>
            ) : (
              <StartTourneeButton />
            )}
          </CardContent>
        </Card>

        {/* Carte "Mon activité" (indicateurs + historique compact) */}
        <PersonalStatsCard
          calendarsRemaining={calendarsRemaining}
          totalAmountCollected={personalStats?.totalAmountCollected ?? 0}
          averagePerCalendar={personalStats?.averagePerCalendar ?? 0}
          userHistory={userHistory}
        />

        {/* Carte "Progression des équipes" - motivant et harmonisé */}
        <Card className="bg-card border border-border shadow-sm">
          <CardHeader className="pb-3 sm:pb-4">
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg">Progression des équipes</CardTitle>
                <CardDescription>Où en est chaque équipe</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <TeamsProgressList items={equipesRanking} limit={6} compact />
          </CardContent>
        </Card>
        

        {/* Carte "Mon Historique" supprimée: l'historique récent est intégré dans "Mon activité" */}

        {/* Carte "Classement des Équipes" supprimée (redondante) */}
    </div>
  );
}
