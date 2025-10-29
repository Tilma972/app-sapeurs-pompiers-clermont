import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Play } from "lucide-react";
import { StartTourneeButton } from "@/components/start-tournee-button";
import { getEquipesRanking } from "@/lib/supabase/equipes";
import { getActiveTourneeWithTransactions } from "@/lib/supabase/tournee";
import { FocusedContainer } from "@/components/layouts/focused/focused-container";
import { TeamsLeaderboardProgress, type Team } from "@/components/charts/teams-leaderboard-progress";

export default async function CalendriersPage() {
  const supabase = await createClient();
  
  // Auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // 1) Récupération des données
  // Attendu (à adapter): chaque item du ranking doit fournir id, name,
  // goal_total (objectif calendriers), achieved (distribués), amount_collected (montant €)
  const ranking = await getEquipesRanking();
  
  // Vérification s'il y a une tournée active
  const tourneeData = await getActiveTourneeWithTransactions();
  const hasActiveTournee = tourneeData && tourneeData.tournee;

  // 2) Mapping vers l'API du composant
  const teams: Team[] = (ranking ?? []).map((r) => ({
    id: String(r.rang), // Utilise le rang comme ID unique
    name: r.equipe_nom ?? "Équipe",
    goalTotal: 50, // Objectif standard, à adapter selon vos besoins
    achieved: Number(r.calendriers_distribues ?? 0),
    amountCollected: Number(r.montant_collecte ?? 0),
  }));

  // 3) Fallback démo (si aucune donnée)
  const demoIfEmpty: Team[] = [
    { id: "a", name: "Équipe Alpha", goalTotal: 50, achieved: 48, amountCollected: 1560 },
    { id: "b", name: "Équipe Beta", goalTotal: 60, achieved: 45, amountCollected: 1420 },
    { id: "c", name: "Équipe Gamma", goalTotal: 40, achieved: 28, amountCollected: 980 },
    { id: "d", name: "Équipe Delta", goalTotal: 55, achieved: 33, amountCollected: 1200 },
    { id: "e", name: "Équipe Epsilon", goalTotal: 45, achieved: 18, amountCollected: 720 },
  ];

  const data = teams.length > 0 ? teams : demoIfEmpty;

  return (
    <FocusedContainer>
      <div className="space-y-6">
        <section className="space-y-2 -mt-2 sm:mt-0">
          <h1 className="text-2xl font-semibold">Calendriers</h1>
          <p className="text-sm text-muted-foreground">
            Suivi en temps réel des objectifs et du classement des équipes
          </p>
        </section>

        {/* Carte d'action pour continuer/démarrer une tournée */}
        {hasActiveTournee && (
          <Card>
            <CardContent className="pt-6">
              <Link href="/ma-tournee">
                <Button className="w-full h-10 sm:h-12 text-sm sm:text-base font-semibold">
                  <Play className="h-4 w-4 mr-2" />
                  Continuer ma tournée
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {!hasActiveTournee && (
          <Card>
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 sm:w-12 sm:h-12 bg-primary rounded-xl flex items-center justify-center text-primary-foreground">
                  <Play className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg">Prêt pour une nouvelle tournée ?</CardTitle>
                  <CardDescription>
                    Bonjour, {user.email?.split("@")[0]}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <StartTourneeButton />
            </CardContent>
          </Card>
        )}

        {/* Visual separator with visible label and optional explanatory text */}
        <div className="py-2">
          <div className="text-sm text-muted-foreground mb-2 text-center">Objectifs et progression</div>
          <hr className="border-t border-muted" />
          <div className="mt-2 text-xs text-muted-foreground text-center">
            {`Cette vue compare les équipes sur la même échelle d'objectif pour une lecture rapide.`}
          </div>
        </div>

        {/* Classement des équipes (barres horizontales + toggle Calendriers/€) */}
        <TeamsLeaderboardProgress teams={data} className="shadow-sm" />
      </div>
    </FocusedContainer>
  );
}