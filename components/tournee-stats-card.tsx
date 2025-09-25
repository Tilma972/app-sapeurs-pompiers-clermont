"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";

interface GlobalStats {
  total_calendriers_distribues: number;
  total_montant_collecte: number;
  total_tournees_actives: number;
}

interface TourneeStatsCardProps {
  globalStats: GlobalStats | null;
}

export function TourneeStatsCard({ globalStats }: TourneeStatsCardProps) {
  // Valeurs par défaut si globalStats est null
  const stats = globalStats || {
    total_calendriers_distribues: 0,
    total_montant_collecte: 0,
    total_tournees_actives: 0
  };

  const currency = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });

  return (
    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer">
      <CardHeader>
        <CardDescription>Montant collecté</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums">
          {currency.format(stats.total_montant_collecte)}
        </CardTitle>
        <CardAction>
          <Badge variant="outline" className="text-green-600 border-green-200">
            <TrendingUp className="h-3 w-3 mr-1" />
            +12.5%
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="line-clamp-1 flex gap-2 font-medium">
          Tournées & Calendriers
        </div>
        <div className="text-muted-foreground">
          {stats.total_calendriers_distribues.toLocaleString("fr-FR")} calendriers distribués
        </div>
      </CardFooter>
    </Card>
  );
}

