"use client";

import { Button } from "@/components/ui/button";
import { Home, Shield } from "lucide-react";
import Link from "next/link";

interface ViewToggleProps {
  /**
   * Le mode d'affichage actuel
   * - "landing": Utilisateur sur la landing page → affiche le bouton vers la PWA
   * - "pwa": Utilisateur dans la PWA → affiche le bouton vers la landing
   */
  currentView: "landing" | "pwa";

  /**
   * Variante du bouton (par défaut: "outline")
   */
  variant?: "default" | "outline" | "ghost" | "link";

  /**
   * Taille du bouton (par défaut: "sm")
   */
  size?: "default" | "sm" | "lg" | "icon";

  /**
   * Afficher uniquement l'icône sans texte
   */
  iconOnly?: boolean;
}

export function ViewToggle({
  currentView,
  variant = "outline",
  size = "sm",
  iconOnly = false
}: ViewToggleProps) {

  if (currentView === "landing") {
    // Sur la landing page → bouton vers la PWA
    return (
      <Button asChild variant={variant} size={size}>
        <Link href="/dashboard">
          <Shield className="h-4 w-4" />
          {!iconOnly && <span className="ml-2">Espace membre</span>}
        </Link>
      </Button>
    );
  }

  // Dans la PWA → bouton vers la landing
  return (
    <Button asChild variant={variant} size={size}>
      <Link href="/?view=landing">
        <Home className="h-4 w-4" />
        {!iconOnly && <span className="ml-2">Accueil public</span>}
      </Link>
    </Button>
  );
}
