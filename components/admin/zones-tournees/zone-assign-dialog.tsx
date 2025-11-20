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
import { UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Zone {
  id: string;
  code_zone: string;
  nom_zone: string;
  pompier_id: string | null;
  pompier_nom: string | null;
}

interface Pompier {
  id: string;
  full_name: string;
  email: string;
  team_id: string | null;
}

interface ZoneAssignDialogProps {
  zone: Zone;
  pompiers: Pompier[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ZoneAssignDialog({
  zone,
  pompiers,
  open,
  onOpenChange,
}: ZoneAssignDialogProps) {
  const router = useRouter();
  const [selectedPompierId, setSelectedPompierId] = useState<string>(
    zone.pompier_id || "unassigned"
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleAssign = async () => {
    setIsLoading(true);

    try {
      const supabase = createClient();

      const updateData: { pompier_id: string | null } = {
        pompier_id: selectedPompierId === "unassigned" ? null : selectedPompierId,
      };

      const { error } = await supabase
        .from("zones_tournees")
        .update(updateData)
        .eq("id", zone.id);

      if (error) throw error;

      toast.success("Pompier assigné avec succès");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Error assigning pompier:", error);
      toast.error("Erreur lors de l'assignation du pompier");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Assigner un pompier
          </DialogTitle>
          <DialogDescription>
            Assigner un pompier à la zone {zone.code_zone} - {zone.nom_zone}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="pompier">Pompier</Label>
            <Select value={selectedPompierId} onValueChange={setSelectedPompierId}>
              <SelectTrigger id="pompier">
                <SelectValue placeholder="Sélectionner un pompier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">
                  <span className="text-muted-foreground italic">Non assigné</span>
                </SelectItem>
                {pompiers.map((pompier) => (
                  <SelectItem key={pompier.id} value={pompier.id}>
                    {pompier.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPompierId !== "unassigned" && (
              <p className="text-xs text-muted-foreground">
                Email: {pompiers.find((p) => p.id === selectedPompierId)?.email}
              </p>
            )}
          </div>

          {zone.pompier_nom && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="text-muted-foreground">
                Pompier actuellement assigné:{" "}
                <span className="font-medium text-foreground">{zone.pompier_nom}</span>
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Annuler
          </Button>
          <Button onClick={handleAssign} disabled={isLoading}>
            {isLoading ? "Assignation..." : "Assigner"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
