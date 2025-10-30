import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Play } from "lucide-react";
import { StartTourneeButton } from "@/components/start-tournee-button";
import { getEquipesRanking } from "@/lib/supabase/equipes";
import { getActiveTourneeWithTransactions, getUserHistory } from "@/lib/supabase/tournee";
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

  // 2) Mapping vers l'API du composant (objectif déduit via progression)
  const teams: Team[] = (ranking ?? []).map((r) => {
    const achieved = Number(r.calendriers_distribues ?? 0)
    const pct = Number(r.progression_pourcentage ?? 0)
    const goalFromPct = pct > 0 ? Math.ceil(achieved / (pct / 100)) : null
    const goalTotal = goalFromPct ?? Math.max(50, achieved) // fallback lisible
    return {
      id: String(r.rang),
      name: r.equipe_nom ?? "Équipe",
      goalTotal,
      achieved,
      amountCollected: Number(r.montant_collecte ?? 0),
    }
  });

  // 3) Historique personnel (3 dernières tournées)
  const userHistory = await getUserHistory();

  return (
    <FocusedContainer>
      <div className="space-y-6">
        <section className="space-y-2">
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

        {/* Historique de la tournée (collapsible) */}
        <details className="rounded-lg border bg-card p-4">
          <summary className="cursor-pointer select-none font-medium">Historique de la tournée</summary>
          <div className="mt-3 space-y-2 text-sm">
            {userHistory.length === 0 && (
              <div className="text-muted-foreground">Aucune tournée terminée récemment.</div>
            )}
            {userHistory.map((h) => (
              <div key={h.id} className="flex items-center justify-between">
                <span className="text-foreground/90">
                  {new Date(h.date).toLocaleDateString("fr-FR")}
                </span>
                <span className="text-muted-foreground">
                  {h.calendarsDistributed} calendriers · {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(h.amountCollected)}
                </span>
              </div>
            ))}
          </div>
        </details>

        {/* Classement des équipes (barres horizontales + toggle Calendriers/€) */}
        <TeamsLeaderboardProgress teams={teams} className="shadow-sm" />
      </div>
    </FocusedContainer>
  );
}
