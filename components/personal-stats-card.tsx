"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";

type HistoryItem = {
  id: string;
  date: string;
  calendarsDistributed: number;
  amountCollected: number;
};

type Props = {
  calendarsRemaining: number;
  totalAmountCollected: number;
  averagePerCalendar: number;
  userHistory: HistoryItem[];
};

export function PersonalStatsCard({
  calendarsRemaining,
  totalAmountCollected,
  averagePerCalendar,
  userHistory,
}: Props) {
  const [open, setOpen] = useState(false);
  const contentId = useId();

  const currency = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  const numberFr = new Intl.NumberFormat("fr-FR");

  return (
    <Card className="bg-card border border-border shadow-sm">
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 sm:w-12 sm:h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
              <Target className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg">Mon activité</CardTitle>
              <CardDescription>Statistiques et historique personnels</CardDescription>
            </div>
          </div>
          <div className="shrink-0">
            <Button
              variant="outline"
              size="sm"
              aria-expanded={open}
              aria-controls={contentId}
              onClick={() => setOpen((v) => !v)}
              className="h-8"
            >
              {open ? "Masquer" : "Voir mes détails"}
            </Button>
          </div>
        </div>
      </CardHeader>
      {open && (
        <CardContent id={contentId} className="pt-0">
          {/* Indicateurs personnels */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <KpiCard
              title="Restant"
              value={numberFr.format(Math.max(0, calendarsRemaining))}
              subtitle="calendriers"
            />
            <KpiCard
              title="Collecté"
              value={currency.format(Math.max(0, Math.trunc(totalAmountCollected)))}
              subtitle="total"
            />
            <KpiCard
              title="Moyenne"
              value={currency.format(
                Number.isFinite(averagePerCalendar) ? Number(averagePerCalendar.toFixed(1)) : 0
              )}
              subtitle="par calendrier"
            />
          </div>

          {/* Historique récent */}
          <div className="mt-4 sm:mt-5">
            <div className="text-xs text-muted-foreground mb-2">Historique récent</div>
            {userHistory.length > 0 ? (
              <div className="space-y-2">
                {userHistory.slice(0, 3).map((tournee, index) => (
                  <div
                    key={tournee.id}
                    className="flex items-center justify-between p-2 bg-muted/40 rounded border border-border/50"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-emerald-200 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-emerald-800">{index + 1}</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {new Date(tournee.date).toLocaleDateString("fr-FR")}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {numberFr.format(tournee.calendarsDistributed)} calendriers
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-foreground">
                        {currency.format(Math.max(0, Math.trunc(tournee.amountCollected || 0)))}
                      </div>
                    </div>
                  </div>
                ))}
                {userHistory.length > 3 && (
                  <div className="text-center">
                    <Link
                      href="/dashboard/rapports"
                      className="text-xs text-muted-foreground underline underline-offset-4"
                    >
                      Voir tout l’historique
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">Aucune tournée terminée</div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
