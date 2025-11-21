"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Edit } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Zone {
  id: string;
  code_zone: string;
  nom_zone: string;
  description?: string | null;
  population_estimee: number | null;
  nb_calendriers_distribues: number | null;
  statut: string;
  notes?: string | null;
}

interface ZoneEditDialogProps {
  zone: Zone;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ZoneEditDialog({ zone, open, onOpenChange }: ZoneEditDialogProps) {
  const router = useRouter();
  const [statut, setStatut] = useState(zone.statut);
  const [nbCalendriersDistribues, setNbCalendriersDistribues] = useState(
    zone.nb_calendriers_distribues?.toString() || "0"
  );
  const [notes, setNotes] = useState(zone.notes || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async () => {
    setIsLoading(true);

    try {
      const supabase = createClient();

      const updateData = {
        statut,
        nb_calendriers_distribues: parseInt(nbCalendriersDistribues) || 0,
        notes: notes.trim() || null,
        // Mettre à jour les dates selon le statut
        ...(statut === "En cours" && !zone.notes && {
          date_debut_tournee: new Date().toISOString(),
        }),
        ...(statut === "Terminé" && {
          date_fin_tournee: new Date().toISOString(),
        }),
      };

      const { error } = await supabase
        .from("zones_tournees")
        .update(updateData)
        .eq("id", zone.id);

      if (error) throw error;

      toast.success("Zone mise à jour avec succès");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Error updating zone:", error);
      toast.error("Erreur lors de la mise à jour de la zone");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Modifier la zone
          </DialogTitle>
          <DialogDescription>
            Modifier les informations de la zone {zone.code_zone} - {zone.nom_zone}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="statut">Statut</Label>
            <Select value={statut} onValueChange={setStatut}>
              <SelectTrigger id="statut">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="À faire">○ À faire</SelectItem>
                <SelectItem value="En cours">⏳ En cours</SelectItem>
                <SelectItem value="Terminé">✓ Terminé</SelectItem>
                <SelectItem value="Annulé">✕ Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="calendriers">Calendriers distribués</Label>
            <Input
              id="calendriers"
              type="number"
              min="0"
              value={nbCalendriersDistribues}
              onChange={(e) => setNbCalendriersDistribues(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Population estimée: {zone.population_estimee?.toLocaleString() || 0} habitants
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes de terrain</Label>
            <Textarea
              id="notes"
              placeholder="Difficultés rencontrées, observations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Notes visibles uniquement par les administrateurs
            </p>
          </div>

          {statut === "Terminé" && (
            <div className="rounded-lg bg-green-50 dark:bg-green-950 p-3 text-sm">
              <p className="text-green-800 dark:text-green-200">
                ✓ La date de fin de tournée sera automatiquement enregistrée
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Annuler
          </Button>
          <Button onClick={handleUpdate} disabled={isLoading}>
            {isLoading ? "Mise à jour..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
