"use client";

import { TrendingUp } from "lucide-react";
import React from "react";

type TeamProgress = {
  equipe_nom: string;
  progression_pourcentage: number;
  montant_collecte: number;
  calendriers_distribues: number;
};

interface TeamsProgressListProps {
  items: TeamProgress[];
  limit?: number;
  compact?: boolean;
}

const rankBorder = (index: number) => {
  switch (index) {
    case 0:
      return "border-l-yellow-500";
    case 1:
      return "border-l-gray-400";
    case 2:
      return "border-l-orange-400";
    case 3:
      return "border-l-blue-400";
    default:
      return "border-l-purple-400";
  }
};

export default function TeamsProgressList({ items, limit, compact = true }: TeamsProgressListProps) {
  const currency = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
  const numberFr = new Intl.NumberFormat("fr-FR");

  const list = Array.isArray(items) ? items : [];
  const visible = typeof limit === "number" ? list.slice(0, Math.max(0, limit)) : list;

  if (visible.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-50" />
        <p>Aucune donnée d’équipe pour le moment</p>
        <p className="text-xs">Les statistiques apparaîtront ici</p>
      </div>
    );
  }

  const containerGap = compact ? "gap-2" : "gap-3";
  const cardPadding = compact ? "p-3" : "p-4";

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${containerGap}`}>
      {visible.map((equipe, index) => {
        const pct = Math.max(0, Math.min(100, Math.round(equipe.progression_pourcentage || 0)));
        return (
          <div
            key={`${equipe.equipe_nom}-${index}`}
            className={`rounded-lg border border-border/50 bg-muted ${rankBorder(index)} border-l-4 ${cardPadding}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {index === 0 && <TrendingUp className="h-4 w-4 text-yellow-600" />}
                <span className="font-medium text-sm text-foreground line-clamp-1">
                  {equipe.equipe_nom}
                </span>
              </div>
              <span className="text-xs font-semibold text-muted-foreground">#{index + 1}</span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Progression</span>
                <span>{pct}%</span>
              </div>
              <div className={compact ? "w-full rounded-full h-1.5 bg-muted-foreground/20" : "w-full rounded-full h-2 bg-muted-foreground/20"}>
                <div
                  role="progressbar"
                  aria-label={`Progression de l’équipe ${equipe.equipe_nom}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={pct}
                  className={`rounded-full transition-all duration-500 ${compact ? "h-1.5" : "h-2"} ${
                    index === 0
                      ? "bg-yellow-500"
                      : index === 1
                      ? "bg-gray-400"
                      : index === 2
                      ? "bg-orange-400"
                      : index === 3
                      ? "bg-blue-400"
                      : "bg-purple-400"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between items-center mt-1.5 text-xs text-muted-foreground">
              <span>{currency.format(equipe.montant_collecte || 0)}</span>
              <span>{numberFr.format(equipe.calendriers_distribues || 0)} cal.</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
