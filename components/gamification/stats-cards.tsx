"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Calendar, Euro, Map, Trophy, TrendingUp, Users } from "lucide-react";

interface StatsCardsProps {
    stats: {
        calendriersTotal: number;
        calendriersMois?: number; // Optionnel si pas dispo
        tourneesTotal: number;
        tourneesMois?: number;
        montantTotal: number;
        montantMois?: number;
        classementEquipe?: number;
        classementGlobal?: number;
    };
    className?: string;
}

export function StatsCards({ stats, className }: StatsCardsProps) {
    const statItems = [
        {
            label: "Calendriers",
            value: stats.calendriersTotal,
            change: stats.calendriersMois ? `+${stats.calendriersMois} ce mois` : undefined,
            icon: Calendar,
            color: "text-blue-500",
        },
        {
            label: "Tournées",
            value: stats.tourneesTotal,
            change: stats.tourneesMois ? `+${stats.tourneesMois} ce mois` : undefined,
            icon: Map,
            color: "text-green-500",
        },
        {
            label: "Collecté",
            value: `${Math.round(stats.montantTotal)}€`,
            change: stats.montantMois ? `+${stats.montantMois}€ ce mois` : undefined,
            icon: Euro,
            color: "text-yellow-500",
        },
        {
            label: "Classement",
            value: stats.classementGlobal ? `#${stats.classementGlobal}` : "-",
            subValue: stats.classementEquipe ? `#${stats.classementEquipe} équipe` : undefined,
            icon: Trophy,
            color: "text-purple-500",
        },
    ];

    return (
        <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-4", className)}>
            {statItems.map((item, index) => (
                <Card
                    key={index}
                    className="bg-card border-border hover:bg-accent/50 transition-all duration-300 group overflow-hidden relative"
                >
                    <CardContent className="p-6 flex items-start justify-between relative z-10">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">{item.label}</p>
                            <h3 className="text-3xl font-bold tracking-tight">{item.value}</h3>

                            {(item.change || item.subValue) && (
                                <div className="flex items-center gap-1 mt-2 text-xs font-medium text-muted-foreground">
                                    {item.change && (
                                        <span className="text-green-500 flex items-center gap-0.5">
                                            <TrendingUp className="w-3 h-3" />
                                            {item.change}
                                        </span>
                                    )}
                                    {item.subValue && (
                                        <span className="flex items-center gap-0.5">
                                            <Users className="w-3 h-3" />
                                            {item.subValue}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className={cn("p-3 rounded-xl bg-background/50 border border-border group-hover:scale-110 transition-transform duration-300", item.color)}>
                            <item.icon className="w-6 h-6" />
                        </div>
                    </CardContent>

                    {/* Glow effect on hover */}
                    <div className={cn(
                        "absolute -right-10 -bottom-10 w-32 h-32 rounded-full opacity-0 group-hover:opacity-10 blur-3xl transition-opacity duration-500 pointer-events-none",
                        item.color.replace("text-", "bg-")
                    )} />
                </Card>
            ))}
        </div>
    );
}
