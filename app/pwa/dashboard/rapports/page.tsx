import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FocusedContainer } from "@/components/layouts/focused/focused-container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/kpi-card";
import { getUserPersonalStats, getUserHistory, getLastCompletedTourneeSummary } from "@/lib/supabase/tournee";

export default async function RapportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [stats, history, lastTour] = await Promise.all([
    getUserPersonalStats(),
    getUserHistory(),
    getLastCompletedTourneeSummary(),
  ]);

  const currency = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  const numberFr = new Intl.NumberFormat("fr-FR");

  return (
    <FocusedContainer>
      <div className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-lg font-semibold">Mes détails</h1>
            <p className="text-xs text-muted-foreground">Statistiques personnelles et historique de mes tournées</p>
          </div>
        </div>

        {/* Dernière tournée */}
        <Card className="bg-card border border-border shadow-sm">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Dernière tournée</CardTitle>
            <CardDescription>Résumé de la dernière tournée terminée</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {lastTour ? (
              <div className="grid grid-cols-4 gap-2 sm:gap-4 items-end">
                <div>
                  <div className="text-xs text-muted-foreground">Date</div>
                  <div className="text-sm font-medium">{new Date(lastTour.date).toLocaleDateString("fr-FR")}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Calendriers</div>
                  <div className="text-lg font-semibold">{numberFr.format(lastTour.calendarsDistributed)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Collecté</div>
                  <div className="text-lg font-semibold">{currency.format(Math.max(0, Math.trunc(lastTour.amountCollected)))}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Reçus émis</div>
                  <div className="text-lg font-semibold">{numberFr.format(lastTour.receiptsCount)}</div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">Aucune tournée terminée</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border border-border shadow-sm">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Mes indicateurs</CardTitle>
            <CardDescription>Vue d’ensemble</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <KpiCard title="Distribués" value={numberFr.format(Math.max(0, stats?.totalCalendarsDistributed ?? 0))} subtitle="calendriers" />
              <KpiCard title="Collecté" value={currency.format(Math.max(0, Math.trunc(stats?.totalAmountCollected ?? 0)))} subtitle="total" />
              <KpiCard title="Moyenne" value={currency.format(Number.isFinite(stats?.averagePerCalendar ?? 0) ? Number((stats?.averagePerCalendar ?? 0).toFixed(1)) : 0)} subtitle="par calendrier" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border shadow-sm">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Historique récent</CardTitle>
            <CardDescription>Dernières tournées terminées</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {history.length > 0 ? (
              <div className="space-y-2">
                {history.map((tournee, index) => (
                  <div key={tournee.id} className="flex items-center justify-between p-2 bg-muted/40 rounded border border-border/50">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-emerald-200 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-emerald-800">{index + 1}</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{new Date(tournee.date).toLocaleDateString("fr-FR")}</div>
                        <div className="text-[11px] text-muted-foreground">{numberFr.format(tournee.calendarsDistributed)} calendriers</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-foreground">{currency.format(Math.max(0, Math.trunc(tournee.amountCollected || 0)))}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">Aucune tournée terminée</div>
            )}
          </CardContent>
        </Card>
      </div>
    </FocusedContainer>
  );
}
