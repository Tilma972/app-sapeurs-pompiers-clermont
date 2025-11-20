"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface EquipeStats {
  id: string;
  nom: string;
  secteur: string;
  couleur: string;
  numero: number | null;
  stats: {
    total_zones: number;
    zones_a_faire: number;
    zones_en_cours: number;
    zones_terminees: number;
    total_population: number;
    total_calendriers_alloues: number;
    total_calendriers_distribues: number;
    progression_pct: number;
  };
}

interface ZonesStatsProps {
  equipes: EquipeStats[];
}

export function ZonesStats({ equipes }: ZonesStatsProps) {
  // Filtrer les équipes qui ont des zones
  const equipesAvecZones = equipes.filter(e => e.stats.total_zones > 0);

  if (equipesAvecZones.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {equipesAvecZones.map((equipe) => (
        <Card key={equipe.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                {equipe.nom}
              </CardTitle>
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: equipe.couleur }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{equipe.secteur}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Progression */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progression</span>
                <span className="font-medium">
                  {equipe.stats.progression_pct.toFixed(0)}%
                </span>
              </div>
              <Progress
                value={equipe.stats.progression_pct}
                className="h-2"
              />
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="space-y-1">
                <p className="text-muted-foreground">Zones</p>
                <p className="font-semibold">{equipe.stats.total_zones}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Population</p>
                <p className="font-semibold">
                  {equipe.stats.total_population.toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Calendriers</p>
                <p className="font-semibold">
                  {equipe.stats.total_calendriers_distribues}/
                  {equipe.stats.total_calendriers_alloues}
                </p>
              </div>
            </div>

            {/* Statuts */}
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="outline" className="text-green-600 border-green-600">
                ✓ {equipe.stats.zones_terminees}
              </Badge>
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                ⏳ {equipe.stats.zones_en_cours}
              </Badge>
              <Badge variant="outline" className="text-gray-600 border-gray-600">
                ○ {equipe.stats.zones_a_faire}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
