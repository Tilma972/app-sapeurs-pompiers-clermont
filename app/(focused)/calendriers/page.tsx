import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Play, Medal } from "lucide-react";
import { StartTourneeButton } from "@/components/start-tournee-button";
import { getEquipesRanking, getAllEquipesStats } from "@/lib/supabase/equipes";
import { getActiveTourneeWithTransactions, getUserHistory, getUserPersonalStats } from "@/lib/supabase/tournee";
import { FocusedContainer } from "@/components/layouts/focused/focused-container";
import { TeamsLeaderboardProgress, type Team } from "@/components/charts/teams-leaderboard-progress";
import { KpiCard } from "@/components/kpi-card";
import { getCurrentUserProfile } from "@/lib/supabase/profile";

export default async function CalendriersPage() {
  const supabase = await createClient();
  
  // Auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // 1) Récupération des données
  // Attendu (à adapter): chaque item du ranking doit fournir id, name,
  // goal_total (objectif calendriers), achieved (distribués), amount_collected (montant €)
  const [ranking, tourneeData, userHistory, personalStats, profile] = await Promise.all([
    getEquipesRanking(),
    getActiveTourneeWithTransactions(),
    getUserHistory(),
    getUserPersonalStats(),
    getCurrentUserProfile(),
  ]);
  
  // Vérification s'il y a une tournée active
  const hasActiveTournee = tourneeData && tourneeData.tournee;

  // 2) Mapping vers l'API du composant (objectif déduit via progression)
  let teams: Team[] = (ranking ?? []).map((r) => {
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

  // Fallback: si aucun ranking disponible, utiliser les stats d'équipes pour peupler la liste
  if (teams.length === 0) {
    const allStats = await getAllEquipesStats();
    teams = (allStats ?? []).map((s) => ({
      id: s.equipe_id || s.equipe_nom || Math.random().toString(36).slice(2),
      name: s.equipe_nom || "Équipe",
      goalTotal: Number(s.calendriers_alloues ?? Math.max(50, Number(s.calendriers_distribues || 0))),
      achieved: Number(s.calendriers_distribues || 0),
      amountCollected: Number(s.montant_collecte || 0),
    }));
  }

  // 3) Historique personnel (3 dernières tournées) — déjà récupéré en parallèle

  // 4) KPIs utilisateur (global)
  const totalCalendars = personalStats?.totalCalendarsDistributed ?? 0;
  const totalAmount = personalStats?.totalAmountCollected ?? 0;
  const averagePerCalendar = totalCalendars > 0 ? totalAmount / totalCalendars : 0;

  // Rang de l'utilisateur dans son équipe (par montant collecté)
  let teamRank: number | null = null;
  if (profile?.team_id) {
    const { data: teamMembers } = await supabase
      .from('profiles_with_equipe_view')
      .select('id, montant_collecte')
      .eq('equipe_id', profile.team_id)
      .order('montant_collecte', { ascending: false });
    const members = (teamMembers || []) as Array<{ id: string; montant_collecte: number | null }>;
    const index = members.findIndex((m) => m.id === user.id);
    teamRank = index >= 0 ? index + 1 : null;
  }

  // Affichage du rang avec médaille pour 1/2/3
  const rankValue = (() => {
    if (!teamRank) return "-";
    const suffix = teamRank === 1 ? "er" : "e";
    if (teamRank === 1 || teamRank === 2 || teamRank === 3) {
      const color = teamRank === 1 ? "text-amber-400" : teamRank === 2 ? "text-zinc-300" : "text-orange-500";
      return (
        <span className="inline-flex items-center gap-2">
          <Medal className={`h-5 w-5 ${color}`} />
          {`${teamRank}${suffix}`}
        </span>
      );
    }
    return `${teamRank}${suffix}`;
  })();

  return (
    <FocusedContainer>
      <div className="space-y-6">
        <section className="space-y-2">
          <div className="text-sm text-muted-foreground mb-2 text-center">Suivi de ton activité en cours.</div>
        </section>

        {/* KPIs utilisateur global */}
        <section className="grid grid-cols-2 gap-3">
          <KpiCard title="Total calendriers" value={new Intl.NumberFormat("fr-FR").format(totalCalendars)} />
          <KpiCard title="Montant total" value={new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(totalAmount)} />
          <KpiCard title="Rang équipe" value={rankValue} />
          <KpiCard title="Moyenne/calendrier" value={new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(averagePerCalendar)} />
        </section>

        {/* Bouton d'action simple (sans carte) */}
        {hasActiveTournee ? (
          <Link href="/ma-tournee">
            <Button className="w-full h-10 sm:h-12 text-sm sm:text-base font-semibold">
              <Play className="h-4 w-4 mr-2" />
              Continuer ma tournée
            </Button>
          </Link>
        ) : (
          <div className="py-2">
            <StartTourneeButton />
          </div>
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
