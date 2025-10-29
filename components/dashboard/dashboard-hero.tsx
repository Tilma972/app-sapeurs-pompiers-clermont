"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export type DashboardHeroProps = {
  userName: string;
  teamName?: string | null;
  distributed: number;
  allocated?: number | null;
};

export function DashboardHero({ userName, teamName, distributed, allocated }: DashboardHeroProps) {
  const target = allocated ?? 0;
  const pct = target > 0 ? Math.min(100, Math.round((distributed / target) * 100)) : 0;
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s.charAt(0).toUpperCase())
    .join("");

  return (
    <Card className="relative overflow-hidden border-border/60 bg-card">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-10 -top-10 size-40 rounded-full blur-2xl opacity-20 bg-gradient-to-br from-sky-500 to-blue-600"
      />
      <CardHeader>
        <div className="flex items-start gap-3">
          <Avatar>
            <AvatarFallback>{initials || "SP"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">Bonjour {userName}</CardTitle>
            <CardDescription className="truncate">
              {teamName ? (
                <span className="inline-flex items-center gap-2">
                  <span>Équipe</span>
                  <Badge variant="secondary" className="bg-secondary/80">
                    {teamName}
                  </Badge>
                </span>
              ) : (
                <span className="text-muted-foreground">Aucune équipe</span>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardFooter className="flex w-full flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Progression</span>
          <span>
            {distributed.toLocaleString("fr-FR")} / {target.toLocaleString("fr-FR")} calendriers
          </span>
        </div>
        <Progress value={pct} />
      </CardFooter>
    </Card>
  );
}

export default DashboardHero;
