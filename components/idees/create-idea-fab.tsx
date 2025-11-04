/**
 * CreateIdeaFab - Floating Action Button pour créer une idée
 * Avec menu pour choisir entre texte ou vocal
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function CreateIdeaFab() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-20 right-4 z-40 md:bottom-6">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
            aria-label="Créer une idée"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={() => {
              setOpen(false);
              router.push("/idees/nouvelle");
            }}
            className="cursor-pointer"
          >
            <Edit className="mr-2 h-4 w-4" />
            <div>
              <div className="font-medium">Idée Texte</div>
              <div className="text-xs text-muted-foreground">
                Écrire une idée
              </div>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setOpen(false);
              router.push("/idees/enregistrer");
            }}
            className="cursor-pointer"
          >
            <Mic className="mr-2 h-4 w-4" />
            <div>
              <div className="font-medium">Idée Vocale</div>
              <div className="text-xs text-muted-foreground">
                Enregistrer une idée
              </div>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
