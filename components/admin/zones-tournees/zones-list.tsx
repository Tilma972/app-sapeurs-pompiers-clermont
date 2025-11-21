"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, UserPlus, Edit } from "lucide-react";
import { ZoneAssignDialog } from "./zone-assign-dialog";
import { ZoneEditDialog } from "./zone-edit-dialog";

interface Zone {
  id: string;
  code_zone: string;
  nom_zone: string;
  population_estimee: number | null;
  nb_calendriers_alloues: number | null;
  nb_calendriers_distribues: number | null;
  statut: string;
  equipe_nom: string | null;
  equipe_secteur: string | null;
  equipe_couleur: string | null;
  pompier_id: string | null;
  pompier_nom: string | null;
  progression_pct: number | null;
}

interface Pompier {
  id: string;
  full_name: string;
  email: string;
  team_id: string | null;
}

interface Equipe {
  id: string;
  nom: string;
  secteur: string;
  couleur: string;
  numero: number | null;
}

interface ZonesListProps {
  zones: Zone[];
  pompiers: Pompier[];
  equipes?: Equipe[]; // Not used currently but kept for future features
}

export function ZonesList({ zones, pompiers }: ZonesListProps) {
  const [search, setSearch] = useState("");
  const [secteurFilter, setSecteurFilter] = useState<string>("all");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [pompierFilter, setPompierFilter] = useState<string>("all");
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Filtrer les zones
  const filteredZones = useMemo(() => {
    return zones.filter((zone) => {
      // Filtre recherche
      const searchLower = search.toLowerCase();
      const matchSearch =
        search === "" ||
        zone.code_zone.toLowerCase().includes(searchLower) ||
        zone.nom_zone.toLowerCase().includes(searchLower) ||
        zone.equipe_nom?.toLowerCase().includes(searchLower);

      // Filtre secteur
      const matchSecteur =
        secteurFilter === "all" || zone.equipe_secteur === secteurFilter;

      // Filtre statut
      const matchStatut = statutFilter === "all" || zone.statut === statutFilter;

      // Filtre pompier
      const matchPompier =
        pompierFilter === "all" ||
        (pompierFilter === "unassigned" && !zone.pompier_id) ||
        zone.pompier_id === pompierFilter;

      return matchSearch && matchSecteur && matchStatut && matchPompier;
    });
  }, [zones, search, secteurFilter, statutFilter, pompierFilter]);

  // Secteurs uniques
  const secteurs = useMemo(() => {
    const unique = new Set(zones.map((z) => z.equipe_secteur).filter((s): s is string => s !== null));
    return Array.from(unique).sort();
  }, [zones]);

  // Statuts uniques
  const statuts = useMemo(() => {
    const unique = new Set(zones.map((z) => z.statut));
    return Array.from(unique).sort();
  }, [zones]);

  const handleAssign = (zone: Zone) => {
    setSelectedZone(zone);
    setAssignDialogOpen(true);
  };

  const handleEdit = (zone: Zone) => {
    setSelectedZone(zone);
    setEditDialogOpen(true);
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "Terminé":
        return (
          <Badge variant="default" className="bg-green-600">
            ✓ Terminé
          </Badge>
        );
      case "En cours":
        return (
          <Badge variant="secondary" className="bg-orange-600 text-white">
            ⏳ En cours
          </Badge>
        );
      case "À faire":
        return <Badge variant="outline">○ À faire</Badge>;
      case "Annulé":
        return (
          <Badge variant="destructive" className="bg-red-600">
            ✕ Annulé
          </Badge>
        );
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par code, nom, équipe..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <Select value={secteurFilter} onValueChange={setSecteurFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Tous les secteurs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les secteurs</SelectItem>
            {secteurs.map((secteur) => (
              <SelectItem key={secteur} value={secteur}>
                {secteur}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statutFilter} onValueChange={setStatutFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {statuts.map((statut) => (
              <SelectItem key={statut} value={statut}>
                {statut}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={pompierFilter} onValueChange={setPompierFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Tous les pompiers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les pompiers</SelectItem>
            <SelectItem value="unassigned">Non assignés</SelectItem>
            {pompiers.map((pompier) => (
              <SelectItem key={pompier.id} value={pompier.id}>
                {pompier.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Résultats */}
      <div className="text-sm text-muted-foreground">
        {filteredZones.length} zone(s) trouvée(s)
      </div>

      {/* Tableau */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Nom de la zone</TableHead>
              <TableHead>Secteur</TableHead>
              <TableHead>Pompier</TableHead>
              <TableHead className="text-right">Population</TableHead>
              <TableHead className="text-right">Calendriers</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredZones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  Aucune zone trouvée
                </TableCell>
              </TableRow>
            ) : (
              filteredZones.map((zone) => (
                <TableRow key={zone.id}>
                  <TableCell className="font-medium">{zone.code_zone}</TableCell>
                  <TableCell>{zone.nom_zone}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: zone.equipe_couleur || '#888' }}
                      />
                      <span className="text-sm">{zone.equipe_nom || '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {zone.pompier_nom ? (
                      <span className="text-sm">{zone.pompier_nom}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">
                        Non assigné
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {zone.population_estimee?.toLocaleString() || 0}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="space-y-1">
                      <div className="text-sm">
                        {zone.nb_calendriers_distribues || 0}/
                        {zone.nb_calendriers_alloues || 0}
                      </div>
                      {zone.progression_pct !== null && (
                        <div className="text-xs text-muted-foreground">
                          {zone.progression_pct.toFixed(0)}%
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatutBadge(zone.statut)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleAssign(zone)}
                        title="Assigner un pompier"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(zone)}
                        title="Modifier la zone"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      {selectedZone && (
        <>
          <ZoneAssignDialog
            zone={selectedZone}
            pompiers={pompiers}
            open={assignDialogOpen}
            onOpenChange={setAssignDialogOpen}
          />
          <ZoneEditDialog
            zone={selectedZone}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
          />
        </>
      )}
    </div>
  );
}
