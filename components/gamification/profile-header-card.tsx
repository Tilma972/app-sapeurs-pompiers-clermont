"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CalendarDays, MapPin, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileHeaderCardProps {
    userName: string;
    equipeNom: string;
    avatarUrl?: string;
    memberSince: string;
    stats: {
        calendriersTotal: number;
        tourneesTotal: number;
        montantTotal: number;
    };
    niveau: {
        current: number;
        titre: string;
    };
    className?: string;
}

export function ProfileHeaderCard({
    userName,
    equipeNom,
    avatarUrl,
    memberSince,
    stats,
    niveau,
    className,
}: ProfileHeaderCardProps) {
    // Formatter la date
    const date = new Date(memberSince);
    const formattedDate = new Intl.DateTimeFormat("fr-FR", {
        month: "short",
        year: "numeric",
    }).format(date);

    return (
        <Card className={cn("relative overflow-hidden border-border bg-card", className)}>
            {/* Background Gradient Accent */}
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-blue-600/20 to-cyan-500/20" />

            <div className="relative pt-12 pb-6 px-6 flex flex-col items-center text-center">
                {/* Avatar avec Badge Niveau */}
                <div className="relative mb-4">
                    <Avatar className="w-28 h-28 border-4 border-background shadow-xl">
                        <AvatarImage src={avatarUrl} alt={userName} />
                        <AvatarFallback className="text-2xl font-bold bg-muted text-muted-foreground">
                            {userName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

                    <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-background shadow-sm flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        <span>Niv. {niveau.current}</span>
                    </div>
                </div>

                {/* User Info */}
                <h2 className="text-2xl font-bold text-foreground">{userName}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 mb-4">
                    <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {equipeNom}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        Membre depuis {formattedDate}
                    </span>
                </div>

                {/* Rank Badge */}
                <Badge variant="secondary" className="mb-6 px-4 py-1 text-sm bg-secondary/50 hover:bg-secondary/60">
                    {niveau.titre}
                </Badge>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-3 gap-4 w-full max-w-md border-t border-border pt-4">
                    <div className="flex flex-col">
                        <span className="text-2xl font-bold text-foreground">{stats.calendriersTotal}</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Calendriers</span>
                    </div>
                    <div className="flex flex-col border-l border-border">
                        <span className="text-2xl font-bold text-foreground">{stats.tourneesTotal}</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Tournées</span>
                    </div>
                    <div className="flex flex-col border-l border-border">
                        <span className="text-2xl font-bold text-foreground">{Math.round(stats.montantTotal)}€</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Collecté</span>
                    </div>
                </div>
            </div>
        </Card>
    );
}
